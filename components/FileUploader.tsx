"use client";

import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";

interface FileUploaderProps {
    onFileSelect: (files: File[]) => void;
    isLoading?: boolean;
}

export default function FileUploader({ onFileSelect, isLoading }: FileUploaderProps) {
    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            if (acceptedFiles.length > 0) {
                onFileSelect(acceptedFiles); // Pass all files
            }
        },
        [onFileSelect]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "image/*": [],
            "application/pdf": [],
        },
        maxFiles: 10, // Increased to 10 for images
        disabled: isLoading,
    });

    return (
        <div
            {...getRootProps()}
            className={`
                border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
                ${isDragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-300 hover:border-slate-400 bg-slate-50"
                }
                ${isLoading ? "opacity-50 pointer-events-none" : ""}
            `}
        >
            <input {...getInputProps()} />
            {isLoading ? (
                <div className="flex flex-col items-center justify-center space-y-2">
                    <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-sm font-medium text-slate-600">資料を解析中...</p>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center space-y-2">
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
                        <p className="text-xs text-rose-500 font-bold">
                            ※1日3回 (PDF:10P/10MB内, 画像:10枚/計10MB内) まで
                        </p>
                        <p className="text-xs text-rose-500 font-bold">
                            ※手入力は無制限です
                        </p>
                        <p className="text-xs text-slate-500">
                            画像またはPDFをドラッグ＆ドロップ<br />
                            (土地面積や構造を自動で読み取ります)
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
