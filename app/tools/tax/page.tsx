"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useFileContext } from "../../../context/FileContext";
import DocumentPreview from "../../../components/DocumentPreview";
import { processFileToImage } from "../../../utils/imageProcessor";
import AdUnit from "../../../components/AdUnit";

export default function TaxProrationPage() {
    // Input State - GRANULAR
    const [landFixedTax, setLandFixedTax] = useState<number | "">("");
    const [landCityTax, setLandCityTax] = useState<number | "">("");
    const [buildingFixedTax, setBuildingFixedTax] = useState<number | "">("");
    const [buildingCityTax, setBuildingCityTax] = useState<number | "">("");

    const [propertyName, setPropertyName] = useState<string>("");
    const [settlementDate, setSettlementDate] = useState<string>("");
    const [startDayMode, setStartDayMode] = useState<"jan1" | "apr1">("jan1");
    const [isTaxable, setIsTaxable] = useState<boolean>(false);

    // Calculation State
    const [result, setResult] = useState<{
        sellerLand: number;
        sellerBuilding: number;
        sellerTotal: number;
        buyerLand: number;
        buyerBuilding: number; // Excl. Tax
        buyerConsumptionTax: number;
        buyerTotal: number;
        sellerDays: number;
        buyerDays: number;
        sellerPeriod: string;
        buyerPeriod: string;
        dailyRateLand: number;
        dailyRateBuilding: number;
    } | null>(null);

    // File & Preview State
    const { files: contextFiles } = useFileContext();
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [coordinates, setCoordinates] = useState<any>(null);
    const [activeField, setActiveField] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Derived State
    const totalLandTax = (Number(landFixedTax) || 0) + (Number(landCityTax) || 0);
    const totalBuildingTax = (Number(buildingFixedTax) || 0) + (Number(buildingCityTax) || 0);
    const totalAnnualTax = totalLandTax + totalBuildingTax;

    useEffect(() => {
        const loadFiles = async () => {
            if (contextFiles.length > 0) {
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

            // Auto-fill Logic (Granular)
            if (info.projectName) setPropertyName(info.projectName);
            if (info.landFixedAssetTax) setLandFixedTax(info.landFixedAssetTax);
            if (info.landCityPlanningTax) setLandCityTax(info.landCityPlanningTax);
            if (info.buildingFixedAssetTax) setBuildingFixedTax(info.buildingFixedAssetTax);
            if (info.buildingCityPlanningTax) setBuildingCityTax(info.buildingCityPlanningTax);

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

    // Handle Calculation
    const handleCalculate = () => {
        setError(null);
        if (!settlementDate) {
            setError("決済日を選択してください。");
            return;
        }

        // Use derived totals
        const lTax = totalLandTax;
        const bTax = totalBuildingTax;

        const settleDate = new Date(settlementDate);
        if (isNaN(settleDate.getTime())) return;

        // Determine Start Date
        let startDate = new Date(settleDate.getFullYear(), 0, 1); // Default Jan 1 same year

        if (startDayMode === "jan1") {
            startDate = new Date(settleDate.getFullYear(), 0, 1);
        } else {
            // April 1 Mode (Fiscal Year)
            if (settleDate.getMonth() < 3) { // Jan, Feb, Mar are 0, 1, 2
                startDate = new Date(settleDate.getFullYear() - 1, 3, 1); // Prev April 1
            } else {
                startDate = new Date(settleDate.getFullYear(), 3, 1); // This April 1
            }
        }

        // Calculate Days logic
        const oneDay = 24 * 60 * 60 * 1000;
        const diffTime = settleDate.getTime() - startDate.getTime();
        let sellerDays = Math.floor(diffTime / oneDay);

        if (sellerDays < 0) sellerDays = 0;

        const totalDays = 365;
        const buyerDays = totalDays - sellerDays;

        // Refined Logic for Splits:
        // Land
        const sellerLand = Math.floor(lTax * (sellerDays / totalDays));
        const buyerLand = lTax - sellerLand;

        // Building
        const sellerBuilding = Math.floor(bTax * (sellerDays / totalDays));
        const buyerBuilding = bTax - sellerBuilding;

        // Consumption Tax (Only on Buyer's portion of Building, if taxable)
        const buyerConsumptionTax = isTaxable ? Math.floor(buyerBuilding * 0.10) : 0;

        // Date String Formatting Helper
        const formatDate = (date: Date) => {
            return `${date.getMonth() + 1}月${date.getDate()}日`;
        };

        // Determine Periods
        // Seller: StartDate ~ SettlementDate - 1 day
        const sellerEndDate = new Date(settleDate);
        sellerEndDate.setDate(settleDate.getDate() - 1);
        const sellerPeriodStr = `${formatDate(startDate)} ～ ${formatDate(sellerEndDate)}`;

        // Buyer: SettlementDate ~ EndDate (StartDate + 1 year - 1 day)
        const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000; // not exactly correct for leap years but for simple "period" display end date logic
        // Actually, straightforward logic:
        // End of period is StartDate + 1 year - 1 day.
        const periodEndDate = new Date(startDate);
        periodEndDate.setFullYear(startDate.getFullYear() + 1);
        periodEndDate.setDate(periodEndDate.getDate() - 1);

        const buyerPeriodStr = `${formatDate(settleDate)} ～ ${formatDate(periodEndDate)}`;

        setResult({
            sellerLand,
            sellerBuilding,
            sellerTotal: sellerLand + sellerBuilding,
            buyerLand,
            buyerBuilding,
            buyerConsumptionTax,
            buyerTotal: buyerLand + buyerBuilding + buyerConsumptionTax,
            sellerDays,
            buyerDays,
            sellerPeriod: sellerPeriodStr,
            buyerPeriod: buyerPeriodStr,
            dailyRateLand: Math.floor(lTax / totalDays),
            dailyRateBuilding: Math.floor(bTax / totalDays),
        });
    };

    return (
        <main className="min-h-screen bg-slate-50 text-slate-800 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-slate-500 hover:text-slate-800 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                            </svg>
                        </Link>
                        <h1 className="text-xl font-bold text-slate-800">固定資産税精算シミュレーション</h1>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Document Preview */}
                    <div className="space-y-6 lg:sticky lg:top-24 lg:self-start lg:h-fit">
                        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-fit">
                            <div className="p-4 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
                                <h2 className="font-bold text-slate-700 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-emerald-600">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                    </svg>
                                    資料プレビュー
                                </h2>
                            </div>
                            <div className="relative min-h-[400px] bg-slate-50">
                                {previewUrls.length > 0 ? (
                                    <DocumentPreview
                                        fileUrls={previewUrls}
                                        coordinates={coordinates}
                                        activeField={activeField}
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                                        <p>資料がアップロードされていません</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Input & Results */}
                    <div className="space-y-6 relative">
                        {/* Loading Overlay */}
                        {isAnalyzing && (
                            <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center animate-in fade-in duration-300">
                                <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center gap-4">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full border-4 border-slate-100"></div>
                                        <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin"></div>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-slate-800 mb-1">AIが資料を解析しています...</p>
                                        <p className="text-xs text-slate-500">しばらくお待ちください</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-emerald-600">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                                計算条件
                            </h2>

                            {error && (
                                <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-8">
                                {/* Property Name */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-600 mb-2">物件名 (任意)</label>
                                    <input
                                        type="text"
                                        value={propertyName}
                                        onChange={(e) => setPropertyName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                        placeholder="例：〇〇マンション 101号室"
                                    />
                                </div>

                                {/* Land Section */}
                                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 space-y-4">
                                    <div className="flex items-center gap-2 text-emerald-800 font-bold border-b border-emerald-200 pb-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                                        </svg>
                                        土地 - 年税額
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">固定資産税</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={landFixedTax}
                                                    onChange={(e) => setLandFixedTax(e.target.value === "" ? "" : Number(e.target.value))}
                                                    onFocus={() => setActiveField("landFixedAssetTax")}
                                                    onBlur={() => setActiveField(null)}
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none text-right font-mono"
                                                    placeholder="0"
                                                />
                                                {coordinates?.landFixedAssetTax && (
                                                    <div className="absolute right-8 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none">
                                                        <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">都市計画税</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={landCityTax}
                                                    onChange={(e) => setLandCityTax(e.target.value === "" ? "" : Number(e.target.value))}
                                                    onFocus={() => setActiveField("landCityPlanningTax")}
                                                    onBlur={() => setActiveField(null)}
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none text-right font-mono"
                                                    placeholder="0"
                                                />
                                                {coordinates?.landCityPlanningTax && (
                                                    <div className="absolute right-8 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none">
                                                        <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end items-center gap-2 text-sm text-emerald-700 font-bold border-t border-emerald-200 pt-2">
                                        <span>計</span>
                                        <span className="font-mono text-lg">¥{totalLandTax.toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Building Section */}
                                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-4">
                                    <div className="flex items-center gap-2 text-blue-800 font-bold border-b border-blue-200 pb-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
                                        </svg>
                                        建物 - 年税額
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">固定資産税</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={buildingFixedTax}
                                                    onChange={(e) => setBuildingFixedTax(e.target.value === "" ? "" : Number(e.target.value))}
                                                    onFocus={() => setActiveField("buildingFixedAssetTax")}
                                                    onBlur={() => setActiveField(null)}
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-right font-mono"
                                                    placeholder="0"
                                                />
                                                {coordinates?.buildingFixedAssetTax && (
                                                    <div className="absolute right-8 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none">
                                                        <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-blue-400 opacity-75"></span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">都市計画税</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={buildingCityTax}
                                                    onChange={(e) => setBuildingCityTax(e.target.value === "" ? "" : Number(e.target.value))}
                                                    onFocus={() => setActiveField("buildingCityPlanningTax")}
                                                    onBlur={() => setActiveField(null)}
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-right font-mono"
                                                    placeholder="0"
                                                />
                                                {coordinates?.buildingCityPlanningTax && (
                                                    <div className="absolute right-8 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none">
                                                        <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-blue-400 opacity-75"></span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end items-center gap-2 text-sm text-blue-700 font-bold border-t border-blue-200 pt-2">
                                        <span>計</span>
                                        <span className="font-mono text-lg">¥{totalBuildingTax.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center bg-slate-100 p-3 rounded-lg border border-slate-200">
                                    <span className="text-sm font-bold text-slate-600">税額合計</span>
                                    <span className="font-mono text-xl font-bold text-slate-800">¥{totalAnnualTax.toLocaleString()}</span>
                                </div>

                                {/* Date & Options */}
                                <div className="space-y-4 pt-4 border-t border-slate-200">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-600 mb-2">決済日 (引渡日)</label>
                                        <input
                                            type="date"
                                            value={settlementDate}
                                            onChange={(e) => setSettlementDate(e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-600 mb-2">起算日 (慣習)</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={() => setStartDayMode("jan1")}
                                                className={`p-3 rounded-lg border-2 text-sm font-bold transition-all ${startDayMode === "jan1" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}
                                            >
                                                1月1日 (関東慣習)
                                            </button>
                                            <button
                                                onClick={() => setStartDayMode("apr1")}
                                                className={`p-3 rounded-lg border-2 text-sm font-bold transition-all ${startDayMode === "apr1" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}
                                            >
                                                4月1日 (関西慣習)
                                            </button>
                                        </div>
                                    </div>

                                    {/* Consumption Tax Toggle */}
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-700">建物清算金に消費税を加算</span>
                                            <span className="text-xs text-slate-400">売主が課税事業者の場合など</span>
                                        </div>
                                        <button
                                            onClick={() => setIsTaxable(!isTaxable)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${isTaxable ? 'bg-emerald-600' : 'bg-slate-200'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isTaxable ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={handleCalculate}
                                    className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-slate-700 hover:shadow-xl transition-all active:scale-[0.98]"
                                >
                                    計算する
                                </button>




                                <div className="mt-8">
                                    <AdUnit slot="0000000000" client="ca-pub-XXXXXXXXXXXXXXXX" />
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Detailed Results (Centered) */}
            {result && (
                <div className="mt-16 mx-auto max-w-[800px] print:mt-0 print:w-full">
                    <div className="relative bg-white text-slate-800 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-xl print:shadow-none">

                        {/* Watermark */}
                        <div className="hidden print:flex absolute inset-0 z-0 items-center justify-center pointer-events-none opacity-[0.08] select-none overflow-hidden">
                            <div className="transform -rotate-45 text-slate-900 font-black text-[100px] whitespace-nowrap leading-none tracking-widest border-4 border-slate-900 p-12 rounded-3xl">
                                SAMPLE
                            </div>
                        </div>

                        {/* Decorative Top Border */}
                        <div className="h-2 bg-gradient-to-r from-emerald-600 to-teal-700"></div>

                        <div className="p-8 md:p-12 flex flex-col h-full bg-gradient-to-br from-white to-slate-50 print:p-0 print:bg-none">

                            {/* Header */}
                            <div className="flex justify-between items-end border-b-2 border-slate-800 pb-4 mb-8">
                                <div>
                                    <p className="text-xs text-slate-500 font-serif tracking-widest mb-1">不動産取引 精算書</p>
                                    <h2 className="text-3xl font-serif font-bold text-slate-900 tracking-wide">
                                        固定資産税等 精算計算書
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

                            {/* Result Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                {/* Buyer */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-3 h-8 bg-blue-600 rounded-full"></div>
                                        <div>
                                            <h3 className="font-bold text-xl text-slate-800">買主様 ご負担額</h3>
                                            <p className="text-xs text-slate-500">起算日～決済日前日までは売主様負担</p>
                                        </div>
                                    </div>

                                    <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
                                        <div className="flex justify-between items-end mb-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-blue-800">負担期間</span>
                                                <span className="text-xs text-slate-500">{result.buyerPeriod}</span>
                                            </div>
                                            <span className="text-2xl font-bold text-blue-700">{result.buyerDays}<span className="text-sm ml-1 text-slate-500">日分</span></span>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex flex-col justify-between border-b border-blue-100 pb-2">
                                                <div className="flex justify-between w-full">
                                                    <span className="text-slate-600">土地分</span>
                                                    <span className="font-mono font-medium">¥{result.buyerLand.toLocaleString()}</span>
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-mono mt-1 text-right">
                                                    土地年税額 {totalLandTax.toLocaleString()} × 日数 {result.buyerDays} / 365
                                                </div>
                                            </div>
                                            <div className="flex flex-col justify-between border-b border-blue-100 pb-2">
                                                <div className="flex justify-between w-full">
                                                    <span className="text-slate-600">建物分 (税抜)</span>
                                                    <span className="font-mono font-medium">¥{result.buyerBuilding.toLocaleString()}</span>
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-mono mt-1 text-right">
                                                    建物年税額 {totalBuildingTax.toLocaleString()} × 日数 {result.buyerDays} / 365
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center pt-1">
                                                <span className="text-sm text-slate-600">消費税 (建物分)</span>
                                                <span className="font-mono text-rose-600 font-medium">
                                                    {result.buyerConsumptionTax > 0 ? `¥${result.buyerConsumptionTax.toLocaleString()}` : "-"}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t-2 border-blue-200 flex justify-between items-end">
                                            <span className="font-bold text-blue-900">ご請求金額</span>
                                            <span className="font-mono text-3xl font-bold text-blue-700">¥{result.buyerTotal.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Seller */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-3 h-8 bg-emerald-600 rounded-full"></div>
                                        <div>
                                            <h3 className="font-bold text-xl text-slate-800">売主様 ご負担額</h3>
                                            <p className="text-xs text-slate-500">起算日～決済日前日</p>
                                        </div>
                                    </div>

                                    <div className="bg-emerald-50/50 p-6 rounded-xl border border-emerald-100">
                                        <div className="flex justify-between items-end mb-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-emerald-800">負担期間</span>
                                                <span className="text-xs text-slate-500">{result.sellerPeriod}</span>
                                            </div>
                                            <span className="text-2xl font-bold text-emerald-700">{result.sellerDays}<span className="text-sm ml-1 text-slate-500">日分</span></span>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex flex-col justify-between border-b border-emerald-100 pb-2">
                                                <div className="flex justify-between w-full">
                                                    <span className="text-slate-600">土地分</span>
                                                    <span className="font-mono font-medium">¥{result.sellerLand.toLocaleString()}</span>
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-mono mt-1 text-right">
                                                    土地年税額 {totalLandTax.toLocaleString()} × 日数 {result.sellerDays} / 365
                                                </div>
                                            </div>
                                            <div className="flex flex-col justify-between border-b border-emerald-100 pb-2">
                                                <div className="flex justify-between w-full">
                                                    <span className="text-slate-600">建物分</span>
                                                    <span className="font-mono font-medium">¥{result.sellerBuilding.toLocaleString()}</span>
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-mono mt-1 text-right">
                                                    建物年税額 {totalBuildingTax.toLocaleString()} × 日数 {result.sellerDays} / 365
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center pt-1 opacity-50">
                                                <span className="text-sm text-slate-600">消費税</span>
                                                <span className="font-mono text-slate-400">-</span>
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t-2 border-emerald-200 flex justify-between items-end">
                                            <span className="font-bold text-emerald-900">負担合計</span>
                                            <span className="font-mono text-3xl font-bold text-emerald-700">¥{result.sellerTotal.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs text-slate-500">
                                <p className="font-bold mb-1">計算条件</p>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li>起算日：{startDayMode === "jan1" ? "1月1日" : "4月1日"}</li>
                                    <li>決済日：{new Date(settlementDate).toLocaleDateString('ja-JP')}</li>
                                    <li>日割計算：365日計算（閏年も365日として計算）</li>
                                    <li>端数処理：円未満切り捨て</li>
                                </ul>
                            </div>

                        </div>
                    </div>
                </div>
            )}

        </main>
    );
}
