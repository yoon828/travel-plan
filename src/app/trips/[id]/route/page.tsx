import { notFound } from 'next/navigation'
import { getTrip } from '@/app/actions'
import { RouteView } from '@/components/map/RouteView'

export default async function RoutePage({
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
    <div className="h-screen flex flex-col">
      <RouteView trip={trip} />
    </div>
  )
}
