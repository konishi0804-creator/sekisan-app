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
        // Convert empty strings to 0 or handle validation if needed.
        // For this requirements, we will treat empty as 0.
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

        // Floor calculation results to integers for cleaner display
        const finalLandPrice = Math.floor(calcLandPrice);
        const finalBuildingPrice = Math.floor(calcBuildingPrice);

        setResults({
            landPrice: finalLandPrice,
            buildingPrice: finalBuildingPrice,
            total: finalLandPrice + finalBuildingPrice,
        });
    };

    return (
        <main className="min-h-screen bg-gray-100 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center text-gray-800">
                    不動産積算シミュレーション
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Land Information Section */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4 text-blue-600 border-b pb-2">
                            土地情報
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    路線価または公示地価 (円/㎡)
                                </label>
                                <input
                                    type="number"
                                    value={roadPrice}
                                    onChange={(e) =>
                                        setRoadPrice(e.target.value === "" ? "" : Number(e.target.value))
                                    }
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="例: 100000"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    土地面積 (㎡)
                                </label>
                                <input
                                    type="number"
                                    value={landArea}
                                    onChange={(e) =>
                                        setLandArea(e.target.value === "" ? "" : Number(e.target.value))
                                    }
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="例: 100"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Building Information Section */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4 text-blue-600 border-b pb-2">
                            建物情報
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    構造
                                </label>
                                <select
                                    value={structure}
                                    onChange={(e) => setStructure(e.target.value as StructureType)}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {Object.keys(STRUCTURES).map((s) => (
                                        <option key={s} value={s}>
                                            {s}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        法定耐用年数
                                    </label>
                                    <input
                                        type="number"
                                        value={usefulLife}
                                        readOnly
                                        className="w-full p-2 border border-gray-300 bg-gray-100 rounded-md text-gray-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        築年数
                                    </label>
                                    <input
                                        type="number"
                                        value={age}
                                        onChange={(e) =>
                                            setAge(e.target.value === "" ? "" : Number(e.target.value))
                                        }
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="例: 10"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        再調達価格単価
                                    </label>
                                    <input
                                        type="number"
                                        value={unitPrice}
                                        readOnly
                                        className="w-full p-2 border border-gray-300 bg-gray-100 rounded-md text-gray-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        延床面積 (㎡)
                                    </label>
                                    <input
                                        type="number"
                                        value={floorArea}
                                        onChange={(e) =>
                                            setFloorArea(e.target.value === "" ? "" : Number(e.target.value))
                                        }
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="例: 80"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-center mb-10">
                    <button
                        onClick={handleCalculate}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-10 rounded-full text-lg shadow-lg transition duration-300 transform hover:scale-105"
                    >
                        計算する
                    </button>
                </div>

                {results && (
                    <div className="bg-white p-8 rounded-xl shadow-xl border-2 border-blue-100">
                        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
                            計算結果
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500 mb-1">土地価格</p>
                                <p className="text-xl font-semibold text-gray-800">
                                    {results.landPrice.toLocaleString()} <span className="text-sm">円</span>
                                </p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500 mb-1">建物価格</p>
                                <p className="text-xl font-semibold text-gray-800">
                                    {results.buildingPrice.toLocaleString()} <span className="text-sm">円</span>
                                </p>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 col-span-1 md:col-span-1">
                                <p className="text-sm text-blue-600 mb-1 font-bold">積算価格合計</p>
                                <p className="text-2xl font-bold text-blue-700">
                                    {results.total.toLocaleString()} <span className="text-base">円</span>
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
