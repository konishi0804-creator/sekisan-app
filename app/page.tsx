"use client";

import { useRouter } from "next/navigation";
import { useFileContext } from "../context/FileContext";
import FileUploader from "../components/FileUploader";

// Tool Definition for future expansion
const CALCULATION_TOOLS = [
  {
    id: "estimate",
    title: "積算シミュレーション",
    description: "土地と建物の評価額を算出",
    path: "/calc",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
      </svg>
    ),
    bgColor: "bg-slate-700",
    hoverColor: "hover:bg-slate-800",
    disabled: false,
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
      <div className="max-w-2xl w-full text-center space-y-8 bg-white/90 p-8 rounded-2xl shadow-xl backdrop-blur-sm">
        <div className="space-y-2">
          <h1 className="text-6xl md:text-7xl font-serif font-extrabold tracking-tighter text-slate-900">
            EstiRE
          </h1>
          <p className="text-xl md:text-2xl font-light tracking-widest text-slate-500 uppercase">
            Estimate for Real Estate
          </p>
          <div className="h-1 w-20 bg-slate-900 mx-auto mt-6 mb-6"></div>
          <p className="text-base text-slate-600 leading-relaxed pt-2">
            物件資料をアップロードして、
            <br className="sm:hidden" />
            シミュレーションツールを選択してください。
          </p>
        </div>

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
                  className="px-3 py-1.5 text-sm font-bold text-emerald-600 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
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
                className={`w-full group relative flex items-center p-4 rounded-xl shadow-md transition-all duration-200 active:scale-[0.99] border border-transparent ${tool.bgColor} ${tool.hoverColor} text-white text-left`}
              >
                <div className="p-3 bg-white/10 rounded-lg mr-4 group-hover:bg-white/20 transition-colors">
                  {tool.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{tool.title}</h3>
                  <p className="text-white/80 text-sm">{tool.description}</p>
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

        {/* Terms */}
        <div className="bg-white/50 rounded-lg p-4 text-left text-xs text-slate-500 space-y-2 border border-slate-100">
          <p>※本ツールによる計算結果はあくまで概算であり、実際の評価額を保証するものではありません。</p>
          <p>※利用者は、自己の責任において、このサイトの情報を利用してください。</p>
        </div>
      </div>
    </main>
  );
}
