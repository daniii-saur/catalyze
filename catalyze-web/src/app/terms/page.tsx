import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="space-y-6 pb-8">
      <div>
        <Link href="/signup" className="text-sm text-brand-600 font-medium hover:underline">← Back</Link>
        <h1 className="text-xl font-bold text-gray-900 mt-2">Terms of Service</h1>
        <p className="text-xs text-gray-400 mt-1">Effective date: April 29, 2026</p>
      </div>

      <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-800">1. Acceptance</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          By creating an account and using Catalyze, you agree to these Terms of Service.
          Catalyze is a student capstone project at the Polytechnic University of the Philippines
          and is provided for educational and shelter-care use only.
        </p>
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-800">2. Use of the Service</h2>
        <ul className="text-sm text-gray-600 leading-relaxed space-y-2 list-disc list-inside">
          <li>You must be an authorized caretaker or shelter staff for the monitored animals</li>
          <li>You agree not to misuse the app or attempt to access others&apos; data</li>
          <li>The service is provided as-is and may be interrupted or modified at any time</li>
          <li>Account sharing is not permitted; each staff member should have their own account</li>
        </ul>
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-800">3. No Veterinary Advice</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          Catalyze does not provide veterinary, medical, or diagnostic advice. All detection
          alerts and analysis results are informational only and are not a substitute for
          professional veterinary consultation. Do not make health decisions based solely on
          this application.
        </p>
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-800">4. Disclaimer of Warranties</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          This service is provided &quot;as is&quot; without warranties of any kind. The developers make
          no guarantees about the accuracy of detections, uptime, or fitness for any particular
          purpose. The system relies on hardware devices that may malfunction.
        </p>
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-800">5. Data and Privacy</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          Your use of Catalyze is also governed by our{' '}
          <Link href="/policy" className="text-brand-600 hover:underline">Privacy Policy</Link>,
          which is incorporated into these terms by reference.
        </p>
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-800">6. Changes to These Terms</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          We may update these terms at any time. Continued use of the application after changes
          are posted constitutes your acceptance of the updated terms.
        </p>
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-800">7. Contact</h2>
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
