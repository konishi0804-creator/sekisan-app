"use client";

import { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";

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

export default function CalcPage() {
    // Land Information State
    const [roadPrice, setRoadPrice] = useState<number | "">("");
    const [landArea, setLandArea] = useState<number | "">("");

    // Building Information State
    const [structure, setStructure] = useState<StructureType>("木造");
    const [usefulLife, setUsefulLife] = useState<number>(22);
    const [age, setAge] = useState<number | "">("");
    const [unitPrice, setUnitPrice] = useState<number>(150000);
    const [floorArea, setFloorArea] = useState<number | "">("");

    // Result State
    const [results, setResults] = useState<{
        landPrice: number;
        buildingPrice: number;
        total: number;
        snapshot: {
            roadPrice: number;
            landArea: number;
            unitPrice: number;
            usefulLife: number;
            age: number;
            floorArea: number;
        };
    } | null>(null);

    const resultRef = useRef<HTMLDivElement>(null);

    // Auto-fill logic based on structure change
    useEffect(() => {
        const data = STRUCTURES[structure];
        setUnitPrice(data.unitPrice);
        setUsefulLife(data.usefulLife);
    }, [structure]);

    const handleCalculate = () => {
        const rPrice = roadPrice === "" ? 0 : roadPrice;
        const lArea = landArea === "" ? 0 : landArea;
        const bAge = age === "" ? 0 : age;
        const fArea = floorArea === "" ? 0 : floorArea;

        // Land Logic
        const calcLandPrice = rPrice * lArea;

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
                roadPrice: rPrice,
                landArea: lArea,
                unitPrice: unitPrice,
                usefulLife: usefulLife,
                age: bAge,
                floorArea: fArea,
            },
        });
    };

    const handleCapture = async () => {
        if (!resultRef.current) return;

        try {
            const canvas = await html2canvas(resultRef.current, {
                scale: 2, // Improve quality
                backgroundColor: "#ffffff",
                ignoreElements: (element: Element) => element.classList.contains("screenshot-ignore"),
            } as any);

            canvas.toBlob(async (blob) => {
                if (!blob) return;

                try {
                    // Attempt to write to clipboard
                    await navigator.clipboard.write([
                        new ClipboardItem({ "image/png": blob }),
                    ]);
                    alert("結果をクリップボードにコピーしました！");
                } catch (err) {
                    console.warn("Clipboard copy failed, falling back to download.", err);
                    // Fallback to download
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "sekisan-result.png";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }
            });
        } catch (err) {
            console.error("Screenshot capture failed:", err);
            alert("画像の保存に失敗しました。");
        }
    };

    const formatCurrency = (val: number) => {
        return val.toLocaleString("ja-JP", { style: "currency", currency: "JPY" });
    };

    return (
        <main className="min-h-screen bg-slate-50 p-4 md:p-8 text-slate-700">
            <div className="max-w-[960px] mx-auto space-y-8">
                <div className="text-center">
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                        不動産積算シミュレーション
                    </h1>
                    <p className="text-sm text-slate-500 mt-2">
                        土地と建物の情報を入力して、概算評価額を計算します
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Land Information Section */}
                    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-100 h-full flex flex-col">
                        <h2 className="text-lg font-bold text-slate-800 border-b-2 border-slate-100 pb-3 mb-6 flex items-center">
                            <span className="bg-blue-600 w-2 h-6 mr-3 rounded-sm"></span>
                            土地情報
                        </h2>
                        <div className="space-y-6 flex-grow">
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 mb-2">
                                    路線価または公示地価 (円/㎡)
                                </label>
                                <input
                                    type="number"
                                    value={roadPrice}
                                    onChange={(e) =>
                                        setRoadPrice(e.target.value === "" ? "" : Number(e.target.value))
                                    }
                                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                    placeholder="100000"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 mb-2">
                                    土地面積 (㎡)
                                </label>
                                <input
                                    type="number"
                                    value={landArea}
                                    onChange={(e) =>
                                        setLandArea(e.target.value === "" ? "" : Number(e.target.value))
                                    }
                                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                    placeholder="100"
                                />
                            </div>
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
                                        onChange={(e) =>
                                            setAge(e.target.value === "" ? "" : Number(e.target.value))
                                        }
                                        className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
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
                                        onChange={(e) =>
                                            setFloorArea(e.target.value === "" ? "" : Number(e.target.value))
                                        }
                                        className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                        placeholder="80"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="py-2">
                    <button
                        onClick={handleCalculate}
                        className="w-full md:w-auto md:min-w-[300px] block mx-auto py-4 px-8 bg-blue-600 text-white font-bold text-lg rounded-xl shadow-lg hover:bg-blue-700 hover:scale-105 active:scale-95 active:translate-y-px transition-all duration-150 ease-out"
                    >
                        価格を計算する
                    </button>
                </div>

                {results && (
                    <div
                        ref={resultRef}
                        className="relative bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500"
                    >
                        {/* Screenshot Button */}
                        <button
                            onClick={handleCapture}
                            className="screenshot-ignore absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 p-2 rounded-full shadow-sm text-gray-600 transition-colors z-10"
                            title="参考積算結果を画像コピー"
                            aria-label="参考積算結果を画像コピー"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-5 h-5"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
                                />
                            </svg>
                        </button>

                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                            <h2 className="text-xl font-bold text-slate-800 text-center">
                                参考積算価格
                            </h2>
                        </div>

                        <div className="p-6 md:p-8 space-y-8">
                            {/* Land Result */}
                            <div className="flex flex-col md:flex-row items-start justify-between gap-4 pb-6 border-b border-slate-100">
                                <div className="flex-1 w-full text-center md:text-left space-y-2">
                                    <p className="text-slate-600 text-lg font-bold">土地価格</p>
                                    <p className="text-sm text-slate-500">
                                        土地価格 ＝ 路線価（{formatCurrency(results.snapshot.roadPrice)}）
                                        × 土地面積（{results.snapshot.landArea.toLocaleString()}㎡）
                                        ＝ {formatCurrency(results.landPrice)}
                                    </p>
                                </div>
                                <div className="text-2xl font-bold text-slate-800 whitespace-nowrap">
                                    {formatCurrency(results.landPrice)}
                                </div>
                            </div>

                            {/* Building Result */}
                            <div className="flex flex-col md:flex-row items-start justify-between gap-4 pb-6 border-b border-slate-100">
                                <div className="flex-1 w-full text-center md:text-left space-y-2">
                                    <p className="text-slate-600 text-lg font-bold">建物価格</p>
                                    <p className="text-sm text-slate-500 leading-relaxed">
                                        建物価格 ＝ 再調達単価（{formatCurrency(results.snapshot.unitPrice)}）
                                        × 延床面積（{results.snapshot.floorArea.toLocaleString()}㎡）
                                        × {'{'} (法定耐用年数 {results.snapshot.usefulLife}年 − 築年数 {results.snapshot.age}年)
                                        ÷ 法定耐用年数 {results.snapshot.usefulLife}年 {'}'}
                                        ＝ {formatCurrency(results.buildingPrice)}
                                    </p>
                                </div>
                                <div className="text-2xl font-bold text-slate-800 whitespace-nowrap">
                                    {formatCurrency(results.buildingPrice)}
                                </div>
                            </div>

                            {/* Total Result */}
                            <div className="pt-2 text-center md:text-right">
                                <p className="text-sm text-slate-400 mb-2">
                                    参考積算価格 ＝ 土地価格 ＋ 建物価格 ＝ {formatCurrency(results.total)}
                                </p>
                                <div className="inline-flex flex-col md:flex-row items-end md:items-baseline gap-2">
                                    <span className="text-lg font-bold text-blue-600">参考積算価格</span>
                                    <span className="text-4xl md:text-5xl font-extrabold text-blue-700 tracking-tight">
                                        {formatCurrency(results.total)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
```
