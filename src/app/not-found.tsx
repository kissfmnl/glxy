import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#e5eaf0] px-4 py-20">
      <div className="mx-auto max-w-2xl rounded-3xl border border-[#cfdeeb] bg-white p-8 text-center shadow-sm md:p-12">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#37bfbf]">404</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-[#1e375a] md:text-4xl">Pagina niet gevonden</h1>
        <p className="mt-3 text-sm font-semibold leading-relaxed text-gray-600">
          Deze pagina bestaat niet (meer) of de link is onjuist.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className="inline-flex rounded-full bg-[#1e375a] px-5 py-2.5 text-sm font-black text-white hover:bg-[#172d4a]">
            Naar home
          </Link>
          <Link href="/programmering" className="inline-flex rounded-full border border-[#1e375a]/20 bg-[#f2f8fb] px-5 py-2.5 text-sm font-black text-[#1e375a] hover:bg-[#eaf3f8]">
            Programmering
          </Link>
        </div>
      </div>
    </main>
  );
}
