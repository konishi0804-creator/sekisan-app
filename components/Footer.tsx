"use client";

import { useState } from "react";
import Link from "next/link";
import GuideViewer from "./GuideViewer";

type ModalContent = {
    title: string;
    content: React.ReactNode;
};

const MODAL_CONTENTS: Record<string, ModalContent> = {
    privacy: {
        title: "プライバシーポリシー",
        content: (
            <div className="space-y-6 text-sm leading-relaxed">
                <div>
                    <p className="font-bold text-right mb-2">制定日: 2025年12月24日</p>
                    <p>
                        「EstiRE」（以下、「当サービス」といいます）は、ユーザーの個人情報およびプライバシーを尊重し、その保護に努めます。本プライバシーポリシーでは、当サービスにおける情報の収集、利用、および管理について定めます。
                    </p>
                </div>

                <section>
                    <h3 className="font-bold text-lg mb-2 text-slate-800">1. 収集する情報</h3>
                    <p className="mb-2">当サービスは、以下の情報を収集・取得する場合があります。</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><strong>アップロードされた資料データ</strong>: ユーザーがシミュレーションのためにアップロードした物件概要書（PDF、画像等）に含まれる情報。</li>
                        <li><strong>アクセスログ・Cookie</strong>: サービスの利用状況（IPアドレス、ブラウザの種類、アクセス日時等）を解析するための情報。</li>
                        <li><strong>お問い合わせ情報</strong>: ユーザーからのお問い合わせ時に提供されるメールアドレス等の連絡先情報。</li>
                    </ul>
                </section>

                <section>
                    <h3 className="font-bold text-lg mb-2 text-slate-800">2. 利用目的</h3>
                    <p className="mb-2">取得した情報は、以下の目的で利用します。</p>
                    <ol className="list-decimal pl-5 space-y-1">
                        <li>本サービスの機能（不動産積算価格の試算等）を提供するため。</li>
                        <li>サービスの利用状況を分析し、機能改善や新機能開発に役立てるため。</li>
                        <li>不正アクセスやスパム行為などの不正利用を防止するため。</li>
                        <li>お問い合わせへの対応のため。</li>
                    </ol>
                </section>

                <section>
                    <h3 className="font-bold text-lg mb-2 text-slate-800">3. アップロードデータの取り扱い</h3>
                    <p>
                        ユーザーがアップロードした物件資料データは、シミュレーション結果を生成するためにサーバーまたはブラウザ上で一時的に処理されます。
                        運営者は、法令に基づく場合やデバッグ（不具合調査）等の正当な理由がない限り、ユーザーの同意なくアップロードされたファイルの中身を第三者に閲覧・提供することはありません。
                    </p>
                </section>

                <section>
                    <h3 className="font-bold text-lg mb-2 text-slate-800">4. Googleアナリティクスの利用について</h3>
                    <p>
                        当サービスでは、サービス向上のためにGoogle社の提供するアクセス解析ツール「Googleアナリティクス」を利用しています。
                        Googleアナリティクスは、Cookieを使用してトラフィックデータを収集しますが、これは匿名で収集されており、個人を特定するものではありません。
                        この機能はブラウザの設定でCookieを無効にすることで収集を拒否することができます。詳しくは<a href="https://marketingplatform.google.com/about/analytics/terms/jp/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Googleアナリティクス利用規約</a>をご確認ください。
                    </p>
                </section>

                <section>
                    <h3 className="font-bold text-lg mb-2 text-slate-800">5. 免責事項</h3>
                    <p>
                        当サービスからリンクやバナーなどによって他のサイトに移動された場合、移動先サイトで提供される情報、サービス等について一切の責任を負いません。
                    </p>
                </section>

                <section>
                    <h3 className="font-bold text-lg mb-2 text-slate-800">6. 本ポリシーの変更</h3>
                    <p>
                        当サービスは、必要と判断した場合には、ユーザーへの事前の通知なく本ポリシーを変更することができるものとします。変更後のプライバシーポリシーは、本ウェブサイトに掲載した時点から効力を生じるものとします。
                    </p>
                </section>

                <section>
                    <h3 className="font-bold text-lg mb-2 text-slate-800">7. お問い合わせ</h3>
                    <p>
                        本ポリシーに関するお問い合わせは、当サイトの<button onClick={() => document.querySelector<HTMLElement>('[data-modal-trigger="contact"]')?.click()} className="cursor-pointer text-blue-600 hover:underline">お問い合わせフォーム</button>よりご連絡ください。
                    </p>
                </section>
            </div>
        ),
    },
    terms: {
        title: "サービス利用規約",
        content: (
            <div className="space-y-6 text-sm leading-relaxed">
                <div>
                    <p className="font-bold text-right mb-2">制定日: 2025年12月24日</p>
                    <p>
                        この利用規約（以下、「本規約」といいます。）は、EstiRE事務局（以下、「運営者」といいます。）が提供するサービス「EstiRE」（以下、「本サービス」といいます。）の利用条件を定めるものです。登録ユーザーの皆さま（以下、「ユーザー」といいます。）には、本規約に従って、本サービスをご利用いただきます。
                    </p>
                </div>

                <section>
                    <h3 className="font-bold text-lg mb-2 text-slate-800">第1条（適用）</h3>
                    <p>本規約は、ユーザーと運営者との間の本サービスの利用に関わる一切の関係に適用されるものとします。</p>
                </section>

                <section>
                    <h3 className="font-bold text-lg mb-2 text-slate-800">第2条（サービスの性質と免責）</h3>
                    <ol className="list-decimal pl-5 space-y-2">
                        <li>
                            <strong>シミュレーション結果の非保証</strong><br />
                            本サービスが提供する不動産積算価格、路線価、固定資産税評価額などの算出結果は、独自のアルゴリズムに基づいた概算値（参考情報）です。運営者は、その正確性、完全性、最新性、特定目的への適合性について一切の保証を行いません。
                        </li>
                        <li>
                            <strong>自己責任の原則</strong><br />
                            本サービスの利用結果に基づいて行われた不動産取引、投資判断、融資申込み等によりユーザーに生じた損害について、運営者は一切の責任を負いません。最終的な判断は、必ず不動産鑑定士や税理士等の専門家にご確認ください。
                        </li>
                        <li>
                            <strong>サービスの変更・中断</strong><br />
                            運営者は、ユーザーに事前に通知することなく、本サービスの内容を変更したり、提供を中断・終了したりすることができるものとします。これによってユーザーに生じた損害について、運営者は一切責任を負いません。
                        </li>
                    </ol>
                </section>

                <section>
                    <h3 className="font-bold text-lg mb-2 text-slate-800">第3条（禁止事項）</h3>
                    <p className="mb-2">ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
                    <ol className="list-decimal pl-5 space-y-1">
                        <li>法令または公序良俗に違反する行為</li>
                        <li>犯罪行為に関連する行為</li>
                        <li>本サービスのサーバーまたはネットワークの機能を破壊したり、妨害したりする行為（DDoS攻撃や過度なアクセス等）</li>
                        <li>本サービスのプログラムをリバースエンジニアリング、逆アセンブル、スクレイピング等する行為</li>
                        <li>運営者サービスの運営を妨害するおそれのある行為</li>
                        <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
                        <li>その他、運営者が不適切と判断する行為</li>
                    </ol>
                </section>

                <section>
                    <h3 className="font-bold text-lg mb-2 text-slate-800">第4条（利用制限および登録抹消）</h3>
                    <p>
                        運営者は、ユーザーが本規約のいずれかの条項に違反した場合、事前の通知なく、ユーザーに対して本サービスの全部もしくは一部の利用を制限し、またはユーザーとしての登録を抹消することができるものとします。
                    </p>
                </section>

                <section>
                    <h3 className="font-bold text-lg mb-2 text-slate-800">第5条（著作権）</h3>
                    <p>
                        本サービスに関連する文章、画像、プログラムその他一切のコンテンツの著作権は、運営者または運営者にその利用を許諾した権利者に帰属します。ユーザーは、私的利用の範囲を超えてこれらを無断で複製、転載、改変することはできません。
                    </p>
                </section>

                <section>
                    <h3 className="font-bold text-lg mb-2 text-slate-800">第6条（利用規約の変更）</h3>
                    <p>
                        運営者は、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。なお、本規約の変更後、本サービスの利用を開始した場合には、当該ユーザーは変更後の規約に同意したものとみなします。
                    </p>
                </section>

                <section>
                    <h3 className="font-bold text-lg mb-2 text-slate-800">第7条（個人情報の取扱い）</h3>
                    <p>
                        運営者は、本サービスの利用によって取得する個人情報については、別途定める「<button onClick={() => document.querySelector<HTMLElement>('[data-modal-trigger="privacy"]')?.click()} className="cursor-pointer text-blue-600 hover:underline">プライバシーポリシー</button>」に従い適切に取り扱うものとします。
                    </p>
                </section>

                <section>
                    <h3 className="font-bold text-lg mb-2 text-slate-800">第8条（準拠法・裁判管轄）</h3>
                    <p>
                        本規約の解釈にあたっては、日本法を準拠法とします。本サービスに関して紛争が生じた場合には、運営者の所在地（または東京地方裁判所）を管轄する裁判所を専属的合意管轄とします。
                    </p>
                </section>
            </div>
        ),
    },
    faq: {
        title: "よくある質問",
        content: (
            <div className="space-y-8 text-sm leading-relaxed">
                <section>
                    <h3 className="font-bold text-lg mb-4 text-blue-600 border-b border-slate-100 pb-2">サービス全般について</h3>

                    <div className="mb-6">
                        <p className="font-bold text-slate-900 mb-2">Q. EstiRE（エスティレ）とはどのようなサービスですか？</p>
                        <p className="text-slate-600 ml-4">
                            不動産の「積算価格（せきさんかかく）」を、Web上で簡単にシミュレーションできるツールです。<br />
                            物件の資料（マイソクなど）をアップロードするか、数値を手入力するだけで、土地と建物の評価額を自動で算出します。
                        </p>
                    </div>

                    <div className="mb-6">
                        <p className="font-bold text-slate-900 mb-2">Q. 利用料金はかかりますか？</p>
                        <p className="text-slate-600 ml-4">
                            現在はベータ版として<strong>無料</strong>で公開しております。すべての機能を無料でご利用いただけます。
                        </p>
                    </div>

                    <div className="mb-6">
                        <p className="font-bold text-slate-900 mb-2">Q. スマホでも使えますか？</p>
                        <p className="text-slate-600 ml-4">
                            はい、スマートフォンやタブレットのブラウザからもご利用いただけますが、PCでのご利用を推奨しております。
                        </p>
                    </div>
                </section>

                <section>
                    <h3 className="font-bold text-lg mb-4 text-blue-600 border-b border-slate-100 pb-2">シミュレーション機能について</h3>

                    <div className="mb-6">
                        <p className="font-bold text-slate-900 mb-2">Q. 算出される価格は「売れる価格（市場価格）」と同じですか？</p>
                        <p className="text-slate-600 ml-4">
                            いいえ、異なります。<br />
                            本ツールで算出するのは、主に銀行の融資評価などで用いられる「積算価格」です。実際の市場で売買される「実勢価格」とは乖離がある場合がありますので、あくまで投資判断の目安としてご利用ください。
                        </p>
                    </div>

                    <div className="mb-6">
                        <p className="font-bold text-slate-900 mb-2">Q. PDFや画像をアップロードしても読み込まれないのですが？</p>
                        <p className="text-slate-600 ml-4">
                            画質が荒い場合や、手書き文字、特殊なレイアウトの資料（マイソク）の場合、AIが正しく文字を認識できないことがあります。<br />
                            その場合は、お手数ですが手動入力フォームにて数値を修正・入力してご利用ください。
                        </p>
                    </div>

                    <div className="mb-6">
                        <p className="font-bold text-slate-900 mb-2">Q. 路線価が自動で取得されません。</p>
                        <p className="text-slate-600 ml-4">
                            住所の入力形式によっては、路線価データの自動取得ができない場合があります。<br />
                            その際は、<a href="https://www.chikamap.jp/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-0.5 font-medium">
                                全国地価マップ
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>を参照の上、手動で「路線価（千円/㎡）」を入力してください。
                        </p>
                    </div>
                </section>

                <section>
                    <h3 className="font-bold text-lg mb-4 text-blue-600 border-b border-slate-100 pb-2">セキュリティ・その他</h3>

                    <div className="mb-6">
                        <p className="font-bold text-slate-900 mb-2">Q. アップロードした資料が流出することはありませんか？</p>
                        <p className="text-slate-600 ml-4">
                            はい、ご安心ください。<br />
                            アップロードされたファイルは、シミュレーション結果を表示するために一時的に解析されますが、運営者が無断で第三者に公開・提供することはありません。詳しくは<button onClick={() => document.querySelector<HTMLElement>('[data-modal-trigger="privacy"]')?.click()} className="cursor-pointer text-blue-600 hover:underline">プライバシーポリシー</button>をご覧ください。
                        </p>
                    </div>

                    <div className="mb-6">
                        <p className="font-bold text-slate-900 mb-2">Q. 計算結果を不動産鑑定書として使えますか？</p>
                        <p className="text-slate-600 ml-4">
                            いいえ、使えません。<br />
                            本ツールの結果は簡易的なシミュレーション値であり、不動産鑑定士による鑑定評価とは異なります。公的な証明書類としては利用できません。
                        </p>
                    </div>

                    <div className="mb-6">
                        <p className="font-bold text-slate-900 mb-2">Q. 運営者に連絡を取りたいのですが。</p>
                        <p className="text-slate-600 ml-4">
                            <button onClick={() => document.querySelector<HTMLElement>('[data-modal-trigger="contact"]')?.click()} className="cursor-pointer text-blue-600 hover:underline">お問い合わせフォーム</button>よりご連絡ください。
                        </p>
                    </div>
                </section>
            </div>
        ),
    },
    external: {
        title: "外部送信について",
        content: (
            <div className="space-y-6 text-sm leading-relaxed">
                <div>
                    <h2 className="font-bold text-xl mb-4 text-slate-900">利用者情報の外部送信について</h2>
                    <p className="font-bold text-right mb-4">制定日: 2025年12月24日</p>
                    <p className="mb-4">
                        「EstiRE」（以下、「当サービス」といいます）では、サービスの向上、利用状況の分析、および適切な広告配信等のために、第三者が提供する外部サービスを利用しており、当該サービスに対して利用者の情報を送信しています。
                    </p>
                    <p>
                        電気通信事業法の外部送信規律に基づき、利用する外部サービスの内容、送信される情報、利用目的などを以下の通り公表します。
                    </p>
                </div>

                <section>
                    <h3 className="font-bold text-lg mb-4 text-slate-800 border-b border-slate-200 pb-2">利用している外部サービス一覧</h3>

                    <div className="mb-8">
                        <h4 className="font-bold text-base text-slate-900 mb-2">1. Google Analytics（グーグル・アナリティクス）</h4>
                        <p className="mb-3 text-slate-600">当サービスでは、サイトの利用状況を把握し、サービスの改善に役立てるためにGoogle Analyticsを利用しています。</p>

                        <ul className="list-disc pl-5 space-y-3 text-slate-700">
                            <li>
                                <strong>提供会社</strong>: Google LLC
                            </li>
                            <li>
                                <strong>送信される情報</strong>:
                                <ul className="list-[circle] pl-5 mt-1 space-y-1 text-slate-600">
                                    <li>インターネット通信を行う際に自動的に送信される情報（IPアドレス、デバイスの種類、ブラウザの種類・バージョン、OS情報など）</li>
                                    <li>当サイトの閲覧履歴、閲覧日時、滞在時間、クリック等の操作ログ</li>
                                    <li>Cookie（クッキー）等の識別子</li>
                                </ul>
                            </li>
                            <li>
                                <strong>利用目的</strong>:
                                <ul className="list-[circle] pl-5 mt-1 space-y-1 text-slate-600">
                                    <li>アクセス解析によるサイトの利用状況の把握</li>
                                    <li>サイトの利便性向上およびコンテンツの改善</li>
                                </ul>
                            </li>
                            <li>
                                <strong>オプトアウト（送信停止）</strong>:<br />
                                Google Analyticsによるデータ収集を無効にしたい場合は、以下のページよりアドオンをダウンロード・インストールしてください。<br />
                                <a href="https://tools.google.com/dlpage/gaoptout?hl=ja" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">Google アナリティクス オプトアウト アドオン</a>
                            </li>
                            <li>
                                <strong>詳細情報</strong>:<br />
                                <a href="https://policies.google.com/technologies/partner-sites?hl=ja" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">Googleのサービスを使用するサイトやアプリから収集した情報のGoogleによる使用</a>
                            </li>
                        </ul>
                    </div>
                </section>

                <section>
                    <h3 className="font-bold text-lg mb-4 text-slate-800 border-b border-slate-200 pb-2">お問い合わせ</h3>
                    <p className="mb-4">
                        本公表事項に関するお問い合わせは、<button onClick={() => document.querySelector<HTMLElement>('[data-modal-trigger="contact"]')?.click()} className="cursor-pointer text-blue-600 hover:underline">お問い合わせフォーム</button>よりご連絡ください。
                    </p>
                    <p className="font-bold text-right text-slate-900">運営者: EstiRE事務局</p>
                </section>
            </div>
        ),
    },
    contact: {
        title: "お問い合わせ",
        content: "お問い合わせはこちらまで。\n\nsupport@example.com\nまたは、お問い合わせフォームをご利用ください。",
    },
    guide: {
        title: "使い方機能ガイド",
        content: null,
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
        const FORMSPREE_ENDPOINT = "https://formspree.io/f/meejwror";

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
                            <button
                                onClick={() => openModal("guide")}
                                className="cursor-pointer hover:text-blue-600 hover:underline transition-colors flex items-center gap-1"
                            >
                                <span className="text-slate-400">▶</span> 使い方
                            </button>
                            <button
                                onClick={() => openModal("privacy")}
                                data-modal-trigger="privacy"
                                className="cursor-pointer hover:text-blue-600 hover:underline transition-colors flex items-center gap-1"
                            >
                                <span className="text-slate-400">▶</span> プライバシーポリシー
                            </button>
                            <button onClick={() => openModal("terms")} className="cursor-pointer hover:text-blue-600 hover:underline transition-colors flex items-center gap-1">
                                <span className="text-slate-400">▶</span> サービス利用規約
                            </button>
                            <button onClick={() => openModal("faq")} className="cursor-pointer hover:text-blue-600 hover:underline transition-colors flex items-center gap-1">
                                <span className="text-slate-400">▶</span> よくある質問
                            </button>
                            <button onClick={() => openModal("external")} className="cursor-pointer hover:text-blue-600 hover:underline transition-colors flex items-center gap-1">
                                <span className="text-slate-400">▶</span> 外部送信について
                            </button>
                            <button
                                onClick={() => openModal("contact")}
                                data-modal-trigger="contact"
                                className="cursor-pointer hover:text-blue-600 hover:underline transition-colors flex items-center gap-1"
                            >
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
                                className="cursor-pointer text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-100"
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
                                </form>
                            ) : activeModal === "guide" ? (
                                <GuideViewer onClose={closeModal} />
                            ) : (
                                MODAL_CONTENTS[activeModal].content
                            )}
                        </div>

                        {activeModal !== "guide" && (
                            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                                <button
                                    onClick={closeModal}
                                    className="cursor-pointer px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    閉じる
                                </button>
                                {activeModal === "contact" && (
                                    <button
                                        onClick={handleSubmit} // Trigger form submit logic
                                        disabled={isSubmitting}
                                        className="cursor-pointer px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? "送信中..." : "送信する"}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
