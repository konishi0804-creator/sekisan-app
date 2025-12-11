export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">不動産積算アプリ</h1>

      <p className="text-lg mb-4 text-gray-700">
        土地・建物の概算積算価格をサクッと計算できます。
      </p>

      <a
        href="/calc"
        className="px-6 py-3 rounded-md bg-blue-600 text-white text-lg hover:bg-blue-700"
      >
        計算をはじめる
      </a>
    </main>
  );
}
