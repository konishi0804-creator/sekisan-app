export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- Configuration ---
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.0-flash"; // Default to a stable model

export async function POST(req: NextRequest) {
    // 1. Validate Config
    if (!API_KEY) {
        return NextResponse.json(
            { error: "GEMINI_API_KEY が未設定です。.env.local を確認してください" },
            { status: 500 }
        );
    }

    try {
        // 2. Parse FormData
        const formData = await req.formData();
        const files = formData.getAll("files") as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
        }

        // 3. Initialize Gemini AI
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({
            model: MODEL_NAME,
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        // 4. Prepare Parts
        const parts = [];

        // System Prompt / Schema definition
        parts.push({
            text: `
            Analyze this construction/real estate document (PDF/Image) and extract data into the specified JSON format.
            - Output ONLY valid JSON.
            - If a field is missing/unclear, use null.
            - Do not guess.
            
            JSON Schema:
            {
              "documentMeta": { 
                "title": "string|null", 
                "issuer": "string|null (Company/Agency)", 
                "issueDate": "string|null (YYYY-MM-DD)", 
                "pageCount": "number|null" 
              },
              "planInfo": { 
                "projectName": "string|null", 
                "siteAddress": "string|null (Full address)", 
                "buildingName": "string|null", 
                "roomNo": "string|null", 
                "buildingType": "string|null (Mansion, House, Land, etc.)", 
                "structure": "string|null (RC, SRC, Wood, Steel)", 
                "floors": "string|null (e.g. 2F / 10F)", 
                "area_m2": "number|null (Land area in m2)",
                "floorArea": "number|null (Building floor area in m2)",
                "workType": "string|null (New, Renovation, etc.)",
                "roadPrice": "number|null (Road Price/Rosenka if available)",
                "age": "number|null (Building age in years)",
                "usefulLife": "number|null (Useful life in years)"
              },
              "estimate": {
                "currency": "JPY",
                "taxRate": "number|null (e.g. 0.10)",
                "items": [
                  { 
                    "section": "string|null (Category)", 
                    "name": "string (Item Name)", 
                    "spec": "string|null (Specification)", 
                    "unit": "string|null", 
                    "quantity": "number|null", 
                    "unitPrice": "number|null", 
                    "amount": "number|null", 
                    "pageRef": "string|null (Page number reference)" 
                  }
                ],
                "totals": { 
                  "subtotal": "number|null", 
                  "tax": "number|null", 
                  "grandTotal": "number|null" 
                }
              },
              "coordinates": {
                 "landArea": [number, number, number, number] | null,
                 "floorArea": [number, number, number, number] | null,
                 "structure": [number, number, number, number] | null,
                 "address": [number, number, number, number] | null,
                 "roadPrice": [number, number, number, number] | null,
                 "age": [number, number, number, number] | null
              },
              "missingFields": [
                { "field": "string", "reason": "string (Why is it missing?)", "suggestedWhereToFind": "string|null" }
              ],
              "warnings": ["string (Any ambiguities or alerts)"]
            }
            
            Key Extractions for Valuation:
            - "landArea" should be mapped to planInfo.area_m2 (Land Area).
            - "structure" should be normalized: "木造", "軽量鉄骨造", "重量鉄骨造", "RC造・SRC造".
            - "roadPrice" if explicit.

            Coordinates Instructions:
            - For "coordinates" field, provide the bounding box [ymin, xmin, ymax, xmax] of the text source in the image.
            - Coordinates must be normalized to 1000 scale (0-1000).
            - Example: [100, 200, 150, 400] means ymin=10% from top, xmin=20% from left, etc.
            - If value not found or page is not image, set to null.
            `
        });

        // File Data
        for (const file of files) {
            const arrayBuffer = await file.arrayBuffer();
            const base64Data = Buffer.from(arrayBuffer).toString("base64");
            parts.push({
                inlineData: {
                    data: base64Data,
                    mimeType: file.type
                }
            });
        }

        // 5. Generate Content with Retry (Custom Logic for 503)
        // Vertex SDK handles some retries, but we want custom control or just rely on SDK defaults.
        // SDK default is good for 503. We need to catch 429 explicitly.

        try {
            const result = await model.generateContent({
                contents: [{ role: "user", parts: parts as any }]
            });

            const response = await result.response;
            const text = response.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text) {
                throw new Error("Empty response from Vertex AI");
            }

            // Improved JSON extraction: find first '{' and last '}'
            const start = text.indexOf('{');
            const end = text.lastIndexOf('}');

            if (start === -1 || end === -1 || start > end) {
                throw new Error("Valid JSON object not found in response");
            }

            const jsonStr = text.substring(start, end + 1);
            const data = JSON.parse(jsonStr);

            return NextResponse.json(data);

        } catch (genError: any) {
            console.error("Vertex AI Generation Error:", genError);

            // Handle 429 (Resource Exhausted)
            // Vertex AI error codes: 8 is RESOURCE_EXHAUSTED
            // HTTP status might be in error.code or error.status or response

            const isQuotaError =
                genError.code === 8 || // gRPC code for Resource Exhausted
                genError.message?.includes("429") ||
                genError.message?.includes("Quota exceeded") ||
                genError.message?.includes("Resource has been exhausted");

            if (isQuotaError) {
                return NextResponse.json(
                    { error: "Google Cloud 課金/Quotaエラー: プロジェクトの課金設定またはQuotaを確認してください。(429)" },
                    { status: 429 }
                );
            }

            throw genError;
        }

    } catch (error: any) {
        console.error("API Route Error:", error);
        return NextResponse.json(
            { error: `System Error: ${error.message}` },
            { status: 500 }
        );
    }
}
