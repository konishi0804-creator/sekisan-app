"use client";

import { useState } from "react";

type Slide = {
    title: string;
    description: string;
    icon: React.ReactNode;
};

type Tutorial = {
    id: string;
    title: string;
    description: string;
    slides: Slide[];
};

const TUTORIALS: Tutorial[] = [
    {
        id: "sekisan",
        title: "積算シミュレーション",
        description: "土地・建物の積算価格を自動で計算するツールの使い方です。",
        slides: [
            {
                title: "1. 資料を準備・アップロード",
                description: "物件の資料（マイソクや公図など、住所や面積がわかるもの）をPDFまたは画像でアップロードします。カメラで撮影した写真でもOKです。",
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                ),
            },
            {
                title: "2. AIによる自動解析",
                description: "アップロードされた資料をAIが解析し、必要な情報（所在地、面積、用途地域など）を自動で読み取ります。読み取り結果はフォームに反映されます。",
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                ),
            },
            {
                title: "3. 手動入力も可能です",
                description: "全国地価マップ等と連携し、路線価を自動取得します。もし取得できない場合や間違っている場合は、手動で修正もできます。",
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                ),
            },
            {
                title: "4. 計算結果の表示",
                description: "全ての入力が完了すると、土地・建物の積算価格が算出されます。結果はPDF、PNGとして保存することも可能です。",
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                ),
            },
        ],
    },
];

export default function GuideViewer({ onClose }: { onClose: () => void }) {
    const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

    const handleSelectTutorial = (tutorial: Tutorial) => {
        setSelectedTutorial(tutorial);
        setCurrentSlideIndex(0);
    };

    const handleNext = () => {
        if (!selectedTutorial) return;
        if (currentSlideIndex < selectedTutorial.slides.length - 1) {
            setCurrentSlideIndex((prev) => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentSlideIndex > 0) {
            setCurrentSlideIndex((prev) => prev - 1);
        }
    };

    const handleBackToList = () => {
        setSelectedTutorial(null);
        setCurrentSlideIndex(0);
    };

    // チュートリアル選択画面
    if (!selectedTutorial) {
        return (
            <div className="flex flex-col h-full">
                <div className="mb-6">
                    <p className="text-slate-600 mb-4">
                        機能ごとの使い方ガイドをご覧いただけます。
                        <br />
                        以下から知りたい機能を選択してください。
                    </p>
                </div>
                <div className="grid gap-4">
                    {TUTORIALS.map((tutorial) => (
                        <button
                            key={tutorial.id}
                            onClick={() => handleSelectTutorial(tutorial)}
                            className="cursor-pointer flex items-start p-4 rounded-xl shadow-md transition-all duration-200 active:scale-[0.99] border border-transparent bg-slate-700 hover:bg-slate-800 text-white text-left group"
                        >
                            <div className="p-3 bg-white/10 rounded-lg mr-4 group-hover:bg-white/20 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-lg mb-1">{tutorial.title}</h3>
                                <p className="text-sm text-white/80">{tutorial.description}</p>
                            </div>
                            <div className="ml-auto self-center text-white/70 group-hover:text-white transition-opacity">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </button>
                    ))}


                </div>
            </div>
        );
    }

    // スライド表示画面
    const currentSlide = selectedTutorial.slides[currentSlideIndex];
    const isFirstSlide = currentSlideIndex === 0;
    const isLastSlide = currentSlideIndex === selectedTutorial.slides.length - 1;

    return (
        <div className="flex flex-col h-full">
            {/* Navigation Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <button
                    onClick={handleBackToList}
                    className="cursor-pointer text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    一覧に戻る
                </button>
                <div className="flex gap-1">
                    {selectedTutorial.slides.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-2 rounded-full transition-all duration-300 ${idx === currentSlideIndex ? "w-8 bg-blue-600" : "w-2 bg-slate-200"}`}
                        ></div>
                    ))}
                </div>
            </div>

            {/* Slide Content */}
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4 animate-in fade-in duration-300 w-full" key={currentSlideIndex}>
                <div className="mb-8 p-6 bg-blue-50 rounded-full">
                    {currentSlide.icon}
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">{currentSlide.title}</h3>
                <p className="text-slate-600 leading-relaxed max-w-md mx-auto">
                    {currentSlide.description}
                </p>
            </div>

            {/* Slide Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-100">
                <button
                    onClick={handlePrev}
                    disabled={isFirstSlide}
                    className={`cursor-pointer px-4 py-2 rounded-lg font-medium transition-colors ${isFirstSlide
                        ? "text-slate-300 cursor-not-allowed"
                        : "text-slate-600 hover:bg-slate-100"
                        }`}
                >
                    前へ
                </button>

                {isLastSlide ? (
                    <button
                        onClick={onClose}
                        className="cursor-pointer px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                    >
                        閉じる
                    </button>
                ) : (
                    <button
                        onClick={handleNext}
                        className="cursor-pointer px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium flex items-center gap-2"
                    >
                        次へ
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}
