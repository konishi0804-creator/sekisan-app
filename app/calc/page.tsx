"use client";

import { useState, useEffect } from "react";

import FileUploader from "../../components/FileUploader";
import DocumentPreview from "../../components/DocumentPreview";


type StructureType = "木造" | "軽量鉄骨造" | "重量鉄骨造" | "RC造・SRC造";

const STRUCTURES: Record<
    StructureType,
    { unitPrice: number; usefulLife: number }
> = {
    木造: { unitPrice: 150000, usefulLife: 22 },
    軽量鉄骨造: { unitPrice: 150000, usefulLife: 19 },
    重量鉄骨造: { unitPrice: 180000, usefulLife: 34 },
    "RC造・SRC造": { unitPrice: 200000, usefulLife: 47 },
};

type ValuationMethod = "auto" | "road" | "multiplier";

type CalcResult = {
    landPrice: number;
    buildingPrice: number;
    total: number;
    snapshot: {
        method: ValuationMethod; // effectively used method
        roadPrice: number;
        landArea: number;
        fixedTaxValue: number;
        multiplier: number;
        unitPrice: number;
        usefulLife: number;
        age: number;
        floorArea: number;
    };
};

type Lang = "ja" | "en" | "cn";

const TRANSLATIONS = {
    ja: {
        title: "参考積算価格",
        landPrice: "土地価格",
        roadPrice: "路線価",
        landArea: "土地面積",
        buildingPrice: "建物価格",
        unitPrice: "再調達単価",
        floorArea: "延床面積",
        usefulLife: "法定耐用年数",
        age: "築年数",
        total: "参考積算価格",
        method: {
            road: "路線価方式",
            multiplier: "倍率方式"
        },
        formula: {
            land: (road: string, area: string, total: string) =>
                `土地価格 ＝ 路線価（${road}） × 土地面積（${area}㎡） ＝ ${total}`,
            building: (unit: string, area: string, life: number, age: number, total: string) => (
                <>
                    建物価格 ＝ 再調達単価（{unit}） × 延床面積（{area}㎡）<br />
                    × {'{'} (法定耐用年数 {life}年 − 築年数 {age}年) ÷ 法定耐用年数 {life}年 {'}'} ＝ {total}
                </>
            ),
            total: (land: string, building: string, total: string) =>
                `参考積算価格 ＝ 土地価格（${land}） ＋ 建物価格（${building}） ＝ ${total}`
        }
    },
    en: {
        title: "Estimated Price",
        landPrice: "Land Price",
        roadPrice: "Street Value",
        landArea: "Land Area",
        buildingPrice: "Building Price",
        unitPrice: "Replacement Cost",
        floorArea: "Floor Area",
        usefulLife: "Useful Life",
        age: "Age",
        total: "Estimated Total",
        method: {
            road: "Road Price Method",
            multiplier: "Multiplier Method"
        },
        formula: {
            land: (road: string, area: string, total: string) =>
                `Land Price = Street Value (${road}) × Land Area (${area}㎡) = ${total}`,
            building: (unit: string, area: string, life: number, age: number, total: string) => (
                <>
                    Building Price = Replacement Cost ({unit}) × Floor Area ({area}㎡)<br />
                    × {'{'} (Useful Life {life}y − Age {age}y) ÷ Useful Life {life}y {'}'} = {total}
                </>
            ),
            total: (land: string, building: string, total: string) =>
                `Total = Land Price (${land}) + Building Price (${building}) = ${total}`
        }
    },
    cn: {
        title: "参考估算价格",
        landPrice: "土地价格",
        roadPrice: "路线价",
        landArea: "土地面积",
        buildingPrice: "建筑价格",
        unitPrice: "重置单价",
        floorArea: "建筑面积",
        usefulLife: "法定耐用年限",
        age: "房龄",
        total: "参考估算价格",
        method: {
            road: "路线价方式",
            multiplier: "倍率方式"
        },
        formula: {
            land: (road: string, area: string, total: string) =>
                `土地价格 ＝ 路线价（${road}） × 土地面积（${area}㎡） ＝ ${total}`,
            building: (unit: string, area: string, life: number, age: number, total: string) => (
                <>
                    建筑价格 ＝ 重置单价（{unit}） × 建筑面积（{area}㎡）<br />
                    × {'{'} (法定耐用年限 {life}年 − 房龄 {age}年) ÷ 法定耐用年限 {life}年 {'}'} ＝ {total}
                </>
            ),
            total: (land: string, building: string, total: string) =>
                `参考估算价格 ＝ 土地价格（${land}） ＋ 建筑价格（${building}） ＝ ${total}`
        }
    }
};

