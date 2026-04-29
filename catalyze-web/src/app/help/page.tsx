export default function HelpPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-gray-900 text-center">Help</h1>

      {/* About */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-2">
        <h2 className="text-sm font-semibold text-gray-800">About Catalyze</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          Catalyze is an automated cat health monitoring system that uses a camera in the litterbox
          to detect and analyze stool samples. It tracks consistency and color to help you stay
          aware of your cat&apos;s digestive health.
        </p>
        <p className="text-sm text-gray-600 leading-relaxed">
          This app is <span className="font-medium">not a diagnostic tool</span>. If you notice
          anything concerning, please consult a veterinarian.
        </p>
      </section>

      {/* PSPCA Hotline */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-800">PSPCA Animal Hotline</h2>
        <p className="text-sm text-gray-600">
          For animal welfare concerns, emergencies, or to report cruelty:
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-brand-600">
                <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">(02) 8249-6552</p>
              <p className="text-xs text-gray-400">Landline</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-brand-600">
                <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">0919-654-1929</p>
              <p className="text-xs text-gray-400">Mobile</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-brand-600">
                <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">info@pspca.org</p>
              <p className="text-xs text-gray-400">Email</p>
            </div>
          </div>
        </div>
      </section>

      {/* Consistency guide */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-800">Consistency Guide</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-100 text-brand-800">Firm</span>
            <span className="text-gray-600">Well-formed, solid stool</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">Soft</span>
            <span className="text-gray-600">Soft but maintains some shape</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Watery</span>
            <span className="text-gray-600">Liquid or very loose</span>
          </div>
        </div>
      </section>
    </div>
  )
}
