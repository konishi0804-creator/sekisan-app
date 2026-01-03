export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createWorker } from "tesseract.js";
import { Jimp } from "jimp";

// --- Configuration ---
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.0-flash-exp"; // Upgrade to 2.0 Flash Exp for SOTA Vision

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
                "usefulLife": "number|null (Useful life in years)",
                "landTaxValue": "number|null (Current Year Value / 当該年度価格 - NOT Taxable Basis / 課税標準額)",
                "buildingTaxValue": "number|null (Current Year Value / 当該年度価格 - NOT Taxable Basis / 課税標準額)",
                "landFixedAssetTax": "number|null (Land Fixed Asset Tax / 土地の固定資産税)",
                "landCityPlanningTax": "number|null (Land City Planning Tax / 土地の都市計画税)",
                "buildingFixedAssetTax": "number|null (Building Fixed Asset Tax / 建物の固定資産税)",
                "buildingCityPlanningTax": "number|null (Building City Planning Tax / 建物の都市計画税)",
                "annualFixedAssetTax": "number|null (Total Annual Fixed Asset Tax Amount / 年税額 - Sum of Land+Building+CityPlanning if applicable)"
              },
              "estimate": {
                "currency": "JPY",
                "taxRate": "number|null (e.g. 0.10)",
                "items": [
                  { 
                    "section": "string|null (Category)", 
                    "name": "string (Item Name)", 
                    "properties": {
                        "box": {
                            "type": "array",
                            "items": { "type": "number" },
                            "description": "[ymin, xmin, ymax, xmax] coordinates (0-1000 scale) of the BOUNDING BOX containing ONLY the extracting value. Be extremely precise."
                        },
                        "page": { "type": "integer", "description": "Page number (1-based) where the value was found" }
                    },
                    "required": ["box", "page"],
                    "additionalProperties": false,
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
                 "landArea": { "box": [number, number, number, number], "page": number } | null,
                 "floorArea": { "box": [number, number, number, number], "page": number } | null,
                 "structure": { "box": [number, number, number, number], "page": number } | null,
                 "address": { "box": [number, number, number, number], "page": number } | null,
                 "roadPrice": { "box": [number, number, number, number], "page": number } | null,
                 "age": { "box": [number, number, number, number], "page": number } | null,
                 "landTaxValue": { "box": [number, number, number, number], "page": number } | null,
                 "buildingTaxValue": { "box": [number, number, number, number], "page": number } | null,
                 "landFixedAssetTax": { "box": [number, number, number, number], "page": number } | null,
                 "landCityPlanningTax": { "box": [number, number, number, number], "page": number } | null,
                 "buildingFixedAssetTax": { "box": [number, number, number, number], "page": number } | null,
                 "buildingCityPlanningTax": { "box": [number, number, number, number], "page": number } | null,
                 "annualFixedAssetTax": { "box": [number, number, number, number], "page": number } | null
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
            - "age" MUST be calculated based on "Construction Date" relative to ${new Date().getFullYear()}.
              - Support Japanese Calendar: 
                - Showa (昭和) X year = 1925 + X
                - Heisei (平成) X year = 1988 + X
                - Reiwa (令和) X year = 2018 + X
              - Example: "平成10年新築" -> 1998 -> Age = ${new Date().getFullYear()} - 1998 = ${new Date().getFullYear() - 1998}.
              - Example: "昭和60年" -> 1985 -> Age = ${new Date().getFullYear()} - 1985 = ${new Date().getFullYear() - 1985}.

            Specific Instructions for Tax Values:
            - **CRITICAL**: Extract 'Fixed Asset Tax' (固定資産税) and 'City Planning Tax' (都市計画税) separately.
              - **Land**:
                 - Look for "Land" (土地) row.
                 - landFixedAssetTax: Extract "Fixed Asset Tax" (固定資産税相当額/税額).
                 - landCityPlanningTax: Extract "City Planning Tax" (都市計画税相当額/税額).
              - **Building**:
                 - Look for "House/Building" (家屋/建物) row.
                 - buildingFixedAssetTax: Extract "Fixed Asset Tax" (固定資産税相当額/税額).
                 - buildingCityPlanningTax: Extract "City Planning Tax" (都市計画税相当額/税額).
              - Do NOT extract "Taxable Basis" (課税標準額) or "Price" (価格/評価額).
              - If there are multiple items, SUM them respectively.
            - For 'landTaxValue' and 'buildingTaxValue', extract "Current Year Value" (当該年度価格 or 評価額).
            - 'annualFixedAssetTax' should be the Grand Total of Tax (年税額). It should roughly equal landAnnualTax + buildingAnnualTax.

            Coordinates Instructions:
            - CRITICAL: "box" must [ymin, xmin, ymax, xmax] normalized to 1000 scale (0-1000).
            - "page": The 1-based page number where this text was found.
            - "landArea": The box must enclose the NUMERIC VALUE (e.g. "145.87") of the land area. DO NOT circle the label "Land Area" or "地積".
            - "floorArea": The box must enclose the NUMERIC VALUE (e.g. "98.5") of the total floor area.
            - "structure": The box must enclose the structure text (e.g. "鉄筋コンクリート...").
            - "address": The box must enclose the address text.
            - "roadPrice": The box must enclose the value of the road price/rosenka.
            - PRECISION MATTERS. Do not include surrounding borders or labels in the box, ONLY the value text itself.
            - Double check that you rely on VISUAL LOCATION. Do not mix up Land section and Building section.
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

        // 5. Generate Content
        try {
            console.log("[Gemini] Generating content...");
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

            // --- OCR REFINEMENT STEP ---
            try {
                // Only refine if we have files and coordinates
                if (files.length > 0 && data.coordinates) {
                    console.log("[OCR] Starting OCR Refinement with 5s Timeout...");

                    const refineProcess = async () => {
                        // We only process the first file for now as per current logic
                        // Convert File to Buffer for Jimp
                        const fileBuffer = Buffer.from(await files[0].arrayBuffer());
                        console.log("[OCR] Buffer created");

                        const image = await Jimp.read(fileBuffer);
                        console.log("[OCR] Jimp read complete");

                        const imgW = image.bitmap.width;
                        const imgH = image.bitmap.height;

                        console.log("[OCR] Creating Tesseract Worker");
                        const worker = await createWorker("eng+jpn"); // Create Tesseract worker
                        console.log("[OCR] Tesseract Worker ready");

                        // Helper to refine a single box
                        // box: [ymin, xmin, ymax, xmax] (0-1000)
                        const refineBox = async (box: number[], expectedText: string): Promise<number[] | null> => {
                            if (!box) return null;

                            // 1. Calculate Crop Region (with padding)
                            const PADDING = 20; // 20px padding (relative to 1000px)
                            const ymin = Math.max(0, box[0] - PADDING);
                            const xmin = Math.max(0, box[1] - PADDING);
                            const ymax = Math.min(1000, box[2] + PADDING);
                            const xmax = Math.min(1000, box[3] + PADDING);

                            const w = xmax - xmin;
                            const h = ymax - ymin;

                            if (w <= 0 || h <= 0) return box;

                            // 2. Crop
                            // Jimp v1 uses object param for crop
                            const crop = image.clone().crop({ x: xmin, y: ymin, w: w, h: h });

                            // getBufferAsync is removed in v1, use getBuffer
                            const cropBuffer = await new Promise<Buffer>((resolve, reject) => {
                                crop.getBuffer("image/png", (err: Error | null, buffer: Buffer) => {
                                    if (err) reject(err);
                                    else resolve(buffer);
                                });
                            });

                            // 3. OCR
                            const ret = await worker.recognize(cropBuffer);

                            // 4. Find best matching word/line bbox
                            const words = (ret.data as any).words;
                            let bestWord: any = null;

                            if (words.length > 0) {
                                // find a word that looks like a value (digit containing)
                                const valueWord = words.find((w: any) => /\d/.test(w.text));
                                if (valueWord) {
                                    bestWord = valueWord;
                                } else {
                                    bestWord = words[0]; // Fallback
                                }
                            }

                            if (bestWord) {
                                const b = bestWord.bbox;
                                // Tesseract bbox: x0, y0, x1, y1 (pixels relative to crop)

                                const globalX0 = xmin + b.x0;
                                const globalY0 = ymin + b.y0;
                                const globalX1 = xmin + b.x1;
                                const globalY1 = ymin + b.y1;

                                console.log(`[OCR] Refined Box found`);
                                return [globalY0, globalX0, globalY1, globalX1];
                            }

                            return box; // No refinement found
                        };

                        // Fields to refine
                        const planInfo = data.planInfo || {};

                        if (data.coordinates.landArea && planInfo.area_m2) {
                            const refined = await refineBox(data.coordinates.landArea.box, String(planInfo.area_m2));
                            if (refined) data.coordinates.landArea.box = refined;
                        }
                        if (data.coordinates.floorArea && planInfo.floorArea) {
                            const refined = await refineBox(data.coordinates.floorArea.box, String(planInfo.floorArea));
                            if (refined) data.coordinates.floorArea.box = refined;
                        }
                        if (data.coordinates.roadPrice && planInfo.roadPrice) {
                            const refined = await refineBox(data.coordinates.roadPrice.box, String(planInfo.roadPrice));
                            if (refined) data.coordinates.roadPrice.box = refined;
                        }

                        await worker.terminate();
                        console.log("[OCR] Process finished successfully");
                        return true;
                    };

                    // TIMEOUT RACE
                    const timeoutPromise = new Promise((_, reject) => {
                        setTimeout(() => reject(new Error("OCR Timeout (>5s)")), 5000);
                    });

                    await Promise.race([refineProcess(), timeoutPromise]);
                }
            } catch (ocrError) {
                console.error("[OCR] Skipped/Failed:", ocrError);
                // Continue without refinement (return original data)
            }


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
            { error: `System Error: ${error.message} ` },
            { status: 500 }
        );
    }
}
