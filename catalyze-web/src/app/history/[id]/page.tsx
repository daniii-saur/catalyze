import { redirect } from 'next/navigation'

export default function HistoryDetailRedirect({ params }: { params: { id: string } }) {
  redirect(`/activity/${params.id}`)
}
