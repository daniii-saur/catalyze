export default function TermsPage() {
  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Terms of Service</h1>
        <p className="text-xs text-gray-400 mt-1">Effective date: April 29, 2026</p>
      </div>

      <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-800">1. Acceptance</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          By creating an account and using Catalyze, you agree to these terms.
          Catalyze is a student capstone project at the Polytechnic University of the Philippines
          and is provided for educational and personal use only.
        </p>
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-800">2. Use of the Service</h2>
        <ul className="text-sm text-gray-600 leading-relaxed space-y-2 list-disc list-inside">
          <li>You must be the owner or authorized caretaker of the monitored animal</li>
          <li>You agree not to misuse the app or attempt to access others&apos; data</li>
          <li>The service is provided as-is and may be interrupted or changed at any time</li>
        </ul>
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-800">3. No Veterinary Advice</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          Catalyze does not provide veterinary, medical, or diagnostic advice. All detection alerts
          are informational and are not a substitute for professional veterinary consultation.
          Do not make health decisions based solely on this app.
        </p>
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-800">4. Disclaimer of Warranties</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          This service is provided &quot;as is&quot; without warranties of any kind. The developers make
          no guarantees about accuracy, uptime, or fitness for any particular purpose.
        </p>
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-800">5. Changes</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          We may update these terms at any time. Continued use of the app after changes
          constitutes acceptance of the updated terms.
        </p>
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-800">6. Contact</h2>
        <p className="text-sm text-gray-600">
          Questions about these terms?{' '}
          <a href="mailto:francisnaval13@gmail.com" className="text-brand-600 hover:underline">
            francisnaval13@gmail.com
          </a>
        </p>
      </section>
    </div>
  )
}
