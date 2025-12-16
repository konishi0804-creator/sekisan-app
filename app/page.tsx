"use client";

import Link from "next/link";



export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-slate-800">
      <div className="max-w-2xl text-center space-y-8 bg-white/90 p-8 rounded-2xl shadow-xl backdrop-blur-sm">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            不動産積算シミュレーション
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            土地と建物の情報を入力するだけで、瞬時に概算価格を算出します。
          </p>
        </div>

        <div className="bg-white/80 rounded-lg p-6 text-left text-sm text-slate-600 space-y-4 shadow-inner border border-slate-100">
          <h3 className="font-bold border-b border-slate-300 pb-2">ご利用にあたって</h3>
          <ul className="list-disc list-inside space-y-2 text-xs leading-relaxed">
            <li>本ツールによる計算結果はあくまで概算であり、実際の評価額を保証するものではありません。</li>
            <li>利用者は、自己の責任において、このサイトの情報を利用してください。</li>
            <li>本シミュレーションは、利用者が、このシミュレーションの情報の利用に伴って発生したいかなる不利益についても何ら責任を負うものではありません。</li>
          </ul>
        </div>

        <div className="pt-2">
          <Link
            href="/calc"
            className="inline-block w-full sm:w-auto px-8 py-4 bg-blue-600 text-white font-bold text-lg rounded-xl shadow-lg hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all duration-200 ease-out"
          >
            同意してはじめる
          </Link>
        </div>
      </div>
    </main>
  );
}