export default function CalcPage() {
    // Land Information State
    // Land Information State
    const [landValuationMethod, setLandValuationMethod] = useState<ValuationMethod>("auto");
    const [roadPrice, setRoadPrice] = useState<number | "">("");
    const [roadPriceUnit, setRoadPriceUnit] = useState<"yen" | "thousand">("yen"); // Unit toggle
    const [landArea, setLandArea] = useState<number | "">("");
    const [fixedTaxValue, setFixedTaxValue] = useState<number | "">(""); // Fixed Asset Tax Value
    const [multiplier, setMultiplier] = useState<number | "">("");       // Evaluation Multiplier

    // Building Information State
    const [structure, setStructure] = useState<StructureType>("木造");
    const [usefulLife, setUsefulLife] = useState<number>(22);
    const [age, setAge] = useState<number | "">("");
    const [unitPrice, setUnitPrice] = useState<number>(150000);
    const [floorArea, setFloorArea] = useState<number | "">("");

    // Result State
    const [results, setResults] = useState<CalcResult | null>(null);

    const [lang, setLang] = useState<Lang>("ja");
    const [isFlashing, setIsFlashing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [invalidFields, setInvalidFields] = useState<string[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);


    // Address Extraction State
    const [addressCandidates, setAddressCandidates] = useState<string[]>([]);
    const [selectedAddress, setSelectedAddress] = useState<string>("");

    // Preview State
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [fileType, setFileType] = useState<string>("");

    type Coordinates = [number, number, number, number];
    type ExtractedCoordinates = {
        landArea?: Coordinates | null;
        structure?: Coordinates | null;
        address?: Coordinates | null;
        roadPrice?: Coordinates | null;
        age?: Coordinates | null;
    } | null;

    const [coordinates, setCoordinates] = useState<ExtractedCoordinates>(null);



    // User ID for rate limiting
    useEffect(() => {
        let id = localStorage.getItem("sekisan_user_id");
        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem("sekisan_user_id", id);
        }
    }, []);

    // Auto-fill logic based on structure change
    useEffect(() => {
        const data = STRUCTURES[structure];
        setUnitPrice(data.unitPrice);
        setUsefulLife(data.usefulLife);
    }, [structure]);

    const handleFileUpload = async (files: File[]) => {
        setIsAnalyzing(true);
        setError(null);
        setAddressCandidates([]); // Reset candidates
        setSelectedAddress("");   // Reset selection
        setCoordinates(null);

        // Preview Setup
        if (files.length > 0) {
            const file = files[0];
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            setFileType(file.type);

            // Cleanup previous URL if needed (useEffect cleanup handles component unmount, but here we replace)
            // Ideally we track the previous one to revoke, but React state update batching makes it simple enough to just let GC handle small leaks or rely on unmount cleanup if we added it. 
            // For robustness, let's just rely on the new one being set.
        }

        try {
            const formData = new FormData();

            // Client-side Validation
            if (files.length === 0) return;

            const isPDF = files[0].type === "application/pdf";
            const isImage = files[0].type.startsWith("image/");
            let totalSize = 0;

            if (isPDF) {
                if (files.length > 1) {
                    throw new Error("PDFは1回につき1ファイルのみアップロード可能です。");
                }
                if (files[0].size > 10 * 1024 * 1024) {
                    throw new Error(`PDFのサイズが上限(10MB)を超えています (${(files[0].size / 1024 / 1024).toFixed(1)}MB)`);
                }
                // Note: Page count check is done on server
            } else if (isImage) {
                if (files.length > 10) {
                    throw new Error(`画像の枚数が上限(10枚)を超えています (${files.length}枚)`);
                }
                for (const file of files) {
                    if (file.size > 4 * 1024 * 1024) {
                        throw new Error(`画像(1枚あたり)のサイズが上限(4MB)を超えています: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
                    }
                    totalSize += file.size;
                }
                if (totalSize > 10 * 1024 * 1024) {
                    throw new Error(`画像の合計サイズが上限(10MB)を超えています (${(totalSize / 1024 / 1024).toFixed(1)}MB)`);
                }
            }

            files.forEach((file) => {
                formData.append("files", file);
            });

            const userId = localStorage.getItem("sekisan_user_id") || "anonymous";

            const res = await fetch("/api/estimate/parse", {
                method: "POST",
                headers: {
                    "X-User-ID": userId,
                },
                body: formData,
            });

            if (!res.ok) {
                const errData = await res.json();

                // Specific handling for Rate Limit (429) -> Billing/Quota Error
                if (res.status === 429) {
                    throw new Error("Google Cloud 課金/Quotaエラー: プロジェクトの課金設定またはQuotaを確認してください。");
                }

                throw new Error(errData.error || "Analysis failed");
            }

            const data = await res.json();
            const info = data.planInfo || {};

            // Map new schema to state
            if (info.area_m2) setLandArea(info.area_m2);
            if (info.floorArea) setFloorArea(info.floorArea);

            if (info.structure) {
                const validStructures = Object.keys(STRUCTURES);
                if (validStructures.includes(info.structure)) {
                    setStructure(info.structure as StructureType);
                } else {
                    // Try partial match
                    const match = validStructures.find(s => info.structure.includes(s));
                    if (match) setStructure(match as StructureType);
                }
            }

            if (info.roadPrice) setRoadPrice(info.roadPrice);
            if (info.age) setAge(info.age);

            if (info.siteAddress) {
                setAddressCandidates([info.siteAddress]);
                setSelectedAddress(info.siteAddress);
            } else {
                setAddressCandidates([]);
                setSelectedAddress("");
            }

            // Set Coordinates
            if (data.coordinates) {
                setCoordinates(data.coordinates);
            }

            // Clear invalid fields if they are now filled
            setInvalidFields([]);

        } catch (e) {
            console.error(e);
            const msg = e instanceof Error ? e.message : "読み取りエラーが発生しました";
            setError(lang === "ja" ? msg : "Failed to analyze document.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleOpenMap = async (type: "chikamap" | "rosenka" | "magnification" | "copy") => {
        if (!selectedAddress && type !== "copy") {
            alert("住所が入力されていません。");
            return;
        }

        if (type === "copy") {
            if (!selectedAddress) {
                alert("コピーする住所がありません。");
                return;
            }
            if (navigator.clipboard) {
                try {
                    await navigator.clipboard.writeText(selectedAddress);
                    // UI feedback could be better but basic alert for now if needed, or silent
                    alert("住所をコピーしました");
                } catch (err) {
                    console.error("Copy failed", err);
                }
            }
            return;
        }

        let url = "";
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (type === "chikamap") {
            url = isMobile
                ? "https://www.chikamap.jp/chikamap-sp/"
                : "https://www.chikamap.jp/chikamap/";
        } else if (type === "rosenka") {
            url = "https://www.rosenka.nta.go.jp/";
        } else if (type === "magnification") {
            // Usually linked effectively from the same top page
            url = "https://www.rosenka.nta.go.jp/";
        }

        // Auto-copy address before opening if possible (convenience)
        if (selectedAddress && navigator.clipboard) {
            navigator.clipboard.writeText(selectedAddress).catch(() => null);
        }

        window.open(url, "_blank");
    };

    const handleCalculate = () => {
        const missingFields: string[] = [];
        const newInvalidFields: string[] = [];

        // Determine effective method
        let effectiveMethod: ValuationMethod = landValuationMethod;
        if (effectiveMethod === "auto") {
            if (roadPrice !== "") {
                effectiveMethod = "road";
            } else {
                effectiveMethod = "multiplier";
            }
        }

        // Validation based on effective method
        if (effectiveMethod === "road") {
            if (roadPrice === "") {
                missingFields.push(TRANSLATIONS[lang].roadPrice);
                newInvalidFields.push("roadPrice");
            }
            if (landArea === "") {
                missingFields.push(TRANSLATIONS[lang].landArea);
                newInvalidFields.push("landArea");
            }
        } else if (effectiveMethod === "multiplier") {
            if (fixedTaxValue === "") {
                missingFields.push("固定資産税評価額"); // TODO: Add to translations
                newInvalidFields.push("fixedTaxValue");
            }
            if (multiplier === "") {
                missingFields.push("評価倍率"); // TODO: Add to translations
                newInvalidFields.push("multiplier");
            }
        }

        if (age === "") {
            missingFields.push(TRANSLATIONS[lang].age);
            newInvalidFields.push("age");
        }
        if (floorArea === "") {
            missingFields.push(TRANSLATIONS[lang].floorArea);
            newInvalidFields.push("floorArea");
        }

        setInvalidFields(newInvalidFields);

        if (missingFields.length > 0) {
            const errorMsg = lang === "ja"
                ? `${missingFields.join("、")}が未入力です。入力してください。`
                : lang === "cn"
                    ? `${missingFields.join("、")}未输入。请输入。`
                    : `Please enter: ${missingFields.join(", ")}`;
            setError(errorMsg);
            setResults(null);
            return;
        }

        setError(null);

        const rPrice = roadPrice === "" ? 0 : Number(roadPrice);
        const lArea = landArea === "" ? 0 : Number(landArea);
        const taxVal = fixedTaxValue === "" ? 0 : Number(fixedTaxValue);
        const mult = multiplier === "" ? 0 : Number(multiplier);

        const rPriceInYen = roadPriceUnit === "thousand" ? rPrice * 1000 : rPrice;

        const bAge = Number(age);
        const fArea = Number(floorArea);

        // Land Logic
        let calcLandPrice = 0;
        if (effectiveMethod === "road") {
            calcLandPrice = rPriceInYen * lArea;
        } else {
            calcLandPrice = taxVal * mult;
        }

        // Building Logic
        let calcBuildingPrice = 0;
        if (bAge <= usefulLife) {
            calcBuildingPrice =
                unitPrice * fArea * ((usefulLife - bAge) / usefulLife);
        } else {
            calcBuildingPrice = 0;
        }

        const finalLandPrice = Math.floor(calcLandPrice);
        const finalBuildingPrice = Math.floor(calcBuildingPrice);

        setResults({
            landPrice: finalLandPrice,
            buildingPrice: finalBuildingPrice,
            total: finalLandPrice + finalBuildingPrice,
            snapshot: {
                method: effectiveMethod,
                roadPrice: rPrice, // Keep original input value for snapshot? Or normalized? Keep original for display usually.
                landArea: lArea,
                fixedTaxValue: taxVal,
                multiplier: mult,
                unitPrice: unitPrice,
                usefulLife: usefulLife,
                age: bAge,
                floorArea: fArea,
            },
        });
    };

    const formatCurrency = (val: number) => {
        return val.toLocaleString("ja-JP", { style: "currency", currency: "JPY" });
    };

    return (
        <main className="min-h-screen bg-slate-50/50 dark:bg-slate-900/50 p-4 md:p-6 lg:p-8 text-slate-700 dark:text-slate-200">
            <div className="max-w-[1600px] mx-auto">

                {/* Header Section */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
                        不動産積算シミュレーション
                    </h1>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                        資料を見ながら情報を入力して、概算評価額を計算します
                    </p>
                    {error && (
                        <div className="mt-4 mx-auto max-w-2xl bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 text-left">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-600 shrink-0 mt-0.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9.004 9.004 0 11-18 0 9.004 9.004 0 0118 0zm-9 3.75h.008v.008h-.008v-.008z" />
                            </svg>
                            <div>
                                <h3 className="text-red-800 font-bold text-sm mb-1">エラーが発生しました</h3>
                                <p className="text-red-700 text-sm whitespace-pre-wrap leading-relaxed">
                                    {error}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    {/* LEFT COLUMN: INPUT FORMS (Span 5) */}
                    <div className="lg:col-span-5 space-y-6 order-2 lg:order-2">

                        {/* Address Candidates Section */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                            <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center">
                                <span className="bg-emerald-500 w-1.5 h-5 mr-3 rounded-sm"></span>
                                所在地 (参考)
                            </h2>
                            <div className="space-y-4">
                                {/* Candidate List */}
                                {addressCandidates.length > 0 ? (
                                    <div className="space-y-2">
                                        <p className="text-xs text-slate-500 font-bold">資料から抽出された住所:</p>
                                        <div className="space-y-1">
                                            {addressCandidates.map((addr, idx) => (
                                                <label key={idx} className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors">
                                                    <input
                                                        type="radio"
                                                        name="address_candidate"
                                                        checked={selectedAddress === addr}
                                                        onChange={() => setSelectedAddress(addr)}
                                                        className="text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm text-slate-800 break-all">{addr}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-orange-500 font-bold">
                                        {isAnalyzing ? "解析中..." : "住所が特定できませんでした。手入力してください。"}
                                    </p>
                                )}

                                {/* Manual Input / Selected Display */}
                                <div>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={selectedAddress}
                                            onChange={(e) => setSelectedAddress(e.target.value)}
                                            placeholder="例：東京都千代田区千代田1-1"
                                            className="w-full p-3 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        />
                                        <button
                                            onClick={() => handleOpenMap("copy")}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors"
                                            title="住所をコピー"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="mt-3">
                                        <button
                                            onClick={() => handleOpenMap("chikamap")}
                                            className="w-full px-4 py-2.5 bg-emerald-600 text-white font-bold text-sm rounded-lg shadow hover:bg-emerald-700 hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                                            disabled={!selectedAddress}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 group-hover:animate-bounce">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.875 1.875 0 00-1.68 0l-3.252 1.626c-.317.159-.69.159-1.006 0L1.76 3.25C1.037 2.895.25 3.417.25 4.22v12.43c0 .426.24.815.622 1.006l4.875 2.437c.317.159.69.159 1.006 0l3.252-1.626a1.875 1.875 0 001.68 0l3.252 1.626z" />
                                            </svg>
                                            全国地価マップで確認
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Land Information Section */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                                <h2 className="text-base font-bold text-slate-800 flex items-center">
                                    <span className="bg-blue-600 w-1.5 h-5 mr-3 rounded-sm"></span>
                                    土地情報
                                </h2>
                                <div className="flex bg-slate-100 p-0.5 rounded-lg scale-90 origin-right">
                                    <button
                                        onClick={() => setLandValuationMethod("auto")}
                                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${landValuationMethod === "auto" ? "bg-white shadow text-blue-600" : "text-slate-500 hover:text-slate-700"}`}
                                    >
                                        自動
                                    </button>
                                    <button
                                        onClick={() => setLandValuationMethod("road")}
                                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${landValuationMethod === "road" ? "bg-white shadow text-blue-600" : "text-slate-500 hover:text-slate-700"}`}
                                    >
                                        路線価
                                    </button>
                                    <button
                                        onClick={() => setLandValuationMethod("multiplier")}
                                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${landValuationMethod === "multiplier" ? "bg-white shadow text-blue-600" : "text-slate-500 hover:text-slate-700"}`}
                                    >
                                        倍率
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Auto Mode - Active Indicator */}
                                {landValuationMethod === "auto" && (
                                    <div className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-2 rounded border border-slate-200 flex items-center gap-2">
                                        <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                                        {roadPrice !== "" ? "路線価方式を適用中" : "倍率方式を適用中"}
                                    </div>
                                )}

                                {/* Road Price Inputs */}
                                {(landValuationMethod === "road" || landValuationMethod === "auto") && (
                                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="block text-sm font-semibold text-slate-600">
                                                    路線価
                                                </label>
                                                <div className="flex items-center bg-slate-100 rounded-md p-0.5 scale-90 origin-right">
                                                    <button
                                                        onClick={() => setRoadPriceUnit("yen")}
                                                        className={`px-2 py-0.5 text-xs font-bold rounded-sm ${roadPriceUnit === "yen" ? "bg-white shadow text-slate-800" : "text-slate-500"}`}
                                                    >
                                                        円/㎡
                                                    </button>
                                                    <button
                                                        onClick={() => setRoadPriceUnit("thousand")}
                                                        className={`px-2 py-0.5 text-xs font-bold rounded-sm ${roadPriceUnit === "thousand" ? "bg-white shadow text-slate-800" : "text-slate-500"}`}
                                                    >
                                                        千円/㎡
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={roadPrice}
                                                    onChange={(e) => {
                                                        setRoadPrice(e.target.value === "" ? "" : Number(e.target.value));
                                                        if (invalidFields.includes("roadPrice")) {
                                                            setInvalidFields(prev => prev.filter(f => f !== "roadPrice"));
                                                        }
                                                    }}
                                                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none no-spinner ${invalidFields.includes("roadPrice")
                                                        ? "bg-red-50 border-red-500 text-red-900 placeholder-red-300"
                                                        : "bg-slate-50 border-slate-300"
                                                        }`}
                                                    placeholder={roadPriceUnit === "yen" ? "100000" : "100"}
                                                />
                                                <span className="absolute right-3 top-3 text-slate-400 text-sm pointer-events-none">
                                                    {roadPriceUnit === "yen" ? "円" : "千円"}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-600 mb-2">
                                                土地面積 (㎡)
                                            </label>
                                            <input
                                                type="number"
                                                value={landArea}
                                                onChange={(e) => {
                                                    setLandArea(e.target.value === "" ? "" : Number(e.target.value));
                                                    if (invalidFields.includes("landArea")) {
                                                        setInvalidFields(prev => prev.filter(f => f !== "landArea"));
                                                    }
                                                }}
                                                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none no-spinner ${invalidFields.includes("landArea")
                                                    ? "bg-red-50 border-red-500 text-red-900 placeholder-red-300"
                                                    : "bg-slate-50 border-slate-300"
                                                    }`}
                                                placeholder="100.00"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Multiplier Inputs */}
                                {((landValuationMethod === "multiplier") || (landValuationMethod === "auto" && roadPrice === "")) && (
                                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="pt-2 border-t border-slate-100">
                                            <label className="block text-sm font-semibold text-slate-600 mb-2">
                                                固定資産税評価額 (円)
                                            </label>
                                            <input
                                                type="number"
                                                value={fixedTaxValue}
                                                onChange={(e) => {
                                                    setFixedTaxValue(e.target.value === "" ? "" : Number(e.target.value));
                                                    if (invalidFields.includes("fixedTaxValue")) {
                                                        setInvalidFields(prev => prev.filter(f => f !== "fixedTaxValue"));
                                                    }
                                                }}
                                                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none no-spinner ${invalidFields.includes("fixedTaxValue")
                                                    ? "bg-red-50 border-red-500 text-red-900 placeholder-red-300"
                                                    : "bg-slate-50 border-slate-300"
                                                    }`}
                                                placeholder="10000000"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-600 mb-2">
                                                評価倍率
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={multiplier}
                                                onChange={(e) => {
                                                    setMultiplier(e.target.value === "" ? "" : Number(e.target.value));
                                                    if (invalidFields.includes("multiplier")) {
                                                        setInvalidFields(prev => prev.filter(f => f !== "multiplier"));
                                                    }
                                                }}
                                                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none no-spinner ${invalidFields.includes("multiplier")
                                                    ? "bg-red-50 border-red-500 text-red-900 placeholder-red-300"
                                                    : "bg-slate-50 border-slate-300"
                                                    }`}
                                                placeholder="1.1"
                                            />
                                        </div>
                                        <div className="text-right">
                                            <a
                                                href="https://www.rosenka.nta.go.jp/"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-600 hover:underline flex justify-end items-center gap-1"
                                            >
                                                評価倍率表を確認する
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Building Information Section */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                            <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 mb-5 flex items-center">
                                <span className="bg-blue-600 w-1.5 h-5 mr-3 rounded-sm"></span>
                                建物情報
                            </h2>
                            <div className="space-y-6 flex-grow">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 mb-2">
                                        構造
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={structure}
                                            onChange={(e) => setStructure(e.target.value as StructureType)}
                                            className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none appearance-none text-sm"
                                        >
                                            {Object.keys(STRUCTURES).map((s) => (
                                                <option key={s} value={s}>
                                                    {s}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">
                                            法定耐用年数
                                        </label>
                                        <input
                                            type="number"
                                            value={usefulLife}
                                            readOnly
                                            className="w-full p-3 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-600 mb-2">
                                            築年数
                                        </label>
                                        <input
                                            type="number"
                                            value={age}
                                            onChange={(e) => {
                                                setAge(e.target.value === "" ? "" : Number(e.target.value));
                                                if (invalidFields.includes("age")) {
                                                    setInvalidFields(prev => prev.filter(f => f !== "age"));
                                                }
                                            }}
                                            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none no-spinner text-sm ${invalidFields.includes("age")
                                                ? "bg-red-50 border-red-500 text-red-900 placeholder-red-300"
                                                : "bg-slate-50 border-slate-300"
                                                }`}
                                            placeholder="10"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">
                                            再調達価格単価
                                        </label>
                                        <input
                                            type="number"
                                            value={unitPrice}
                                            readOnly
                                            className="w-full p-3 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-600 mb-2">
                                            延床面積 (㎡)
                                        </label>
                                        <input
                                            type="number"
                                            value={floorArea}
                                            onChange={(e) => {
                                                setFloorArea(e.target.value === "" ? "" : Number(e.target.value));
                                                if (invalidFields.includes("floorArea")) {
                                                    setInvalidFields(prev => prev.filter(f => f !== "floorArea"));
                                                }
                                            }}
                                            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none no-spinner text-sm ${invalidFields.includes("floorArea")
                                                ? "bg-red-50 border-red-500 text-red-900 placeholder-red-300"
                                                : "bg-slate-50 border-slate-300"
                                                }`}
                                            placeholder="80.00"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="py-2">
                            <button
                                onClick={handleCalculate}
                                className="w-full block mx-auto py-3 px-8 bg-blue-600 text-white font-bold text-base rounded-xl shadow-lg hover:bg-blue-700 hover:scale-105 active:scale-95 active:translate-y-px transition-all duration-150 ease-out"
                            >
                                価格を計算する
                            </button>
                            {error && (
                                <p className="mt-4 text-red-600 font-bold text-center bg-red-50 p-3 rounded-lg border border-red-200 animate-in fade-in slide-in-from-top-2 text-sm">
                                    <span className="flex items-center justify-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008h-.008v-.008z" />
                                        </svg>
                                        {error}
                                    </span>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: DOCUMENT PREVIEW & RESULTS (Span 7) */}
                    <div className="lg:col-span-7 space-y-6 order-1 lg:order-1 lg:sticky lg:top-8 h-fit">
                        {/* Document Upload Section */}
                        <FileUploader onFileSelect={handleFileUpload} isLoading={isAnalyzing} />

                        {previewUrl && (
                            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                                <DocumentPreview
                                    fileUrl={previewUrl}
                                    fileType={fileType}
                                    coordinates={coordinates}
                                />
                            </div>
                        )}

                    </div>
                </div>

                {/* Result Summary Card (Small Preview) */}


                {results && (
                    <div className="space-y-4">
                        {/* Controls outside the report */}
                        <div className="flex justify-end pr-2">
                            <select
                                value={lang}
                                onChange={(e) => setLang(e.target.value as Lang)}
                                className="text-xs bg-slate-100 border border-slate-200 rounded px-2 py-1 text-slate-600 outline-none"
                            >
                                <option value="ja">日本語</option>
                                <option value="en">English</option>
                                <option value="cn">中文</option>
                            </select>
                        </div>

                        <div
                            id="result-card"
                            className="relative bg-white text-slate-800 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 mx-auto max-w-[800px]"
                        >
                            {/* Decorative Top Border */}
                            <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-700"></div>

                            <div className="p-8 md:p-12 flex flex-col h-full bg-[url('https://www.transparenttextures.com/patterns/subtle-paper.png')]">

                                {/* Header */}
                                <div className="flex justify-between items-end border-b-2 border-slate-800 pb-4 mb-8">
                                    <div>
                                        <p className="text-xs text-slate-500 font-serif tracking-widest mb-1">不動産積算価格シミュレーション</p>
                                        <h2 className="text-3xl font-serif font-bold text-slate-900 tracking-wide">
                                            参考積算価格
                                        </h2>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400">作成日</p>
                                        <p className="text-sm font-medium">{new Date().toLocaleDateString('ja-JP')}</p>
                                    </div>
                                </div>

                                {/* Property Info */}
                                <div className="mb-6">
                                    <p className="text-xs text-slate-400 mb-1">対象不動産</p>
                                    <p className="text-lg font-bold border-b border-slate-200 pb-1">
                                        {selectedAddress || "（住所未入力）"}
                                    </p>
                                </div>

                                {/* Main Content Grid */}
                                <div className="space-y-4">

                                    {/* Land Section */}
                                    <div className="bg-slate-50/50 p-6 rounded-lg border border-slate-100">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="bg-blue-600 text-white p-1.5 rounded">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-slate-800">土地評価額</h3>
                                                <p className="text-xs text-slate-500">
                                                    {results.snapshot.method === "road" ? "路線価法による試算" : "倍率法による試算"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-baseline mb-2">
                                            <div className="text-sm text-slate-500">
                                                {results.snapshot.method === "road" ? (
                                                    <span>
                                                        路線価 <span className="font-medium text-slate-700">{formatCurrency(results.snapshot.roadPrice)}</span>
                                                        <span className="mx-2">×</span>
                                                        地積 <span className="font-medium text-slate-700">{results.snapshot.landArea.toLocaleString()}㎡</span>
                                                    </span>
                                                ) : (
                                                    <span>
                                                        固定資産税評価 <span className="font-medium text-slate-700">{formatCurrency(results.snapshot.fixedTaxValue)}</span>
                                                        <span className="mx-2">×</span>
                                                        倍率 <span className="font-medium text-slate-700">{results.snapshot.multiplier}</span>
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-2xl font-bold text-slate-800">
                                                {formatCurrency(results.landPrice)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Building Section */}
                                    <div className="bg-slate-50/50 p-6 rounded-lg border border-slate-100">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="bg-indigo-600 text-white p-1.5 rounded">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205 3 1m1.5.5-1.5-.5M6.75 7.364V3h-3v18m3-13.636 10.5-3.819" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-slate-800">建物評価額</h3>
                                                <p className="text-xs text-slate-500">原価法による試算（{structure} / 築{age}年）</p>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-baseline mb-2">
                                            <div className="text-sm text-slate-500 w-full">
                                                <p className="leading-relaxed">
                                                    {TRANSLATIONS[lang].formula.building(
                                                        formatCurrency(results.snapshot.unitPrice),
                                                        results.snapshot.floorArea.toLocaleString(),
                                                        results.snapshot.usefulLife,
                                                        results.snapshot.age,
                                                        formatCurrency(results.buildingPrice)
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex justify-end mt-2">
                                            <div className="text-2xl font-bold text-slate-800">
                                                {formatCurrency(results.buildingPrice)}
                                            </div>
                                        </div>
                                    </div>

                                </div>

                                {/* Total Price Section */}
                                <div className="mt-4 pt-4 border-t-2 border-slate-800">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xl font-bold text-slate-700">積算価格 合計</h3>
                                        <div className="text-5xl font-serif font-bold text-indigo-900 subpixel-antialiased">
                                            {formatCurrency(results.total)}
                                        </div>
                                    </div>
                                    <p className="text-right text-xs text-slate-400 mt-2">※本試算結果は概算であり、実際の評価額を保証するものではありません。</p>
                                </div>

                                {/* Footer Logo/Brand */}
                                <div className="mt-8 pt-4 text-center opacity-40">
                                    <div className="flex items-center justify-center gap-2 text-slate-400 font-serif italic">
                                        <span className="h-px w-8 bg-slate-300"></span>
                                        <span>Sekisan App Simulation</span>
                                        <span className="h-px w-8 bg-slate-300"></span>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                )}
            </div>
            {/* Camera Flash Overlay */}
            <div
                className={`fixed inset-0 bg-white pointer-events-none z-[9999] transition-opacity duration-200 ease-out ${isFlashing ? "opacity-80" : "opacity-0"
                    }`}
            />
        </main >
    );
}
