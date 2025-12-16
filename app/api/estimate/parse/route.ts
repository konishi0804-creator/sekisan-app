export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { VertexAI } from "@google-cloud/vertexai";

// --- Configuration ---
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT;
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
console.log("ENV CHECK", {
    PROJECT_ID,
    LOCATION,
    rawProject: process.env.GOOGLE_CLOUD_PROJECT,
    rawLocation: process.env.GOOGLE_CLOUD_LOCATION,
    cwd: process.cwd(),
});

const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-1.5-flash-001"; // Fallback to compatible vertex model

export async function POST(req: NextRequest) {
    // 1. Validate Config
    if (!PROJECT_ID) {
        return NextResponse.json(
            { error: "GOOGLE_CLOUD_PROJECT が未設定です。.env.local を作成してください" },
            { status: 400 }
        );
    }

    try {
        // 2. Parse FormData
        const formData = await req.formData();
        const files = formData.getAll("files") as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
        }

        // 3. Initialize Vertex AI
        const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });
        const model = vertexAI.getGenerativeModel({
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
                "workType": "string|null (New, Renovation, etc.)",
                "roadPrice": "number|null (Road Price/Rosenka if available)",
                "age": "number|null (Building age in years)"
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
              "missingFields": [
                { "field": "string", "reason": "string (Why is it missing?)", "suggestedWhereToFind": "string|null" }
              ],
              "warnings": ["string (Any ambiguities or alerts)"]
            }
            
            Key Extractions for Valuation:
            - "landArea" should be mapped to planInfo.area_m2 (Land Area).
            - "structure" should be normalized: "木造", "軽量鉄骨造", "重量鉄骨造", "RC造・SRC造".
            - "roadPrice" if explicit.
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

            // Vertex AI usually returns clean JSON with responseMimeType, but safeguards are good.
            const jsonStr = text.replace(/```json\n?|\n?```/g, "").trim();
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
