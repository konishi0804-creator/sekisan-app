"use client";

import { useState } from "react";
import Link from "next/link";

type ModalContent = {
    title: string;
    content: string;
};

const MODAL_CONTENTS: Record<string, ModalContent> = {
    privacy: {
        title: "プライバシーポリシー",
        content: "ここにプライバシーポリシーの定型文が入ります。\n\n1. 個人情報の取り扱いについて...\n2. 利用目的...\n3. 第三者への提供...",
    },
    terms: {
        title: "サービス利用規約",
        content: "ここにサービス利用規約の定型文が入ります。\n\n第1条（適用）...\n第2条（定義）...\n第3条（禁止事項）...",
    },
    faq: {
        title: "よくある質問",
        content: "事前によく寄せられる質問とその回答をここに記載します。\n\nQ. 費用はかかりますか？\nA. 基本的に無料です。\n\nQ. 計算結果は正確ですか？\nA. あくまで概算です。",
    },
    external: {
        title: "外部送信について",
        content: "外部送信に関するポリシーをここに記載します。\n\n当サイトでは、利用状況の分析のためにGoogle Analyticsを使用しています...",
    },
    contact: {
        title: "お問い合わせ",
        content: "お問い合わせはこちらまで。\n\nsupport@example.com\nまたは、お問い合わせフォームをご利用ください。",
    },
};

export default function Footer() {
    const [activeModal, setActiveModal] = useState<string | null>(null);

    const openModal = (key: string) => {
        setActiveModal(key);
        document.body.style.overflow = "hidden"; // Prevent background scrolling
    };

    const closeModal = () => {
        setActiveModal(null);
        document.body.style.overflow = "unset";
    };

    return (
        <>
            <footer className="w-full bg-white border-t border-slate-200 mt-auto">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

                        {/* Links Section */}
                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
                            <button onClick={() => openModal("privacy")} className="hover:text-blue-600 hover:underline transition-colors flex items-center gap-1">
                                <span className="text-slate-400">▶</span> プライバシーポリシー
                            </button>
                            <button onClick={() => openModal("terms")} className="hover:text-blue-600 hover:underline transition-colors flex items-center gap-1">
                                <span className="text-slate-400">▶</span> サービス利用規約
                            </button>
                            <button onClick={() => openModal("faq")} className="hover:text-blue-600 hover:underline transition-colors flex items-center gap-1">
                                <span className="text-slate-400">▶</span> よくある質問
                            </button>
                            <button onClick={() => openModal("external")} className="hover:text-blue-600 hover:underline transition-colors flex items-center gap-1">
                                <span className="text-slate-400">▶</span> 外部送信について
                            </button>
                            <button onClick={() => openModal("contact")} className="hover:text-blue-600 hover:underline transition-colors flex items-center gap-1">
                                <span className="text-slate-400">▶</span> お問い合わせ
                            </button>
                        </div>


                    </div>

                    {/* Top border decoration similar to image */}
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-blue-600 w-[95%] mx-auto -mt-[1px]"></div>
                </div>
            </footer>

            {/* Modal */}
            {activeModal && MODAL_CONTENTS[activeModal] && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={closeModal}
                >
                    <div
                        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900">
                                {MODAL_CONTENTS[activeModal].title}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-100"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto whitespace-pre-wrap leading-relaxed text-slate-700">
                            {MODAL_CONTENTS[activeModal].content}
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                            <button
                                onClick={closeModal}
                                className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                閉じる
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
