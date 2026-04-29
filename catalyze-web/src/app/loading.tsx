export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-brand-500">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="Catalyze" className="w-24 h-24 mb-4 drop-shadow-lg" />
      <h1 className="text-2xl font-bold text-white tracking-tight">Catalyze</h1>
      <p className="text-brand-100 text-sm mt-1">Cat Health Monitor</p>
      <div className="mt-8 w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
    </div>
  )
}
