import React from 'react';

type Coordinates = [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000 scale

interface DocumentPreviewProps {
    fileUrl: string | null;
    fileType: string;
    coordinates?: {
        landArea?: Coordinates | null;
        structure?: Coordinates | null;
        address?: Coordinates | null;
        roadPrice?: Coordinates | null;
        age?: Coordinates | null;
    } | null;
}

const LABELS: Record<string, { label: string; color: string; bg: string }> = {
    landArea: { label: "土地面積", color: "border-blue-500", bg: "bg-blue-500/20" },
    structure: { label: "構造", color: "border-green-500", bg: "bg-green-500/20" },
    address: { label: "住所", color: "border-purple-500", bg: "bg-purple-500/20" },
    roadPrice: { label: "路線価", color: "border-red-500", bg: "bg-red-500/20" },
    age: { label: "築年数", color: "border-orange-500", bg: "bg-orange-500/20" },
};

export default function DocumentPreview({ fileUrl, fileType, coordinates }: DocumentPreviewProps) {
    if (!fileUrl) return null;

    const isImage = fileType.startsWith("image/");
    const isPDF = fileType === "application/pdf";

    return (
        <div className="w-full bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-3 border-b border-slate-200 bg-white flex justify-between items-center">
                <h3 className="font-bold text-slate-700 text-sm">解析プレビュー</h3>
                <div className="flex gap-2 text-xs">
                    {coordinates && Object.entries(coordinates).map(([key, val]) => {
                        if (!val) return null;
                        const conf = LABELS[key] || { label: key, color: "border-gray-500", bg: "bg-gray-500/20" };
                        return (
                            <div key={key} className="flex items-center gap-1">
                                <span className={`w-3 h-3 border ${conf.color} ${conf.bg} rounded-sm`}></span>
                                <span className="text-slate-600">{conf.label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="relative w-full max-h-[600px] overflow-auto bg-slate-100 flex justify-center p-4">
                {isImage && (
                    <div className="relative inline-block shadow-lg">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={fileUrl}
                            alt="Document Preview"
                            className="max-w-full h-auto block"
                        />

                        {coordinates && Object.entries(coordinates).map(([key, box]) => {
                            if (!box) return null;
                            const [ymin, xmin, ymax, xmax] = box;
                            const conf = LABELS[key] || { label: key, color: "border-gray-500", bg: "bg-gray-500/20" };

                            return (
                                <div
                                    key={key}
                                    className={`absolute border-2 ${conf.color} ${conf.bg} group cursor-help`}
                                    style={{
                                        top: `${ymin / 10}%`,
                                        left: `${xmin / 10}%`,
                                        height: `${(ymax - ymin) / 10}%`,
                                        width: `${(xmax - xmin) / 10}%`,
                                    }}
                                    title={conf.label}
                                >
                                    <span className="absolute -top-6 left-0 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                        {conf.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}

                {isPDF && (
                    <div className="w-full h-[500px]">
                        <iframe
                            src={`${fileUrl}#toolbar=0&navpanes=0`}
                            className="w-full h-full rounded shadow"
                        />
                        <p className="text-center text-xs text-slate-400 mt-2">
                            ※PDFのマーカー表示は現在サポートされていません
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
