"use client";

import { useState, useEffect } from "react";
import html2canvas from "html2canvas";

import Link from "next/link";
import FileUploader from "../../components/FileUploader";
import DocumentPreview from "../../components/DocumentPreview";
import { useFileContext } from "../../context/FileContext";


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
        subtitle: "不動産積算価格シミュレーション",
        title: "参考積算価格",
        date: "作成日",
        sections: {
            target: "対象不動産",
            noAddress: "（住所未入力）",
            land: "土地評価額",
            landMethod: {
                road: "路線価法による試算",
                multiplier: "倍率法による試算"
            },
            landDetails: {
                roadPrice: "路線価",
                area: "地積",
                fixedTax: "固定資産税評価",
                multiplier: "倍率"
            },
            building: "建物評価額",
            buildingDetails: {
                unitPrice: "再調達単価",
                floorArea: "延床面積",
                usefulLife: "法定耐用年数",
                age: "築年数"
            },
            buildingMethod: (structure: string, age: number) => `原価法による試算（${structure} / 築${age}年）`,
            total: "積算価格 合計",
            disclaimer: "※本試算結果は概算であり、実際の評価額を保証するものではありません。"
        },
        structures: {
            "木造": "木造",
            "軽量鉄骨造": "軽量鉄骨造",
            "重量鉄骨造": "重量鉄骨造",
            "RC造・SRC造": "RC造・SRC造"
        },
        formula: {
            land: (road: string, area: string, total: string) =>
                `土地価格 ＝ 路線価（${road}） × 土地面積（${area}㎡） ＝ ${total}`,
            building: (unit: string, area: string, life: number, age: number, total: string) => (
                <div className="inline-block align-middle">
                    <span>建物価格 ＝ 再調達単価（{unit}） × 延床面積（{area}㎡）</span>
                    <div className="inline-flex items-center ml-1 align-middle">
                        <span className="mr-2">×</span>
                        <div className="flex flex-col items-center text-center leading-none text-xs sm:text-sm">
                            <span className="border-b border-slate-500 pb-1 mb-1 px-1">
                                法定耐用年数 {life}年 − 築年数 {age}年
                            </span>
                            <span className="">
                                法定耐用年数 {life}年
                            </span>
                        </div>
                        <span className="ml-2">＝ {total}</span>
                    </div>
                </div>
            ),
            total: (land: string, building: string, total: string) =>
                `参考積算価格 ＝ 土地価格（${land}） ＋ 建物価格（${building}） ＝ ${total}`
        }
    },
    en: {
        subtitle: "Real Estate Value Simulation",
        title: "Estimated Price",
        date: "Date",
        sections: {
            target: "Property Address",
            noAddress: "(No Address)",
            land: "Land Valuation",
            landMethod: {
                road: "Roadside Value Method",
                multiplier: "Multiplier Method"
            },
            landDetails: {
                roadPrice: "Road Price",
                area: "Land Area",
                fixedTax: "Fixed Tax Value",
                multiplier: "Multiplier"
            },
            building: "Building Valuation",
            buildingDetails: {
                unitPrice: "Replacement Cost",
                floorArea: "Floor Area",
                usefulLife: "Useful Life",
                age: "Age"
            },
            buildingMethod: (structure: string, age: number) => `Cost Method (${structure} / ${age} years old)`,
            total: "Estimated Total",
            disclaimer: "*This result is an approximation and does not guarantee the actual appraisal value."
        },
        structures: {
            "木造": "Wood",
            "軽量鉄骨造": "Light Steel",
            "重量鉄骨造": "Heavy Steel",
            "RC造・SRC造": "RC/SRC"
        },
        formula: {
            land: (road: string, area: string, total: string) =>
                `Land Price = Road Price (${road}) × Area (${area}㎡) = ${total}`,
            building: (unit: string, area: string, life: number, age: number, total: string) => (
                <div className="inline-block align-middle">
                    <span>Building Price = Replacement Cost ({unit}) × Floor Area ({area}㎡)</span>
                    <div className="inline-flex items-center ml-1 align-middle">
                        <span className="mr-2">×</span>
                        <div className="flex flex-col items-center text-center leading-none text-xs sm:text-sm">
                            <span className="border-b border-slate-500 pb-1 mb-1 px-1">
                                Useful Life {life}y − Age {age}y
                            </span>
                            <span className="">
                                Useful Life {life}y
                            </span>
                        </div>
                        <span className="ml-2">= {total}</span>
                    </div>
                </div>
            ),
            total: (land: string, building: string, total: string) =>
                `Total = Land Price (${land}) + Building Price (${building}) = ${total}`
        }
    },
    cn: {
        subtitle: "房地产积算价格模拟",
        title: "参考估算价格",
        date: "日期",
        sections: {
            target: "目标房产",
            noAddress: "（未输入地址）",
            land: "土地估价额",
            landMethod: {
                road: "路线价法试算",
                multiplier: "倍率法试算"
            },
            landDetails: {
                roadPrice: "路线价",
                area: "土地面积",
                fixedTax: "固定资产税评估",
                multiplier: "倍率"
            },
            building: "建筑估价额",
            buildingDetails: {
                unitPrice: "重置单价",
                floorArea: "建筑面积",
                usefulLife: "法定耐用年限",
                age: "房龄"
            },
            buildingMethod: (structure: string, age: number) => `原价法试算（${structure} / 房龄${age}年）`,
            total: "积算价格 合计",
            disclaimer: "※本试算结果仅为概算，不保证实际评估额。"
        },
        structures: {
            "木造": "木造",
            "軽量鉄骨造": "轻量铁骨",
            "重量鉄骨造": "重量铁骨",
            "RC造・SRC造": "RC/SRC"
        },
        formula: {
            land: (road: string, area: string, total: string) =>
                `土地价格 ＝ 路线价（${road}） × 土地面积（${area}㎡） ＝ ${total}`,
            building: (unit: string, area: string, life: number, age: number, total: string) => (
                <div className="inline-block align-middle">
                    <span>建筑价格 ＝ 重置单价（{unit}） × 建筑面积（{area}㎡）</span>
                    <div className="inline-flex items-center ml-1 align-middle">
                        <span className="mr-2">×</span>
                        <div className="flex flex-col items-center text-center leading-none text-xs sm:text-sm">
                            <span className="border-b border-slate-500 pb-1 mb-1 px-1">
                                法定耐用年限 {life}年 − 房龄 {age}年
                            </span>
                            <span className="">
                                法定耐用年限 {life}年
                            </span>
                        </div>
                        <span className="ml-2">＝ {total}</span>
                    </div>
                </div>
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
    const [targetPropertyName, setTargetPropertyName] = useState<string>(""); // New Custom Property Name State

    // Preview State
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [fileType, setFileType] = useState<string>("");

    type CoordinateItem = {
        box: [number, number, number, number];
        page: number;
    };
    type ExtractedCoordinates = {
        landArea?: CoordinateItem | null;
        structure?: CoordinateItem | null;
        address?: CoordinateItem | null;
        roadPrice?: CoordinateItem | null;
        age?: CoordinateItem | null;
        floorArea?: CoordinateItem | null;
    } | null;

    const [coordinates, setCoordinates] = useState<ExtractedCoordinates>(null);

    const { files: contextFiles, setFiles: setContextFiles } = useFileContext();


    // User ID for rate limiting
    useEffect(() => {
        let id = localStorage.getItem("sekisan_user_id");
        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem("sekisan_user_id", id);
        }
    }, []);

    // Handle files passed from Home page via Context
    useEffect(() => {
        if (contextFiles.length > 0) {
            handleFileUpload(contextFiles);

        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contextFiles]);

    // Auto-fill logic based on structure change
    useEffect(() => {
        const data = STRUCTURES[structure];
        setUnitPrice(data.unitPrice);
        setUsefulLife(data.usefulLife);
    }, [structure]);

    // Dynamic Title for Print Filename
    useEffect(() => {
        const base = "EstiRE_sekisan_";
        let suffix = "";

        if (targetPropertyName && targetPropertyName.trim() !== "") {
            suffix = targetPropertyName.trim();
        } else if (selectedAddress && selectedAddress.trim() !== "") {
            suffix = selectedAddress.trim();
        }

        if (suffix) {
            document.title = `${base}${suffix}`;
        } else {
            document.title = "EstiRE";
        }

        // Cleanup on unmount
        return () => {
            document.title = "EstiRE";
        };
    }, [targetPropertyName, selectedAddress]);

    const handleFileUpload = async (files: File[]) => {
        setIsAnalyzing(true);
        setError(null);
        setAddressCandidates([]); // Reset candidates
        setSelectedAddress("");   // Reset selection
        setCoordinates(null);

        // Preview Setup
        if (files.length > 0) {
            // Revoke old URLs
            previewUrls.forEach(url => URL.revokeObjectURL(url));

            const urls = files.map(file => URL.createObjectURL(file));
            setPreviewUrls(urls);
            setFileType(files[0].type);
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
                missingFields.push(TRANSLATIONS[lang].sections.landDetails.roadPrice);
                newInvalidFields.push("roadPrice");
            }
            if (landArea === "") {
                missingFields.push(TRANSLATIONS[lang].sections.landDetails.area);
                newInvalidFields.push("landArea");
            }
        } else if (effectiveMethod === "multiplier") {
            if (fixedTaxValue === "") {
                missingFields.push(TRANSLATIONS[lang].sections.landDetails.fixedTax);
                newInvalidFields.push("fixedTaxValue");
            }
            if (multiplier === "") {
                missingFields.push(TRANSLATIONS[lang].sections.landDetails.multiplier);
                newInvalidFields.push("multiplier");
            }
        }

        if (age === "") {
            missingFields.push(TRANSLATIONS[lang].sections.buildingDetails.age);
            newInvalidFields.push("age");
        }
        if (floorArea === "") {
            missingFields.push(TRANSLATIONS[lang].sections.buildingDetails.floorArea);
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

    const handlePrint = () => {
        window.print();
    };

    const handleScreenshot = async () => {
        const element = document.getElementById("result-card");
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: "#ffffff",
                useCORS: true,
                logging: false,
            } as any);
            const dataUrl = canvas.toDataURL("image/png");

            // Construct Filename
            const base = "EstiRE_sekisan_";
            let suffix = "";
            if (targetPropertyName && targetPropertyName.trim() !== "") {
                suffix = targetPropertyName.trim();
            } else if (selectedAddress && selectedAddress.trim() !== "") {
                suffix = selectedAddress.trim();
            }
            const filename = suffix ? `${base}${suffix}.png` : "EstiRE.png";

            // Trigger Download
            const link = document.createElement('a');
            link.download = filename;
            link.href = dataUrl;
            link.click();

        } catch (err) {
            console.error("Screenshot failed", err);
            alert("画像を保存できませんでした");
        }
    };

    return (
        <main className="min-h-screen bg-[#f3f4f6] pb-20 font-sans print:bg-white print:pb-0">
            <div className="max-w-6xl mx-auto px-4 py-8 print:p-0 print:m-0 print:max-w-none">

                {/* Back to Home - Hide on Print */}
                <div className="mb-6 print:hidden">
                    <Link href="/" className="group inline-flex items-center px-5 py-2.5 text-sm font-bold text-slate-600 bg-white rounded-full shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-200 hover:text-blue-600 hover:-translate-y-0.5 transition-all duration-300">
                        <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center mr-2 group-hover:bg-blue-100 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-600 transition-colors">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                            </svg>
                        </span>
                        HOMEに戻る
                    </Link>
                </div>

                {/* Header - Hide on Print */}
                <div className="mb-8 text-center print:hidden">
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-700 tracking-tight">
                        不動産積算価格シミュレーション
                    </h1>
                    <p className="mt-2 text-slate-500 text-sm">
                        土地・建物情報を入力して、積算評価額を自動計算します。
                    </p>
                </div>

                {/* Dynamic Layout Container */}
                <div className={`
                    gap-6 items-start print:hidden transition-all duration-300
                    ${previewUrls.length > 0 ? "grid grid-cols-1 lg:grid-cols-12" : "max-w-xl mx-auto"}
                `}>

                    {/* INPUT FORMS (Span 5 when previewing, Full width when centered) */}
                    <div className={`
                        space-y-6
                        ${previewUrls.length > 0 ? "lg:col-span-5 order-2 lg:order-2" : "w-full"}
                    `}>

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
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">
                                            物件名 (任意)
                                        </label>
                                        <input
                                            type="text"
                                            value={targetPropertyName}
                                            onChange={(e) => setTargetPropertyName(e.target.value)}
                                            placeholder="例：鈴木様邸、〇〇マンション"
                                            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50"
                                        />
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

                    {/* RIGHT COLUMN: DOCUMENT PREVIEW & RESULTS (Show only if files exist) */}
                    {previewUrls.length > 0 && (
                        <div className="lg:col-span-7 space-y-6 order-1 lg:order-1 lg:sticky lg:top-8 h-fit">


                            <DocumentPreview
                                fileUrls={previewUrls}
                                coordinates={coordinates}
                            />
                        </div>
                    )}
                </div>

                {/* Result Summary Card (Small Preview) */}
                {results && (
                    <div className="space-y-4">
                        {/* Controls Toolbar */}
                        <div className="flex justify-end items-center gap-2 print:hidden">
                            {/* Screenshot Button */}
                            <button
                                onClick={handleScreenshot}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-md text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm"
                                title="画像を保存/コピー"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                                </svg>
                                保存・コピー
                            </button>

                            {/* Print Button */}
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-md text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm"
                                title="印刷"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008h-.008V10.5Zm-3 0h.008v.008h-.008V10.5Z" />
                                </svg>
                                印刷
                            </button>

                            {/* Separator */}
                            <div className="w-px h-4 bg-slate-300 mx-1"></div>

                            {/* Lang Selector */}
                            <select
                                value={lang}
                                onChange={(e) => setLang(e.target.value as Lang)}
                                className="text-xs bg-white border border-slate-300 rounded px-2 py-1.5 text-slate-600 outline-none hover:bg-slate-50 cursor-pointer shadow-sm"
                            >
                                <option value="ja">日本語</option>
                                <option value="en">English</option>
                                <option value="cn">中文</option>
                            </select>
                        </div>

                        <div
                            id="result-card"
                            className="relative bg-white text-slate-800 shadow-2xl print:shadow-none overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 mx-auto max-w-[800px] print:max-w-none print:w-full"
                        >
                            {/* Decorative Top Border */}
                            <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-700"></div>

                            <div className="p-8 md:p-12 flex flex-col h-full bg-gradient-to-br from-white to-slate-50 print:p-0 print:bg-none">

                                {/* Header */}
                                <div className="flex justify-between items-end border-b-2 border-slate-800 pb-4 mb-8">
                                    <div>
                                        <p className="text-xs text-slate-500 font-serif tracking-widest mb-1">{TRANSLATIONS[lang].subtitle}</p>
                                        <h2 className="text-3xl font-serif font-bold text-slate-900 tracking-wide">
                                            {TRANSLATIONS[lang].title}
                                        </h2>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400">{TRANSLATIONS[lang].date}</p>
                                        <p className="text-sm font-medium">{new Date().toLocaleDateString('ja-JP')}</p>
                                    </div>
                                </div>

                                {/* Property Info */}
                                <div className="mb-6">
                                    <p className="text-xs text-slate-400 mb-1">{TRANSLATIONS[lang].sections.target}</p>
                                    <p className="text-lg font-bold border-b border-slate-200 pb-1">
                                        {targetPropertyName || selectedAddress || TRANSLATIONS[lang].sections.noAddress}
                                    </p>
                                </div>

                                {/* Main Content Grid */}
                                <div className="space-y-4">

                                    {/* Land Section */}
                                    <div className="bg-slate-50/50 p-6 rounded-lg border border-slate-100">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-3 rounded-lg shadow-md shadow-blue-100 flex-shrink-0">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.159.69.159 1.006 0Z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-slate-800">{TRANSLATIONS[lang].sections.land}</h3>
                                                <p className="text-xs text-slate-500">
                                                    {results.snapshot.method === "road" ? TRANSLATIONS[lang].sections.landMethod.road : TRANSLATIONS[lang].sections.landMethod.multiplier}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-baseline mb-2">
                                            <div className="text-sm text-slate-500">
                                                {results.snapshot.method === "road" ? (
                                                    <span>
                                                        {TRANSLATIONS[lang].sections.landDetails.roadPrice} <span className="font-medium text-slate-700">{formatCurrency(results.snapshot.roadPrice)}</span>
                                                        <span className="mx-2">×</span>
                                                        {TRANSLATIONS[lang].sections.landDetails.area} <span className="font-medium text-slate-700">{results.snapshot.landArea.toLocaleString()}㎡</span>
                                                    </span>
                                                ) : (
                                                    <span>
                                                        {TRANSLATIONS[lang].sections.landDetails.fixedTax} <span className="font-medium text-slate-700">{formatCurrency(results.snapshot.fixedTaxValue)}</span>
                                                        <span className="mx-2">×</span>
                                                        {TRANSLATIONS[lang].sections.landDetails.multiplier} <span className="font-medium text-slate-700">{results.snapshot.multiplier}</span>
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
                                            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-3 rounded-lg shadow-md shadow-indigo-100 flex-shrink-0">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-slate-800">{TRANSLATIONS[lang].sections.building}</h3>
                                                <p className="text-xs text-slate-500">{TRANSLATIONS[lang].sections.buildingMethod(TRANSLATIONS[lang].structures[structure] || structure, results.snapshot.age)}</p>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-baseline mb-2">
                                            <div className="text-sm text-slate-500 w-full">
                                                <div className="leading-relaxed">
                                                    {TRANSLATIONS[lang].formula.building(
                                                        formatCurrency(results.snapshot.unitPrice),
                                                        results.snapshot.floorArea.toLocaleString(),
                                                        results.snapshot.usefulLife,
                                                        results.snapshot.age,
                                                        formatCurrency(results.buildingPrice)
                                                    )}
                                                </div>
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
                                        <h3 className="text-xl font-bold text-slate-700">{TRANSLATIONS[lang].sections.total}</h3>
                                        <div className="text-5xl font-serif font-bold text-indigo-900 subpixel-antialiased">
                                            {formatCurrency(results.total)}
                                        </div>
                                    </div>
                                    <p className="text-right text-xs text-slate-400 mt-2">{TRANSLATIONS[lang].sections.disclaimer}</p>
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
