import { notFound } from 'next/navigation'
import { getTrip } from '@/app/actions/trips'
import { TripDetail } from '@/components/trip/TripDetail'

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { trip, error } = await getTrip(id)

  if (error || !trip) {
    notFound()
  }

  return (
    <div className="p-8">
      <TripDetail trip={trip} />
    </div>
  )
}
