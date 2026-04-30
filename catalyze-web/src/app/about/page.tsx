import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="space-y-6 pb-8">
      <h1 className="text-xl font-bold text-gray-900 text-center">About Catalyze</h1>

      {/* Hero */}
      <section className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center gap-3 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Catalyze" className="w-20 h-20 object-contain" />
        <div>
          <h2 className="text-lg font-bold text-gray-900">Catalyze</h2>
          <p className="text-sm text-gray-500 mt-1">AI-Powered Cat Health Monitoring</p>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">
          Catalyze automatically monitors cat health through smart litterbox detection —
          catching early signs of illness before they become serious, so shelter staff
          can act fast.
        </p>
      </section>

      {/* How it works */}
      <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-800">How It Works</h2>
        <div className="space-y-3">
          {[
            { step: '1', label: 'Cat uses the litterbox', detail: 'A Raspberry Pi camera inside the litterbox captures images during and after each visit.' },
            { step: '2', label: 'AI analyzes the sample', detail: 'A machine learning model classifies stool consistency (Firm, Soft, Watery) and detects color anomalies.' },
            { step: '3', label: 'Results sync to the cloud', detail: 'Detection data is uploaded to Supabase in real-time so it\'s always available.' },
            { step: '4', label: 'You get notified', detail: 'Staff receive email alerts for warning and critical detections, and can review trends in this dashboard.' },
          ].map(item => (
            <div key={item.step} className="flex gap-3 items-start">
              <span
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: '#E28331' }}
              >
                {item.step}
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Who it's for */}
      <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-800">Who It&apos;s For</h2>
        <ul className="text-sm text-gray-600 leading-relaxed space-y-2 list-disc list-inside">
          <li>PSPCA shelter staff who care for multiple cats at once</li>
          <li>Animal welfare teams who need early health indicators without constant manual checks</li>
          <li>Veterinary students and researchers studying feline health patterns</li>
        </ul>
      </section>

      {/* Project info */}
      <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-800">The Project</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          Catalyze is a Design Project 2 capstone submission at the{' '}
          <strong className="text-gray-800">Polytechnic University of the Philippines</strong>.
          It was built to address a real need at the PSPCA (Philippine Society for the Prevention
          of Cruelty to Animals) — where staff care for dozens of cats and early illness detection
          is critical.
        </p>
      </section>

      {/* Team */}
      <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-800">Project Team</h2>
        <div className="space-y-2">
          {[
            { name: 'Jan Francis Naval', role: 'Lead Developer & System Architect' },
          ].map(member => (
            <div key={member.name} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-800">{member.name}</span>
              <span className="text-xs text-gray-500">{member.role}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 pt-1">
          PUP · BS Computer Engineering · 4th Year · 2026
        </p>
      </section>

      {/* Links */}
      <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
        <Link href="/policy" className="hover:text-gray-600 transition-colors">Privacy Policy</Link>
        <span>·</span>
        <Link href="/terms" className="hover:text-gray-600 transition-colors">Terms of Service</Link>
      </div>
    </div>
  )
}
