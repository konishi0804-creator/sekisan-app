"use client";

import { useRouter } from "next/navigation";
import { useFileContext } from "../context/FileContext";
import FileUploader from "../components/FileUploader";
import AdUnit from "../components/AdUnit";
import { NEWS_ITEMS } from "../data/news";

// Tool Definition for future expansion
const CALCULATION_TOOLS = [
  {
    id: "estimate",
    title: "積算価格計算シミュレーション",
    description: "土地：路線価、建物：再調達価格などから積算価格をシミュレート",
    path: "/calc",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
      </svg>
    ),
    bgColor: "bg-slate-700",
    hoverColor: "hover:bg-slate-800",
    disabled: false,
    note: "※アップロード資料：物件概要書等",
  },
  {
    id: "apportionment",
    title: "土地建物評価額按分シミュレーション",
    description: "売買代金の土地、建物、消費税の内訳を評価額比率で按分します。",
    path: "/tools/apportionment",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
      </svg>
    ),
    bgColor: "bg-rose-800",
    hoverColor: "hover:bg-rose-900",
    disabled: false,
    note: "※アップロード資料：課税明細や評価証明等",
  },
  // Future tools can be added here
];

export default function Home() {
  const router = useRouter();
  const { files, setFiles } = useFileContext();

  const handleFileSelect = (uploadedFiles: File[]) => {
    setFiles(uploadedFiles);
    // No redirect - let user choose tool
  };

  const handleClearFile = () => {
    setFiles([]);
  };

  const handleToolClick = (path: string) => {
    router.push(path);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-slate-800">
      <div className="max-w-2xl w-full text-center space-y-8 bg-white/90 rounded-2xl shadow-xl backdrop-blur-sm overflow-hidden">
        {/* Premium Header Section */}
        <div className="bg-slate-900 py-10 px-8 relative overflow-hidden">
          {/* Glossy Overlay Effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none"></div>

          <div className="relative z-10 flex flex-col items-center justify-center space-y-4">

            <div className="flex items-center justify-center gap-6">
              <h1 className="text-5xl md:text-6xl font-serif font-extrabold tracking-tighter">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#bf953f] via-[#fcf6ba] to-[#bf953f] drop-shadow-sm">
                  EstiRE
                </span>
              </h1>

              {/* Logo Icon - Adjusted position and size */}
              <div className="w-12 h-12 rounded-xl bg-slate-800/80 p-2 shadow-xl border border-slate-700 backdrop-blur-sm shadow-amber-900/20 scroll-px-0.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain opacity-90" />
              </div>
            </div>

            <p className="text-lg md:text-xl font-light tracking-[0.2em] uppercase text-[#d4af37]">
              Estimate for Real Estate
            </p>
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-[#bf953f] to-transparent mx-auto mt-4 opacity-70"></div>
          </div>
        </div>

        <div className="px-8 pb-8 space-y-6">
          <p className="text-base text-slate-600 leading-relaxed">
            物件資料をアップロードして、
            <br className="sm:hidden" />
            シミュレーションツールを選択してください。
          </p>



          {/* Upload Section */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {files.length > 0 ? (
              <div className="p-6 bg-emerald-50 border-2 border-emerald-100 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-emerald-800">資料の読み込み完了</p>
                      <p className="text-sm text-emerald-600">{files[0].name} 他 {files.length > 1 ? `${files.length - 1}ファイル` : ""}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleClearFile}
                    className="cursor-pointer px-3 py-1.5 text-sm font-bold text-emerald-600 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                  >
                    変更
                  </button>
                </div>
              </div>
            ) : (
              <FileUploader onFileSelect={handleFileSelect} />
            )}
          </div>

          {/* Tools Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-4">
              <div className="h-px bg-slate-200 w-full max-w-[100px]"></div>
              <span className="text-slate-400 text-sm font-bold tracking-wider">AVAILABLE TOOLS</span>
              <div className="h-px bg-slate-200 w-full max-w-[100px]"></div>
            </div>

            <div className="grid gap-4">
              {CALCULATION_TOOLS.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => handleToolClick(tool.path)}
                  disabled={tool.disabled}
                  className={`cursor-pointer w-full group relative flex items-center p-4 rounded-xl shadow-md transition-all duration-200 active:scale-[0.99] border border-transparent ${tool.bgColor} ${tool.hoverColor} text-white text-left`}
                >
                  <div className="p-3 bg-white/10 rounded-lg mr-4 group-hover:bg-white/20 transition-colors">
                    {tool.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{tool.title}</h3>
                    <p className="text-white/80 text-sm">{tool.description}</p>
                    {/* @ts-ignore - note property exists dynamically */}
                    {tool.note && (
                      <p className="text-pink-200 text-xs mt-1 font-bold">{tool.note}</p>
                    )}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* AdSense Unit */}
          <AdUnit slot="0000000000" client="ca-pub-XXXXXXXXXXXXXXXX" />

          {/* News Section (Bottom) */}
          <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-left">
            <div className="flex items-center gap-2 mb-3 text-slate-700 font-bold text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-blue-500">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
              <span>お知らせ</span>
            </div>
            <div className="space-y-2 h-32 overflow-y-auto pr-2 custom-scrollbar">
              {NEWS_ITEMS.map((item, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 text-sm">
                  <span className="text-slate-500 font-mono text-xs whitespace-nowrap">{item.date}</span>
                  <span className="text-slate-700">{item.content}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Terms */}
          <div className="bg-white/50 rounded-lg p-4 text-left text-xs text-slate-500 space-y-2 border border-slate-100">
            <p>※本ツールによる計算結果はあくまで概算であり、実際の評価額を保証するものではありません。</p>
            <p>※利用者は、自己の責任において、このサイトの情報を利用してください。</p>
          </div>
        </div>
      </div>
    </main >
  );
}
