"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";

import FileUploader from "../../components/FileUploader";


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
            // floorArea is skipped as per new schema

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

            // Handle Address Candidates
            if (info.siteAddress) {
                setAddressCandidates([info.siteAddress]);
                setSelectedAddress(info.siteAddress);
            } else {
                setAddressCandidates([]);
                setSelectedAddress("");
            }

            // Clear invalid fields if they are now filled
            setInvalidFields([]);

        } catch (e: any) {
            console.error(e);
            setError(lang === "ja" ? e.message || "資料の読み取りに失敗しました。" : "Failed to analyze document.");
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
        <main className="min-h-screen p-4 md:p-8 text-slate-700 dark:text-slate-200">
            <div className="max-w-[960px] mx-auto space-y-8">
                <div className="text-center">
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
                        不動産積算シミュレーション
                    </h1>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                        土地と建物の情報を入力して、概算評価額を計算します
                    </p>
                    {error && (
                        <div className="mt-4 mx-auto max-w-2xl bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 text-left">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-600 shrink-0 mt-0.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008h-.008v-.008z" />
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* Document Upload Section */}
                    <div className="md:col-span-2">
                        <FileUploader onFileSelect={handleFileUpload} isLoading={isAnalyzing} />
                    </div>

                    {/* Address Candidates Section (New) */}
                    <div className="md:col-span-2 bg-white rounded-xl shadow-md p-6 border border-slate-100">
                        <h2 className="text-lg font-bold text-slate-800 border-b-2 border-slate-100 pb-3 mb-4 flex items-center">
                            <span className="bg-emerald-500 w-2 h-6 mr-3 rounded-sm"></span>
                            所在地 (参考)
                        </h2>
                        <div className="space-y-4">
                            {/* Candidate List */}
                            {addressCandidates.length > 0 ? (
                                <div className="space-y-2">
                                    <p className="text-sm text-slate-600 font-bold">資料から抽出された住所:</p>
                                    <div className="space-y-1">
                                        {addressCandidates.map((addr, idx) => (
                                            <label key={idx} className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-slate-50 border border-transparent hover:border-slate-200">
                                                <input
                                                    type="radio"
                                                    name="address_candidate"
                                                    checked={selectedAddress === addr}
                                                    onChange={() => setSelectedAddress(addr)}
                                                    className="text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-sm text-slate-800">{addr}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-orange-500 font-bold">
                                    {isAnalyzing ? "解析中..." : "住所が特定できませんでした。手入力してください。"}
                                </p>
                            )}

                            {/* Manual Input / Selected Display */}
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">
                                    {addressCandidates.length > 0 ? "選択中の住所（修正可）" : "住所を手入力"}
                                </label>
                                <input
                                    type="text"
                                    value={selectedAddress}
                                    onChange={(e) => setSelectedAddress(e.target.value)}
                                    placeholder="例：東京都千代田区千代田1-1"
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mb-2"
                                />

                                <div className="mt-2">
                                    <button
                                        onClick={() => handleOpenMap("chikamap")}
                                        className="w-full px-4 py-3 bg-emerald-600 text-white font-bold text-base rounded-lg shadow-md hover:bg-emerald-700 hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={!selectedAddress}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.875 1.875 0 00-1.68 0l-3.252 1.626c-.317.159-.69.159-1.006 0L1.76 3.25C1.037 2.895.25 3.417.25 4.22v12.43c0 .426.24.815.622 1.006l4.875 2.437c.317.159.69.159 1.006 0l3.252-1.626a1.875 1.875 0 001.68 0l3.252 1.626z" />
                                        </svg>
                                        全国地価マップで確認
                                    </button>
                                    <p className="text-xs text-slate-400 text-center mt-1">※自動的に住所がクリップボードにコピーされます</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Land Information Section */}
                    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100 h-full flex flex-col relative overflow-hidden">
                        <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3 mb-6">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center">
                                <span className="bg-blue-600 w-2 h-6 mr-3 rounded-sm"></span>
                                土地情報
                            </h2>
                            <div className="flex bg-slate-100 p-1 rounded-lg">
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

                        <div className="space-y-6 flex-grow">
                            {/* Auto Mode - Active Indicator */}
                            {landValuationMethod === "auto" && (
                                <div className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-2 rounded border border-slate-200 flex items-center gap-2 mb-2">
                                    <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                                    {roadPrice !== "" ? "現在の適用：路線価方式（路線価が入力されています）" : "現在の適用：倍率方式（路線価が未入力のため）"}
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
                                            <div className="flex items-center bg-slate-100 rounded-md p-0.5">
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
                                            placeholder="100"
                                        />
                                    </div>
                                    <details className="group">
                                        <summary className="text-xs text-slate-500 font-medium cursor-pointer hover:text-blue-600 transition-colors select-none flex items-center gap-1">
                                            <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                            補正率など詳細設定 (未実装)
                                        </summary>
                                        <div className="p-3 bg-slate-50 rounded mt-2 text-xs text-slate-400">
                                            Coming Soon...
                                        </div>
                                    </details>
                                </div>
                            )}

                            {/* Multiplier Inputs */}
                            {((landValuationMethod === "multiplier") || (landValuationMethod === "auto" && roadPrice === "")) && (
                                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="pt-2 border-t border-slate-100"> {/* Added separator/padding */}
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
                    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100 h-full flex flex-col">
                        <h2 className="text-lg font-bold text-slate-800 border-b-2 border-slate-100 pb-3 mb-6 flex items-center">
                            <span className="bg-blue-600 w-2 h-6 mr-3 rounded-sm"></span>
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
                                        className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none appearance-none"
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
                                        className="w-full p-3 bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
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
                                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none no-spinner ${invalidFields.includes("age")
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
                                        className="w-full p-3 bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
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
                                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none no-spinner ${invalidFields.includes("floorArea")
                                            ? "bg-red-50 border-red-500 text-red-900 placeholder-red-300"
                                            : "bg-slate-50 border-slate-300"
                                            }`}
                                        placeholder="80"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Result Summary Card (Small Preview) */}


                <div className="py-2">
                    <button
                        onClick={handleCalculate}
                        className="w-full md:w-auto md:min-w-[300px] block mx-auto py-4 px-8 bg-blue-600 text-white font-bold text-lg rounded-xl shadow-lg hover:bg-blue-700 hover:scale-105 active:scale-95 active:translate-y-px transition-all duration-150 ease-out"
                    >
                        価格を計算する
                    </button>
                    {error && (
                        <p className="mt-4 text-red-600 font-bold text-center bg-red-50 p-3 rounded-lg border border-red-200 animate-in fade-in slide-in-from-top-2">
                            <span className="flex items-center justify-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008h-.008v-.008z" />
                                </svg>
                                {error}
                            </span>
                        </p>
                    )}
                </div>

                {results && (
                    <div
                        id="result-card"
                        className="relative bg-white rounded-xl shadow-lg border border-black overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500"
                    >
                        <div className="bg-slate-50 px-6 py-4 border-b border-black flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-800">
                                {TRANSLATIONS[lang].title}
                            </h2>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center bg-white border border-gray-200 rounded-md px-2 py-1 gap-1" data-html2canvas-ignore="true">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-slate-500">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S12 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S12 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                                    </svg>
                                    <select
                                        value={lang}
                                        onChange={(e) => setLang(e.target.value as Lang)}
                                        className="text-sm bg-transparent outline-none text-slate-700 cursor-pointer"
                                        title="言語を選択 / Select Language"
                                    >
                                        <option value="ja">日本語</option>
                                        <option value="en">English</option>
                                        <option value="cn">中文</option>
                                    </select>
                                </div>

                            </div>
                        </div>

                        <div className="p-6 md:p-8 space-y-8">
                            {/* Land Result */}
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-black">
                                <div className="flex-1 w-full text-center md:text-left space-y-2">
                                    <div className="flex items-center justify-center md:justify-start gap-2">
                                        <p className="text-slate-600 text-lg font-bold">{TRANSLATIONS[lang].landPrice}</p>
                                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200">
                                            {TRANSLATIONS[lang].method[results.snapshot.method as "road" | "multiplier"]}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500">
                                        {results.snapshot.method === "road" ? (
                                            TRANSLATIONS[lang].formula.land(
                                                formatCurrency(results.snapshot.roadPrice),
                                                results.snapshot.landArea.toLocaleString(),
                                                formatCurrency(results.landPrice)
                                            )
                                        ) : (
                                            `固定資産税評価額（${formatCurrency(results.snapshot.fixedTaxValue)}） × 倍率（${results.snapshot.multiplier}） ＝ ${formatCurrency(results.landPrice)}`
                                        )}
                                    </p>
                                </div>
                                <div className="text-2xl font-bold text-slate-800 whitespace-nowrap">
                                    {formatCurrency(results.landPrice)}
                                </div>
                            </div>

                            {/* Building Result */}
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-black">
                                <div className="flex-1 w-full text-center md:text-left space-y-2">
                                    <p className="text-slate-600 text-lg font-bold">{TRANSLATIONS[lang].buildingPrice}</p>
                                    <p className="text-sm text-slate-500 leading-relaxed">
                                        {TRANSLATIONS[lang].formula.building(
                                            formatCurrency(results.snapshot.unitPrice),
                                            results.snapshot.floorArea.toLocaleString(),
                                            results.snapshot.usefulLife,
                                            results.snapshot.age,
                                            formatCurrency(results.buildingPrice)
                                        )}
                                    </p>
                                </div>
                                <div className="text-2xl font-bold text-slate-800 whitespace-nowrap">
                                    {formatCurrency(results.buildingPrice)}
                                </div>
                            </div>

                            {/* Total Result */}
                            <div className="flex flex-col md:flex-row items-start justify-between gap-4 pt-2">
                                <div className="flex-1 w-full text-center md:text-left space-y-2">
                                    <p className="text-slate-600 text-lg font-bold">{TRANSLATIONS[lang].total}</p>
                                    <p className="text-sm text-slate-500">
                                        {TRANSLATIONS[lang].formula.total(
                                            formatCurrency(results.landPrice),
                                            formatCurrency(results.buildingPrice),
                                            formatCurrency(results.total)
                                        )}
                                    </p>
                                </div>
                                <div className="text-4xl md:text-5xl font-extrabold text-blue-700 tracking-tight whitespace-nowrap">
                                    {formatCurrency(results.total)}
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
                data-html2canvas-ignore="true"
            />
        </main>
    );
}
