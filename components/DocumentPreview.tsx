"use client";

import React, { useEffect, useState } from 'react';

type CoordinateItem = {
    box: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000 scale
    page: number;
};

interface DocumentPreviewProps {
    fileUrls: string[];
    coordinates?: {
        landArea?: CoordinateItem | null;
        structure?: CoordinateItem | null;
        address?: CoordinateItem | null;
        roadPrice?: CoordinateItem | null;
        age?: CoordinateItem | null;
        floorArea?: CoordinateItem | null;
    } | null;
}

const LABELS: Record<string, { label: string }> = {
    landArea: { label: "土地面積" },
    floorArea: { label: "延床面積" },
    structure: { label: "構造" },
    address: { label: "住所" },
    roadPrice: { label: "路線価" },
    age: { label: "築年数" },
};

export default function DocumentPreview({ fileUrls, coordinates }: DocumentPreviewProps) {
    if (!fileUrls || fileUrls.length === 0) return null;

    const [pagesToRender, setPagesToRender] = useState<number[]>([1]); // Default to page 1

    // Determine relevant pages based on coordinates
    useEffect(() => {
        if (!coordinates) {
            setPagesToRender([1]);
            return;
        }

        const pages = new Set<number>();
        let hasCoords = false;

        Object.values(coordinates).forEach((item) => {
            if (item && item.page) {
                // Ensure page is within bounds of uploaded files
                // Note: fileUrls is 0-indexed, page is 1-based.
                if (item.page <= fileUrls.length) {
                    pages.add(item.page);
                }
                hasCoords = true;
            }
        });

        if (hasCoords && pages.size > 0) {
            setPagesToRender(Array.from(pages).sort((a, b) => a - b));
        } else {
            setPagesToRender([1]); // Fallback
        }
    }, [coordinates, fileUrls.length]);


    return (
        <div className="w-full bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-3 border-b border-slate-200 bg-white flex justify-between items-center flex-wrap gap-2">
                <h3 className="font-bold text-slate-700 text-sm">解析プレビュー</h3>
            </div>

            <div className="relative w-full max-h-[600px] overflow-y-auto bg-slate-100 p-4 space-y-4 text-center">

                {pagesToRender.map((pageNum) => {
                    const url = fileUrls[pageNum - 1]; // 1-based page num to 0-based index
                    if (!url) return null;

                    return (
                        <div key={pageNum} className="relative inline-block shadow-lg max-w-full text-[0px] leading-none">
                            {fileUrls.length > 1 && (
                                <div className="absolute top-0 left-0 bg-slate-800/70 text-white text-xs px-2 py-1 rounded-br z-10">
                                    Page {pageNum}
                                </div>
                            )}

                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={url}
                                alt={`Page ${pageNum}`}
                                className="max-w-full h-auto block"
                            />

                            {/* SVG Overlay Markers */}
                            <svg
                                viewBox="0 0 1000 1000"
                                className="absolute inset-0 w-full h-full pointer-events-none"
                                preserveAspectRatio="none"
                            >
                                {coordinates && Object.entries(coordinates).map(([key, item]) => {
                                    if (!item || item.page !== pageNum) return null;
                                    const [ymin, xmin, ymax, xmax] = item.box;
                                    // Use highlighter colors (no border, transparent fill)
                                    // Default to yellow highlighter style
                                    const conf = LABELS[key] || { label: key, fill: "#facc15" }; // yellow-400

                                    // Map custom style if needed, otherwise use default
                                    const fill = '#facc15'; // default yellow

                                    // Confirmed Visual Offset Correction
                                    // The API coordinates seem consistently shifted up.
                                    // Analysis shows ~1.2% upward shift needs correction.
                                    const Y_OFFSET = 12; // Shifts down by 1.2%
                                    const H_PADDING = 5; // Expands height slightly

                                    return (
                                        <g key={key} className="group pointer-events-auto cursor-help">
                                            <rect
                                                x={xmin}
                                                y={ymin + Y_OFFSET}
                                                width={xmax - xmin}
                                                height={(ymax - ymin) + H_PADDING}
                                                fill={fill}
                                                fillOpacity="0.5"
                                            />
                                            {/* Tooltip via foreignObject or simplified absolute div outside if needed.
                                                Using title for simple native tooltip, or we can keep the custom one separately if strict SVG.
                                                For simplicity and robustness, using a title element here.
                                             */}
                                            <title>{conf.label}</title>
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
