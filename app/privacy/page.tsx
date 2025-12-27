import Link from "next/link";

export default function PrivacyPolicy() {
    return (
        <div className="bg-slate-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-xl overflow-hidden">
                <div className="px-6 py-8 border-b border-slate-100">
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 border-l-4 border-blue-600 pl-4">
                        プライバシーポリシー
                    </h1>
                    <p className="text-slate-500 text-sm mt-2 text-right">制定日: 2025年12月24日</p>
                </div>

                <div className="p-8 space-y-8 text-slate-700 leading-relaxed">
                    <section>
                        <p className="mb-4">
                            「EstiRE」（以下、「当サービス」といいます）は、ユーザーの個人情報およびプライバシーを尊重し、その保護に努めます。本プライバシーポリシーでは、当サービスにおける情報の収集、利用、および管理について定めます。
                        </p>
                    </section>

                    <section>
                        <h2 className="font-bold text-xl mb-3 text-slate-900 border-b pb-2">1. 収集する情報</h2>
                        <p className="mb-2">当サービスは、以下の情報を収集・取得する場合があります。</p>
                        <ul className="list-disc pl-5 space-y-2 bg-slate-50 p-4 rounded-lg">
                            <li><strong>アップロードされた資料データ</strong>:<br />ユーザーがシミュレーションのためにアップロードした物件概要書（PDF、画像等）に含まれる情報。</li>
                            <li><strong>アクセスログ・Cookie</strong>:<br />サービスの利用状況（IPアドレス、ブラウザの種類、アクセス日時等）を解析するための情報。</li>
                            <li><strong>お問い合わせ情報</strong>:<br />ユーザーからのお問い合わせ時に提供されるメールアドレス等の連絡先情報。</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="font-bold text-xl mb-3 text-slate-900 border-b pb-2">2. 利用目的</h2>
                        <p className="mb-2">取得した情報は、以下の目的で利用します。</p>
                        <ol className="list-decimal pl-5 space-y-2">
                            <li>本サービスの機能（不動産積算価格の試算等）を提供するため。</li>
                            <li>サービスの利用状況を分析し、機能改善や新機能開発に役立てるため。</li>
                            <li>不正アクセスやスパム行為などの不正利用を防止するため。</li>
                            <li>お問い合わせへの対応のため。</li>
                        </ol>
                    </section>

                    <section>
                        <h2 className="font-bold text-xl mb-3 text-slate-900 border-b pb-2">3. アップロードデータの取り扱い</h2>
                        <p>
                            ユーザーがアップロードした物件資料データは、シミュレーション結果を生成するためにサーバーまたはブラウザ上で一時的に処理されます。
                            運営者は、法令に基づく場合やデバッグ（不具合調査）等の正当な理由がない限り、ユーザーの同意なくアップロードされたファイルの中身を第三者に閲覧・提供することはありません。
                        </p>
                    </section>

                    <section>
                        <h2 className="font-bold text-xl mb-3 text-slate-900 border-b pb-2">4. Googleアナリティクスの利用について</h2>
                        <p>
                            当サービスでは、サービス向上のためにGoogle社の提供するアクセス解析ツール「Googleアナリティクス」を利用しています。
                            Googleアナリティクスは、Cookieを使用してトラフィックデータを収集しますが、これは匿名で収集されており、個人を特定するものではありません。
                            この機能はブラウザの設定でCookieを無効にすることで収集を拒否することができます。詳しくは<a href="https://marketingplatform.google.com/about/analytics/terms/jp/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Googleアナリティクス利用規約</a>をご確認ください。
                        </p>
                    </section>

                    <section>
                        <h2 className="font-bold text-xl mb-3 text-slate-900 border-b pb-2">5. 広告配信について</h2>
                        <p>
                            当サイトでは、第三者配信の広告サービス「Googleアドセンス」を利用する予定です。<br />
                            広告配信事業者は、ユーザーの興味に応じた広告を表示するためにCookie（クッキー）を使用することがあります。<br />
                            Cookieを無効にする設定およびGoogleアドセンスに関する詳細は<a href="https://policies.google.com/technologies/ads?hl=ja" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">「Googleポリシーと規約 – 広告」</a>をご覧ください。
                        </p>
                    </section>

                    <section>
                        <h2 className="font-bold text-xl mb-3 text-slate-900 border-b pb-2">6. 免責事項</h2>
                        <p>
                            当サービスからリンクやバナーなどによって他のサイトに移動された場合、移動先サイトで提供される情報、サービス等について一切の責任を負いません。
                        </p>
                    </section>

                    <section>
                        <h2 className="font-bold text-xl mb-3 text-slate-900 border-b pb-2">7. 本ポリシーの変更</h2>
                        <p>
                            当サービスは、必要と判断した場合には、ユーザーへの事前の通知なく本ポリシーを変更することができるものとします。変更後のプライバシーポリシーは、本ウェブサイトに掲載した時点から効力を生じるものとします。
                        </p>
                    </section>

                    <section>
                        <h2 className="font-bold text-xl mb-3 text-slate-900 border-b pb-2">8. お問い合わせ</h2>
                        <p>
                            本ポリシーに関するお問い合わせは、当サイトのお問い合わせフォームよりご連絡ください。
                        </p>
                    </section>
                </div>

                <div className="bg-slate-50 px-8 py-6 border-t border-slate-100 flex justify-center">
                    <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium hover:underline flex items-center gap-2">
                        <span>←</span> トップ・計算ページへ戻る
                    </Link>
                </div>
            </div>
        </div>
    );
}
