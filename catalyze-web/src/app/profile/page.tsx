import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { ProfileEditor } from './ProfileEditor'
import { NotificationToggle } from '../settings/NotificationToggle'
import { SignOutButton } from '../settings/SignOutButton'
import Link from 'next/link'

export default async function ProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const displayName = profile?.display_name ?? user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'User'
  const contactEmail = profile?.email ?? user.email ?? ''
  const authEmail = user.email ?? ''
  const notifyEmail = profile?.notify_email ?? true

  return (
    <div className="space-y-6 pb-8">
      <h1 className="text-xl font-bold text-gray-900 text-center">Profile</h1>

      {/* Avatar + identity */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Account</h2>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {user.user_metadata?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.user_metadata.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-brand-600">{displayName[0]?.toUpperCase()}</span>
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{displayName}</p>
            <p className="text-sm text-gray-500">{authEmail}</p>
            {user.app_metadata?.provider === 'google' && (
              <p className="text-xs text-gray-400 mt-0.5">Signed in with Google</p>
            )}
          </div>
        </div>
        <ProfileEditor
          userId={user.id}
          initialDisplayName={displayName}
          initialContactEmail={contactEmail}
          authEmail={authEmail}
        />
      </section>

      {/* Notifications */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Notifications</h2>
        <NotificationToggle userId={user.id} initialValue={notifyEmail} />
      </section>

      {/* About card */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">App</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">App</span>
            <span className="text-gray-900 font-medium">Catalyze</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Purpose</span>
            <span className="text-gray-900 font-medium">Cat health monitoring</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Location</span>
            <span className="text-gray-900 font-medium">PSPCA Shelter</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3 text-xs text-gray-400">
          <Link href="/about" className="hover:text-gray-600 transition-colors">About</Link>
          <span>·</span>
          <Link href="/policy" className="hover:text-gray-600 transition-colors">Privacy</Link>
          <span>·</span>
          <Link href="/terms" className="hover:text-gray-600 transition-colors">Terms</Link>
        </div>
      </section>

      <SignOutButton />
    </div>
  )
}
