"use client";

import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
// pdfjs-dist dynamic import used in convertPdfToImages to avoid SSR issues


interface FileUploaderProps {
    onFileSelect: (files: File[]) => void;
    isLoading?: boolean;
}

export default function FileUploader({ onFileSelect, isLoading }: FileUploaderProps) {
    const [isConverting, setIsConverting] = React.useState(false);

    const convertPdfToImages = async (file: File): Promise<File[]> => {
        const pdfJS = await import('pdfjs-dist');
        pdfJS.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

        const arrayBuffer = await file.arrayBuffer();

        const pdf = await pdfJS.getDocument({
            data: arrayBuffer,
            cMapUrl: 'https://unpkg.com/pdfjs-dist@4.4.168/cmaps/',
            cMapPacked: true,
        }).promise;

        const images: File[] = [];
        const pageCount = Math.min(pdf.numPages, 10); // Limit to 10 pages

        for (let i = 1; i <= pageCount; i++) {
            const page: any = await pdf.getPage(i); // Cast to any to avoid strict type issues with render
            const viewport = page.getViewport({ scale: 2.0 }); // 2x scale for quality
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            if (!context) continue;

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({
                canvasContext: context,
                viewport: viewport,
            }).promise;

            // Convert to blob
            const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.95));

            if (blob) {
                const imageFile = new File([blob], `${file.name}_page${i}.jpg`, { type: "image/jpeg" });
                images.push(imageFile);
            }
        }
        return images;
    };

    const onDrop = useCallback(
        async (acceptedFiles: File[]) => {
            if (acceptedFiles.length > 0) {
                const file = acceptedFiles[0];
                if (file.type === "application/pdf") {
                    setIsConverting(true);
                    try {
                        const images = await convertPdfToImages(file);
                        onFileSelect(images);
                    } catch (e) {
                        console.error("PDF Conversion Failed", e);
                        alert("PDFの変換に失敗しました。");
                        onFileSelect([]);
                    } finally {
                        setIsConverting(false);
                    }
                } else {
                    onFileSelect(acceptedFiles); // Pass images directly
                }
            }
        },
        [onFileSelect]
    );

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        onDrop,
        accept: {
            "image/*": [],
            "application/pdf": [],
        },
        maxFiles: 10,
        disabled: isLoading || isConverting,
        noClick: true,
    });

    const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFileSelect(Array.from(e.target.files));
        }
    };

    const showLoading = isLoading || isConverting;

    return (
        <div
            {...getRootProps()}
            className={`
                border-2 border-dashed rounded-xl p-6 text-center transition-colors relative
                ${isDragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-300 bg-slate-50"
                }
                ${showLoading ? "opacity-50 pointer-events-none" : ""}
            `}
        >
            <input {...getInputProps()} />

            {/* Camera Input (Hidden) */}
            <input
                type="file"
                accept="image/*"
                capture="environment"
                id="cameraInput"
                className="hidden"
                onChange={handleCameraCapture}
                disabled={showLoading}
            />

            {showLoading ? (
                <div className="flex flex-col items-center justify-center space-y-2">
                    <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-sm font-medium text-slate-600">
                        {isConverting ? "PDFを画像に変換中..." : "資料を解析中..."}
                    </p>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center space-y-4">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-10 h-10 text-slate-400"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                        />
                    </svg>

                    <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-600">
                            不動産資料をアップロード
                        </p>
                        <p className="mt-2 text-xs text-rose-500 font-bold">
                            ※1日3回 (PDF:10P/10MB内, 画像:10枚/計10MB内) まで
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                            (土地面積や構造を自動で読み取ります)
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-3 w-full max-w-sm">
                        {/* File Select Button */}
                        <button
                            type="button"
                            onClick={open}
                            className="flex-1 min-w-[140px] px-4 py-2 bg-white border border-slate-300 shadow-sm rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                            ファイル選択
                        </button>

                        {/* Camera Button */}
                        <label
                            htmlFor="cameraInput"
                            className="flex-1 min-w-[140px] px-4 py-2 bg-blue-600 shadow-md shadow-blue-200 rounded-lg text-sm font-bold text-white hover:bg-blue-700 hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                            </svg>
                            写真を撮る
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
}
