"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useFileContext } from "../../../context/FileContext";
import DocumentPreview from "../../../components/DocumentPreview";
import { processFileToImage } from "../../../utils/imageProcessor";
import AdUnit from "../../../components/AdUnit";

export default function ApportionmentPage() {
    // Input State
    const [propertyName, setPropertyName] = useState<string>("");
    const [salesPrice, setSalesPrice] = useState<number | "">("");
    const [taxMode, setTaxMode] = useState<"include" | "exclude">("include");
    const [landTaxVal, setLandTaxVal] = useState<number | "">("");
    const [buildingTaxVal, setBuildingTaxVal] = useState<number | "">("");
    const [taxRate, setTaxRate] = useState<number | "">(10);
    const [invalidFields, setInvalidFields] = useState<string[]>([]);

    // File & Preview State
    const { files: contextFiles } = useFileContext();
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [coordinates, setCoordinates] = useState<any>(null);
    const [activeField, setActiveField] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const resultRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (propertyName && propertyName.trim() !== "") {
            document.title = `EstiRE_anbun_${propertyName.trim()}`;
        } else {
            document.title = "EstiRE_anbun";
        }

        // Cleanup on unmount
        return () => {
            document.title = "EstiRE_anbun";
        };
    }, [propertyName]);

    useEffect(() => {
        const loadFiles = async () => {
            if (contextFiles.length > 0) {
                // Determine if we need to analyze
                // Only analyze if it's a NEW file upload (simplification: if coordinates are null)
                // Realistically, might want to track file hash or just always analyze if not analyzed yet for this session.
                // For now, let's just trigger analysis if we have files.

                await handleFileUpload(contextFiles);
            }
        };

        loadFiles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contextFiles]);


    const handleFileUpload = async (files: File[]) => {
        setIsAnalyzing(true);
        setCoordinates(null);
        setActiveField(null);
        setError(null);

        // Preview Setup
        const processedFiles: File[] = [];
        for (const file of files) {
            try {
                const processed = await processFileToImage(file);
                processedFiles.push(processed);
            } catch (err) {
                console.error("Processing failed for", file.name, err);
                processedFiles.push(file);
            }
        }

        // Revoke old URLs and set new ones
        previewUrls.forEach(url => URL.revokeObjectURL(url));
        const newUrls = processedFiles.map(file => URL.createObjectURL(file));
        setPreviewUrls(newUrls);

        try {
            const formData = new FormData();
            processedFiles.forEach((file) => {
                formData.append("files", file);
            });

            // Need user ID for rate limiting? Re-use logic from calc page
            let userId = localStorage.getItem("sekisan_user_id");
            if (!userId) {
                userId = crypto.randomUUID();
                localStorage.setItem("sekisan_user_id", userId);
            }

            const res = await fetch("/api/estimate/parse", {
                method: "POST",
                headers: {
                    "X-User-ID": userId,
                },
                body: formData,
            });

            if (!res.ok) {
                const errData = await res.json();
                if (res.status === 429) {
                    throw new Error("1日3回までの解析制限に達しました。");
                }
                throw new Error(errData.error || "Analysis failed");
            }

            const data = await res.json();
            const info = data.planInfo || {};

            // Auto-fill Logic
            if (info.projectName || info.buildingName) {
                setPropertyName(info.projectName || info.buildingName || "");
            }
            if (info.landTaxValue) setLandTaxVal(info.landTaxValue);
            if (info.buildingTaxValue) setBuildingTaxVal(info.buildingTaxValue);

            // Set Coordinates for preview highlights
            if (data.coordinates) {
                setCoordinates(data.coordinates);
            }

        } catch (e) {
            console.error(e);
            const msg = e instanceof Error ? e.message : "読み取りエラーが発生しました";
            setError(msg);
        } finally {
            setIsAnalyzing(false);
        }
    };


    // Result State
    type ResultType = {
        landPrice: number;
        buildingPriceTaxInc: number;
        buildingPriceTaxEx: number;
        consumptionTax: number;
        ratio: number;
    } | null;

    const [result, setResult] = useState<ResultType>(null);
    const [error, setError] = useState<string | null>(null);

    const handleCalculate = () => {
        setError(null);
        setResult(null);
        setInvalidFields([]); // Clear previous invalid fields

        // Validation
        const missing: string[] = [];
        if (salesPrice === "") missing.push("salesPrice");
        if (landTaxVal === "") missing.push("landTaxVal");
        if (buildingTaxVal === "") missing.push("buildingTaxVal");

        if (missing.length > 0) {
            setInvalidFields(missing);
            setError("未入力の項目があります");
            return;
        }

        const price = Number(salesPrice);
        const lTax = Number(landTaxVal);
        const bTax = Number(buildingTaxVal);

        if (lTax + bTax === 0) {
            setError("固定資産税評価額の合計が0円です");
            return;
        }

        // 1. Calculate Ratio
        // Ratio = Building / (Land + Building)
        const ratioRaw = bTax / (lTax + bTax);
        const rate = (typeof taxRate === 'number' ? taxRate : 10) / 100;

        let lPrice, bPriceInc, bPriceEx, tax;

        if (taxMode === "include") {
            // Input is Tax Included
            // Building Price (Tax Included)
            bPriceInc = Math.round(price * ratioRaw);
            // Land Price
            lPrice = price - bPriceInc;
            // Building Price (Tax Excluded)
            bPriceEx = Math.round(bPriceInc / (1 + rate));
            // Consumption Tax
            tax = bPriceInc - bPriceEx;
        } else {
            // Input is Tax Excluded (Land + Building Ex)
            // Building Price (Tax Excluded)
            bPriceEx = Math.round(price * ratioRaw);
            // Land Price
            lPrice = price - bPriceEx;
            // Building Price (Tax Included)
            bPriceInc = Math.round(bPriceEx * (1 + rate));
            // Consumption Tax
            tax = bPriceInc - bPriceEx;
        }

        setResult({
            landPrice: lPrice,
            buildingPriceTaxInc: bPriceInc,
            buildingPriceTaxEx: bPriceEx,
            consumptionTax: tax,
            ratio: ratioRaw * 100,
        });

        // Scroll to result
        setTimeout(() => {
            resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
    };

    const formatCurrency = (val: number) => {
        return val.toLocaleString("ja-JP", { style: "currency", currency: "JPY" });
    };

    const formatPercent = (val: number) => {
        return val.toLocaleString("ja-JP", { maximumFractionDigits: 4 }) + "%";
    };

    const handleDownloadPDF = async () => {
        // Direct print for better UX and less blocking
        window.print();
    };

    return (
        <main className="min-h-screen bg-[#f3f4f6] pb-20 font-sans print:bg-white print:pb-0">
            <div className={`mx-auto px-4 py-8 print:p-0 print:m-0 print:max-w-none transition-all duration-300 ${previewUrls.length > 0 ? "max-w-[1500px] px-6" : "max-w-4xl"
                }`}>

                {/* Back to Home & Header */}
                <div className="mb-8 text-center print:hidden">
                    <div className="mb-6 flex justify-start">
                        <Link href="/" className="group inline-flex items-center px-5 py-2.5 text-sm font-bold text-slate-600 bg-white rounded-full shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-200 hover:text-blue-600 hover:-translate-y-0.5 transition-all duration-300">
                            <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center mr-2 group-hover:bg-blue-100 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-600 transition-colors">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                                </svg>
                            </span>
                            HOMEに戻る
                        </Link>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-700 tracking-tight">
                        土地建物評価額按分シミュレーション
                    </h1>
                    <p className="mt-2 text-slate-500 text-sm">
                        評価額から土地と建物の価格内訳を算出します。
                    </p>
                </div>

                {/* Dynamic Grid Layout */}
                <div className={`gap-6 items-start transition-all duration-300 print:hidden ${previewUrls.length > 0 ? "grid grid-cols-1 lg:grid-cols-12" : "max-w-xl mx-auto"
                    }`}>

                    {/* INPUT & RESULT COLUMN */}
                    <div className={`space-y-6 ${previewUrls.length > 0 ? "lg:col-span-5 order-2 lg:order-2" : "w-full"
                        } relative`}>

                        {/* Loading Overlay */}
                        {isAnalyzing && (
                            <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center animate-in fade-in duration-300 h-full min-h-[400px]">
                                <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center gap-4">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full border-4 border-slate-100"></div>
                                        <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-slate-800 mb-1">AIが資料を解析しています...</p>
                                        <p className="text-xs text-slate-500">しばらくお待ちください</p>
                                    </div>
                                </div>
                            </div>
                        )}


                        {/* Input Section */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
                            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center">
                                <span className="bg-blue-500 w-1.5 h-5 mr-3 rounded-sm"></span>
                                計算条件
                            </h2>

                            <div className="space-y-4">
                                {/* Property Name */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 mb-1">
                                        物件名 <span className="text-xs font-normal text-slate-400 ml-1">(任意)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={propertyName}
                                        onChange={(e) => setPropertyName(e.target.value)}
                                        placeholder="例：〇〇マンション"
                                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>

                                {/* Tax Rate */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 mb-1">
                                        消費税率
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={taxRate}
                                            onChange={(e) => setTaxRate(e.target.value === "" ? "" : Number(e.target.value))}
                                            placeholder="10"
                                            className="w-full p-3 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-right font-mono text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                                    </div>
                                </div>

                                {/* Sales Price */}
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-sm font-bold text-slate-600">
                                            売買代金
                                        </label>
                                        <div className="flex bg-slate-100 rounded-lg p-1">
                                            <button
                                                onClick={() => setTaxMode("include")}
                                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${taxMode === "include"
                                                    ? "bg-white text-blue-600 shadow-sm"
                                                    : "text-slate-500 hover:text-slate-700"
                                                    }`}
                                            >
                                                税込
                                            </button>
                                            <button
                                                onClick={() => setTaxMode("exclude")}
                                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${taxMode === "exclude"
                                                    ? "bg-white text-blue-600 shadow-sm"
                                                    : "text-slate-500 hover:text-slate-700"
                                                    }`}
                                            >
                                                税抜
                                            </button>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={salesPrice}
                                            onChange={(e) => {
                                                setSalesPrice(e.target.value === "" ? "" : Number(e.target.value));
                                                if (invalidFields.includes("salesPrice")) {
                                                    setInvalidFields(prev => prev.filter(f => f !== "salesPrice"));
                                                }
                                            }}
                                            onFocus={() => setActiveField("price")}
                                            placeholder="50000000"
                                            className={`w-full p-3 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-right font-mono text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all ${invalidFields.includes("salesPrice")
                                                ? "bg-red-50 border-red-500 text-red-900 placeholder-red-300"
                                                : "border-slate-300 text-slate-900"
                                                }`}
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">円</span>
                                    </div>
                                </div>

                                {/* Land Tax Value */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 mb-1">
                                        土地の評価額
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={landTaxVal}
                                            onChange={(e) => {
                                                setLandTaxVal(e.target.value === "" ? "" : Number(e.target.value));
                                                if (invalidFields.includes("landTaxVal")) {
                                                    setInvalidFields(prev => prev.filter(f => f !== "landTaxVal"));
                                                }
                                            }}
                                            onFocus={() => setActiveField("landTaxValue")}
                                            placeholder="20000000"
                                            className={`w-full p-3 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-right font-mono text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all ${invalidFields.includes("landTaxVal")
                                                ? "bg-red-50 border-red-500 text-red-900 placeholder-red-300"
                                                : "border-slate-300 text-slate-900"
                                                }`}
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">円</span>
                                    </div>
                                </div>

                                {/* Building Tax Value */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 mb-1">
                                        建物の評価額
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={buildingTaxVal}
                                            onChange={(e) => {
                                                setBuildingTaxVal(e.target.value === "" ? "" : Number(e.target.value));
                                                if (invalidFields.includes("buildingTaxVal")) {
                                                    setInvalidFields(prev => prev.filter(f => f !== "buildingTaxVal"));
                                                }
                                            }}
                                            onFocus={() => setActiveField("buildingTaxValue")}
                                            placeholder="10000000"
                                            className={`w-full p-3 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-right font-mono text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all ${invalidFields.includes("buildingTaxVal")
                                                ? "bg-red-50 border-red-500 text-red-900 placeholder-red-300"
                                                : "border-slate-300 text-slate-900"
                                                }`}
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">円</span>
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {error}
                                </div>
                            )}

                            <div className="text-left mb-2">
                                <p className="text-xs text-slate-500">※実際の評価額が反映されているかご確認ください。</p>
                            </div>

                            <button
                                onClick={handleCalculate}
                                className="w-full bg-rose-800 hover:bg-rose-900 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm transition-all duration-200 text-lg flex items-center justify-center cursor-pointer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 mr-2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                按分を計算する
                            </button>
                        </div>
                    </div>


                    {/* PREVIEW COLUMN (RIGHT) */}
                    {previewUrls.length > 0 && (
                        <div className="lg:col-span-7 space-y-6 order-1 lg:order-1 lg:sticky lg:top-8 h-fit">
                            <DocumentPreview
                                fileUrls={previewUrls}
                                coordinates={coordinates}
                                activeField={activeField}
                            />
                        </div>
                    )}

                </div>


                {/* Result Section */}
                {result && (
                    <div ref={scrollRef} className="mt-16 mx-auto max-w-[800px] print:mt-0 print:w-full print:max-w-none">
                        {/* AdSense Unit */}
                        <div className="mb-8 print:hidden">
                            <AdUnit slot="1234567890" client="ca-pub-7926468542755717" />
                        </div>

                        <div className="flex justify-end items-center gap-2 mb-4 print:hidden relative z-50">
                            <button
                                type="button"
                                onClick={handleDownloadPDF}
                                className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-md text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm"
                                title="PDFダウンロード"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                </svg>
                                PDF保存
                            </button>
                        </div>

                        <div
                            ref={resultRef}
                            className="relative bg-white text-slate-800 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 print:shadow-none print:animate-none"
                        >
                            {/* Watermark for Free Plan */}
                            <div className="hidden print:flex absolute inset-0 z-0 items-center justify-center pointer-events-none opacity-[0.08] select-none overflow-hidden">
                                <div className="transform -rotate-45 text-slate-900 font-black text-[120px] whitespace-nowrap leading-none tracking-widest border-4 border-slate-900 p-12 rounded-3xl">
                                    SAMPLE
                                    <div className="text-[40px] text-center mt-4 tracking-normal font-bold">EstiRE Free Plan</div>
                                </div>
                            </div>
                            {/* Decorative Top Border */}
                            <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-700"></div>

                            <div className="p-8 md:p-12 flex flex-col h-full bg-gradient-to-br from-white to-slate-50 print:p-0 print:bg-none">

                                {/* Header */}
                                <div className="flex justify-between items-end border-b-2 border-slate-800 pb-4 mb-8">
                                    <div>
                                        <p className="text-xs text-slate-500 font-serif tracking-widest mb-1">不動産売買代金按分シミュレーション</p>
                                        <h2 className="text-3xl font-serif font-bold text-slate-900 tracking-wide">
                                            按分計算結果
                                        </h2>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400">作成日</p>
                                        <p className="text-sm font-medium">{new Date().toLocaleDateString('ja-JP')}</p>
                                    </div>
                                </div>

                                {/* Property Info */}
                                <div className="mb-8">
                                    <p className="text-xs text-slate-400 mb-1">対象不動産</p>
                                    <p className="text-lg font-bold border-b border-slate-200 pb-1">
                                        {propertyName || "(物件名未入力)"}
                                    </p>
                                </div>


                                {/* Ratio Visual Bar */}
                                <div className="mb-8">
                                    <div className="flex justify-between items-end mb-2">
                                        <div>
                                            <div className="text-lg font-bold text-slate-800 mb-1">按分比率</div>
                                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono leading-relaxed mt-2">
                                                <span>
                                                    建物按分率 =
                                                </span>
                                                <div className="flex flex-col items-center">
                                                    <div className="border-b border-slate-400 px-2 pb-0.5 mb-0.5 whitespace-nowrap">
                                                        建物評価額 {formatCurrency(Number(buildingTaxVal))}
                                                    </div>
                                                    <div className="px-2 pt-0.5 whitespace-nowrap">
                                                        土地 {formatCurrency(Number(landTaxVal))} + 建物 {formatCurrency(Number(buildingTaxVal))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right flex gap-6 items-baseline">
                                            <span className="text-sm font-bold text-slate-500">土地 <span className="font-mono text-2xl text-emerald-600 ml-1">{formatPercent(100 - result.ratio)}</span></span>
                                            <span className="text-sm font-bold text-slate-500">建物 <span className="font-mono text-2xl text-blue-700 ml-1">{formatPercent(result.ratio)}</span></span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-8 overflow-hidden flex shadow-inner">
                                        <div
                                            className="bg-emerald-500 h-full"
                                            style={{ width: `${100 - result.ratio}%` }}
                                        ></div>
                                        <div
                                            className="bg-blue-600 h-full"
                                            style={{ width: `${result.ratio}%` }}
                                        ></div>
                                    </div>
                                </div>


                                {/* Main Content Grid */}
                                <div className="space-y-4">

                                    {/* Land Section */}
                                    <div className="bg-slate-50/50 p-6 rounded-lg border border-slate-100">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-3 rounded-lg shadow-md shadow-emerald-100 flex-shrink-0">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-slate-800">土地価格</h3>
                                                <p className="text-xs text-slate-500">
                                                    固定資産税評価額比率による按分
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-start mb-2">
                                            <div className="text-sm text-slate-500">
                                                <div className="flex items-center gap-2">
                                                    <span>
                                                        売買代金<span className="text-[10px] text-slate-400">({taxMode === "include" ? "税込" : "税抜"})</span> <span className="font-medium text-slate-700">{formatCurrency(Number(salesPrice))}</span>
                                                        <span className="mx-2">×</span>
                                                    </span>
                                                    <div className="flex flex-col items-center text-[10px] text-slate-400 font-mono">
                                                        <div className="border-b border-slate-400 px-2 pb-0.5 mb-0.5 whitespace-nowrap">
                                                            土地 {formatCurrency(Number(landTaxVal))}
                                                        </div>
                                                        <div className="px-2 pt-0.5 whitespace-nowrap">
                                                            土地 {formatCurrency(Number(landTaxVal))} + 建物 {formatCurrency(Number(buildingTaxVal))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-2xl font-bold text-slate-800 mt-2">
                                                {formatCurrency(result.landPrice)}
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
                                                <h3 className="font-bold text-lg text-slate-800">建物価格</h3>
                                                <p className="text-xs text-slate-500">
                                                    消費税（{taxRate}%）を含む
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mb-6">
                                            <div className="text-sm text-slate-500 w-full">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span>
                                                        売買代金<span className="text-[10px] text-slate-400">({taxMode === "include" ? "税込" : "税抜"})</span> <span className="font-medium text-slate-700">{formatCurrency(Number(salesPrice))}</span>
                                                        <span className="mx-2">×</span>
                                                    </span>
                                                    <div className="flex flex-col items-center text-[10px] text-slate-400 font-mono">
                                                        <div className="border-b border-slate-400 px-2 pb-0.5 mb-0.5 whitespace-nowrap">
                                                            建物 {formatCurrency(Number(buildingTaxVal))}
                                                        </div>
                                                        <div className="px-2 pt-0.5 whitespace-nowrap">
                                                            土地 {formatCurrency(Number(landTaxVal))} + 建物 {formatCurrency(Number(buildingTaxVal))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2">
                                            <div className="w-full max-w-[300px] space-y-1">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="font-bold text-slate-500">本体価格</span>
                                                    <span className="font-mono font-bold text-slate-700 text-sm">{formatCurrency(result.buildingPriceTaxEx)}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="font-bold text-slate-500">消費税</span>
                                                    <span className="font-mono font-bold text-slate-700 text-sm">{formatCurrency(result.consumptionTax)}</span>
                                                </div>
                                                <div className="border-t border-slate-300 my-1"></div>
                                                <div className="flex justify-between items-baseline">
                                                    <span className="text-sm font-bold text-slate-700">税込価格</span>
                                                    <span className="text-3xl font-bold text-slate-800 font-mono">{formatCurrency(result.buildingPriceTaxInc)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>

                                {/* Total Price Section */}
                                <div className="mt-4 pt-4 border-t-2 border-slate-800">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xl font-bold text-slate-700">売買代金 総額</h3>
                                        <div className="text-5xl font-serif font-bold text-indigo-900 subpixel-antialiased">
                                            {formatCurrency(result.landPrice + result.buildingPriceTaxInc)}
                                        </div>
                                    </div>
                                    <p className="text-right text-xs text-slate-400 mt-2">※消費税率{typeof taxRate === 'number' ? taxRate : 10}%で計算しています</p>
                                </div>

                                {/* Footer Logo/Brand */}
                                <div className="mt-12 pt-4 text-center opacity-40">
                                    <div className="flex items-center justify-center gap-2 text-slate-400 font-serif italic">
                                        <span className="h-px w-8 bg-slate-300"></span>
                                        <span>EstiRE Anbun</span>
                                        <span className="h-px w-8 bg-slate-300"></span>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main >
    );
}
