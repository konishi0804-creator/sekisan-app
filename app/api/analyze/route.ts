import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument } from "pdf-lib";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const files = formData.getAll("files") as File[];
        const userId = req.headers.get("X-User-ID");

        if (!userId) {
            return NextResponse.json({ error: "User identity missing" }, { status: 400 });
        }

        if (!files || files.length === 0) {
            return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
        }

        // --- Database & Limit Check (Read Only) ---
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        let supabase = null;

        if (supabaseUrl && supabaseKey) {
            supabase = createClient(supabaseUrl, supabaseKey);

            // Calculate Japanese Date Boundary (Midnight JST)
            const now = new Date();
            const jstOffset = 9 * 60; // minutes
            const jstTime = new Date(now.getTime() + jstOffset * 60 * 1000);
            jstTime.setUTCHours(0, 0, 0, 0); // Start of day JST
            const startOfDayUtc = new Date(jstTime.getTime() - jstOffset * 60 * 1000);

            const { count, error } = await supabase
                .from("uploads")
                .select("*", { count: "exact", head: true })
                .eq("user_id", userId)
                .gte("created_at", startOfDayUtc.toISOString());

            if (error) {
                console.error("DB Error:", error);
                return NextResponse.json({ error: "System error: Failed to verify limits." }, { status: 500 });
            }

            if (count !== null && count >= 3) {
                return NextResponse.json(
                    { error: "1日の上限（3件）を超えています。明日またお試しください。" },
                    { status: 429 }
                );
            }
        }

        // --- File Constraint Validation ---

        let totalSize = 0;
        const isPDF = files[0].type === "application/pdf";
        const isImage = files[0].type.startsWith("image/");

        for (const file of files) {
            totalSize += file.size;

            if (isPDF) {
                if (file.size > 10 * 1024 * 1024) {
                    return NextResponse.json({ error: `サイズ制限超過: PDFは10MB以内である必要があります (${(file.size / 1024 / 1024).toFixed(1)}MB)` }, { status: 400 });
                }

                try {
                    const arrayBuffer = await file.arrayBuffer();
                    const pdfDoc = await PDFDocument.load(arrayBuffer);
                    const pageCount = pdfDoc.getPageCount();
                    if (pageCount > 10) {
                        return NextResponse.json({ error: `ページ数超過: PDFは10ページ以内である必要があります (${pageCount}ページ)` }, { status: 400 });
                    }
                } catch (e) {
                    console.error("PDF Parse Error", e);
                    return NextResponse.json({ error: "PDFの解析に失敗しました。破損している可能性があります。" }, { status: 400 });
                }
            }

            if (isImage) {
                if (file.size > 4 * 1024 * 1024) {
                    return NextResponse.json({ error: `サイズ制限超過: 画像は1枚あたり4MB以内である必要があります (${(file.size / 1024 / 1024).toFixed(1)}MB)` }, { status: 400 });
                }
            }
        }

        if (isPDF && files.length > 1) {
            return NextResponse.json({ error: "PDFは1回につき1ファイルのみアップロード可能です。" }, { status: 400 });
        }

        if (isImage) {
            if (files.length > 10) {
                return NextResponse.json({ error: `枚数制限超過: 画像は一度に10枚までです (${files.length}枚)` }, { status: 400 });
            }
            if (totalSize > 10 * 1024 * 1024) {
                return NextResponse.json({ error: `合計サイズ超過: 画像の合計は10MB以内である必要があります (${(totalSize / 1024 / 1024).toFixed(1)}MB)` }, { status: 400 });
            }
        }

        // --- Database Record (Insert after Validation) ---
        // Only record if API Key is present (avoid consuming quota in test mode without key)
        const apiKey = process.env.GEMINI_API_KEY;

        if (supabase && apiKey) {
            const { error: insertError } = await supabase.from("uploads").insert({ user_id: userId });
            if (insertError) {
                console.error("DB Insert Error:", insertError);
            }
        }

        // --- Gemini Analysis ---

        if (!apiKey) {
            console.warn("API Key not configured. Skipping analysis.");
            return NextResponse.json({ error: "システム設定エラー: 解析用APIキーが未設定です（テストモード: DB記録なし）。管理者に連絡してください。" }, { status: 503 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";

        // Debug Information
        console.log(`Using Gemini Model: ${modelName}`);

        try {
            const model = genAI.getGenerativeModel({ model: modelName });

            // Prepare parts for Gemini
            const parts = [];
            parts.push({
                text: `
        この不動産資料（画像またはPDF）から、以下の情報を抽出してJSON形式で返してください。
        値が見つからない場合は null または 0 を返してください。
        
        抽出項目:
        1. landArea: 土地面積（数値のみ、単位不要、㎡換算して）
        2. structure: 建物構造（以下のいずれかに分類: "木造", "軽量鉄骨造", "重量鉄骨造", "RC造・SRC造"）
           - 木造・W造 -> 木造
           - 軽量鉄骨・S造(軽量) -> 軽量鉄骨造
           - 重量鉄骨・S造 -> 重量鉄骨造
           - RC・SRC・鉄筋コンクリート -> RC造・SRC造
        3. floorArea: 延床面積（数値のみ、単位不要、㎡換算して）
        4. roadPrice: 公示地価または路線価（もし記載があれば数値で。なければnull）
        5. age: 築年数（現在からの経過年数、または建築年）
           - 建築年（昭和xx年、YYYY年など）が記載されている場合は、${new Date().getFullYear()}年時点での築年数を計算して数値で返してください。
        6. address_candidates: 住所の候補（文字列の配列、最大3つ）
           - 文書内に記載されている「所在地」「住所」などを抽出してください。
           - 建物名や部屋番号まで含む詳細なものから、町名までのものなど、確度が高い順に並べてください。
           - 見つからない場合は空配列 [] を返してください。

        Response Format (JSON):
        {
            "landArea": number | null,
            "structure": "木造" | "軽量鉄骨造" | "重量鉄骨造" | "RC造・SRC造" | null,
            "floorArea": number | null,
            "roadPrice": number | null,
            "age": number | null,
            "address_candidates": string[]
        }
        `
            });

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

            const result = await model.generateContent(parts);

            const responseText = result.response.text();
            console.log("Gemini Response:", responseText);

            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error("Failed to parse JSON response");
            }

            const extractedData = JSON.parse(jsonMatch[0]);

            return NextResponse.json(extractedData);

        } catch (error: any) {
            console.error("Analysis Error:", error);

            // Handle 404 (Invalid Model)
            if (error.message?.includes("404") || error.message?.includes("not found")) {
                return NextResponse.json({
                    error: `指定されたモデル '${modelName}' は利用できません(404)。有効なモデル名(例: gemini-2.0-flash, gemini-1.5-flash)を確認してください。`
                }, { status: 500 });
            }

            // Handle 429 (Too Many Requests)
            if (error.response?.status === 429 || error.message?.includes("429") || error.message?.includes("Too Many Requests")) {
                console.warn("Gemini API Rate Limit Reached (429)");
                return NextResponse.json({
                    error: "利用制限に達しました。しばらく待ってから再試行してください。",
                    retryAfter: 60
                }, { status: 429 });
            }

            return NextResponse.json({ error: `解析エラー: ${error.message}` }, { status: 500 });
        }
    } catch (error: any) {
        console.error("Server Error:", error);
        return NextResponse.json({ error: "サーバー内部エラーが発生しました。" }, { status: 500 });
    }
}
