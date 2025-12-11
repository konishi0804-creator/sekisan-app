"use client";

import { useState, useEffect } from "react";

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
    } | null>(null);

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
        });
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
                    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                            <h2 className="text-xl font-bold text-slate-800 text-center">計算結果</h2>
                        </div>

                        <div className="p-6 md:p-8 space-y-8">
                            {/* Land Result */}
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-100">
                                <div className="flex-1 w-full text-center md:text-left">
                                    <p className="text-sm text-slate-400 mb-1">
                                        土地価格 ＝ 路線価（円/㎡） × 土地面積（㎡）
                                    </p>
                                    <p className="text-slate-600 text-sm font-medium">土地価格</p>
                                </div>
                                <div className="text-2xl font-bold text-slate-800">
                                    ¥ {results.landPrice.toLocaleString()}
                                </div>
                            </div>

                            {/* Building Result */}
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-100">
                                <div className="flex-1 w-full text-center md:text-left">
                                    <p className="text-sm text-slate-400 mb-1">
                                        建物価格 ＝ 再調達単価 × 延床面積 × ｛（法定耐用年数 − 築年数） ÷ 法定耐用年数｝
                                    </p>
                                    <p className="text-slate-600 text-sm font-medium">建物価格</p>
                                </div>
                                <div className="text-2xl font-bold text-slate-800">
                                    ¥ {results.buildingPrice.toLocaleString()}
                                </div>
                            </div>

                            {/* Total Result */}
                            <div className="pt-2 text-center md:text-right">
                                <p className="text-sm text-slate-400 mb-2">
                                    合計価格 ＝ 土地価格 ＋ 建物価格
                                </p>
                                <div className="inline-flex flex-col md:flex-row items-end md:items-baseline gap-2">
                                    <span className="text-lg font-bold text-blue-600">積算価格合計</span>
                                    <span className="text-4xl md:text-5xl font-extrabold text-blue-700 tracking-tight">
                                        ¥ {results.total.toLocaleString()}
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
