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

    const [formState, setFormState] = useState({
        name: "",
        email: "",
        message: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // TODO: Replace with your actual Formspree Endpoint URL
        // Example: "https://formspree.io/f/xyzyxyzy"
        const FORMSPREE_ENDPOINT = "https://formspree.io/f/YOUR_FORM_ID";

        try {
            const response = await fetch(FORMSPREE_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(formState),
            });

            if (response.ok) {
                alert("お問い合わせを受け付けました。");
                setFormState({ name: "", email: "", message: "" });
                closeModal();
            } else {
                // If the user hasn't set the ID yet, it will fail, which is expected during setup.
                // We'll show a helpful message if it looks like a 404 (ID not found).
                if (response.status === 404) {
                    alert("送信エラー: FormspreeのIDが設定されていません。\nコード内の 'YOUR_FORM_ID' を正しいIDに書き換えてください。");
                } else {
                    alert("送信に失敗しました。時間をおいて再度お試しください。");
                }
            }
        } catch (error) {
            console.error(error);
            alert("送信エラーが発生しました。");
        } finally {
            setIsSubmitting(false);
        }
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
                        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
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
                            {activeModal === "contact" ? (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-bold text-slate-700 mb-1">お名前 <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            required
                                            value={formState.name}
                                            onChange={handleInputChange}
                                            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="例：山田 太郎"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-1">メールアドレス <span className="text-red-500">*</span></label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            required
                                            value={formState.email}
                                            onChange={handleInputChange}
                                            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="例：taro@example.com"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="message" className="block text-sm font-bold text-slate-700 mb-1">お問い合わせ内容 <span className="text-red-500">*</span></label>
                                        <textarea
                                            id="message"
                                            name="message"
                                            required
                                            rows={5}
                                            value={formState.message}
                                            onChange={handleInputChange}
                                            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                            placeholder="お問い合わせ内容を詳しくご記入ください。"
                                        ></textarea>
                                    </div>
                                    <p className="text-xs text-slate-500">※これはデモです。実際には送信されません。</p>
                                </form>
                            ) : (
                                MODAL_CONTENTS[activeModal].content
                            )}
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button
                                onClick={closeModal}
                                className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                閉じる
                            </button>
                            {activeModal === "contact" && (
                                <button
                                    onClick={handleSubmit} // Trigger form submit logic
                                    disabled={isSubmitting}
                                    className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? "送信中..." : "送信する"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
