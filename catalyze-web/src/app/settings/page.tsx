import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { NotificationToggle } from './NotificationToggle'
import { SignOutButton } from './SignOutButton'

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const displayName = profile?.display_name ?? user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'User'
  const email = profile?.email ?? user.email ?? ''
  const notifyEmail = profile?.notify_email ?? true

  return (
    <div className="space-y-6 pb-8">
      <h1 className="text-xl font-bold text-gray-900 text-center">Settings</h1>

      {/* Profile card */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Profile</h2>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
            {user.user_metadata?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.user_metadata.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-brand-600">{displayName[0]?.toUpperCase()}</span>
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{displayName}</p>
            <p className="text-sm text-gray-500">{email}</p>
          </div>
        </div>
      </section>

      {/* Notifications card */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Notifications</h2>
        <NotificationToggle userId={user.id} initialValue={notifyEmail} />
      </section>

      {/* About card */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">About</h2>
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
      </section>

      {/* Sign out */}
      <SignOutButton />
    </div>
  )
}
