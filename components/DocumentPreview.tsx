"use client";

import React, { useEffect, useState, useRef } from 'react';

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
    activeField?: string | null;
}

const LABELS: Record<string, { label: string }> = {
    landArea: { label: "土地面積" },
    floorArea: { label: "延床面積" },
    structure: { label: "構造" },
    address: { label: "住所" },
    roadPrice: { label: "路線価" },
    age: { label: "築年数" },
};

export default function DocumentPreview({ fileUrls, coordinates, activeField }: DocumentPreviewProps) {
    const [pagesToRender, setPagesToRender] = useState<number[]>([1]);
    const containerRef = useRef<HTMLDivElement>(null);
    const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

    const DEBUG_MODE = process.env.NEXT_PUBLIC_DEBUG_PDF_HIGHLIGHT === 'true';

    if (!fileUrls || fileUrls.length === 0) return null;

    // Reset
    useEffect(() => {
        setPagesToRender([1]);
    }, [fileUrls.length]);

    // Determine pages to show
    useEffect(() => {
        if (!coordinates) return;
        const pages = new Set<number>();
        pages.add(1);
        Object.values(coordinates).forEach((item) => {
            if (item && item.page && item.page <= fileUrls.length) pages.add(item.page);
        });
        if (pages.size > 0) setPagesToRender(Array.from(pages).sort((a, b) => a - b));
    }, [coordinates, fileUrls.length]);


    // Scroll
    useEffect(() => {
        if (!activeField || !coordinates || !coordinates[activeField as keyof typeof coordinates]) return;
        const item = coordinates[activeField as keyof typeof coordinates];
        if (!item || !item.page) return;
        if (containerRef.current) {
            const targetEl = pageRefs.current[item.page];
            if (targetEl) {
                const relativeY = item.box[0] / 1000;
                const pixelY = targetEl.offsetTop + (targetEl.offsetHeight * relativeY);
                containerRef.current.scrollTo({ top: Math.max(0, pixelY - 100), behavior: 'smooth' });
            }
        }
    }, [activeField, coordinates, pagesToRender]);

    return (
        <div className="w-full bg-slate-50 rounded-xl border border-slate-200 overflow-hidden relative">

            <div className="p-3 border-b border-slate-200 bg-white flex justify-between items-center flex-wrap gap-2">
                <h3 className="font-bold text-slate-700 text-sm">解析プレビュー (Normalized 1000x1000)</h3>
            </div>

            <div
                ref={containerRef}
                className="relative w-full h-[calc(100vh-8rem)] overflow-y-auto bg-slate-100 p-4 space-y-4 text-center"
            >
                {pagesToRender.map((pageNum) => {
                    const url = fileUrls[pageNum - 1];
                    if (!url) return null;

                    return (
                        <div
                            key={pageNum}
                            className="relative inline-block shadow-lg max-w-full text-[0px] leading-none"
                            ref={(el) => { if (el) pageRefs.current[pageNum] = el; }}
                        >
                            {/* Page Indicator */}
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
                            // Image is already processed to 1000x1000 square by imageProcessor
                            />

                            {/* SVG Overlay - Unified 1000x1000 Coordination */}
                            <svg
                                viewBox="0 0 1000 1000"
                                className="absolute inset-0 w-full h-full pointer-events-none"
                                preserveAspectRatio="none"
                            >
                                {coordinates && activeField && (() => {
                                    const item = coordinates[activeField as keyof typeof coordinates];
                                    if (!item || item.page !== pageNum) return null;

                                    const [ymin, xmin, ymax, xmax] = item.box;

                                    return (
                                        <g>
                                            <rect
                                                x={xmin}
                                                y={ymin}
                                                width={xmax - xmin}
                                                height={ymax - ymin}
                                                fill="#ef4444"
                                                fillOpacity="0.2"
                                                stroke="#ef4444"
                                                strokeWidth="3"
                                                className="animate-pulse"
                                            />

                                        </g>
                                    );
                                })()}
                            </svg>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
