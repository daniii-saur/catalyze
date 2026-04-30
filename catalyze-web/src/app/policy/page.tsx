import Link from 'next/link'

export default function PolicyPage() {
  return (
    <div className="space-y-6 pb-8">
      <div>
        <Link href="/signup" className="text-sm text-brand-600 font-medium hover:underline">← Back</Link>
        <h1 className="text-xl font-bold text-gray-900 mt-2">Privacy Policy</h1>
        <p className="text-xs text-gray-400 mt-1">Effective date: April 29, 2026</p>
      </div>

      <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-800">About Catalyze</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          Catalyze is a cat health monitoring application developed as a student capstone project
          at the Polytechnic University of the Philippines. It uses a camera-equipped litterbox
          device to automatically detect and analyze stool samples for health monitoring purposes
          in shelter environments.
        </p>
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-800">Information We Collect</h2>
        <ul className="text-sm text-gray-600 leading-relaxed space-y-2 list-disc list-inside">
          <li>Your email address and display name when you create an account</li>
          <li>Google profile information (name, avatar) when signing in with Google</li>
          <li>Detection data captured by your litterbox device (images, color analysis, timestamps)</li>
          <li>Your notification and contact email preferences</li>
        </ul>
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-800">How We Use Your Information</h2>
        <ul className="text-sm text-gray-600 leading-relaxed space-y-2 list-disc list-inside">
          <li>To authenticate you and secure your account</li>
          <li>To display your cat&apos;s detection history and health trends</li>
          <li>To send email alerts when an anomalous detection occurs (if enabled)</li>
          <li>To send a one-time welcome email upon account creation</li>
        </ul>
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-800">Data Storage</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          Your data is stored securely using Supabase, a managed cloud database platform.
          Detection images are stored in Supabase Storage. We do not sell or share your data
          with third parties. Email notifications are delivered via Resend.
        </p>
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-800">Not a Medical or Diagnostic Tool</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          Catalyze is not a veterinary diagnostic tool. All alerts and analysis are informational
          only. Always consult a licensed veterinarian for health concerns about your pet.
        </p>
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-800">Your Rights</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          You may request deletion of your account and associated data at any time by contacting
          us. You may also update your contact email and notification preferences from your
          profile page.
        </p>
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-800">Contact</h2>
        <p className="text-sm text-gray-600">
          For privacy-related questions, contact us at{' '}
          <a href="mailto:francisnaval13@gmail.com" className="text-brand-600 hover:underline">
            francisnaval13@gmail.com
          </a>
        </p>
      </section>
    </div>
  )
}
