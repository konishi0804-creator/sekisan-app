import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-slate-800">
      <div className="max-w-2xl text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            不動産積算シミュレーション
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            プロ仕様の積算価格計算を、誰でも簡単に。<br />
            土地と建物の情報を入力するだけで、瞬時に概算価格を算出します。
          </p>
        </div>

        <div className="pt-4">
          <Link
            href="/calc"
            className="inline-block w-full sm:w-auto px-8 py-4 bg-blue-600 text-white font-bold text-lg rounded-xl shadow-lg hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all duration-200 ease-out"
          >
            積算シミュレーションをはじめる
          </Link>
        </div>

        <p className="text-sm text-slate-400 mt-8">
          ※本ツールによる計算結果はあくまで概算であり、実際の評価額を保証するものではありません。
        </p>
      </div>
    </main>
  );
}
