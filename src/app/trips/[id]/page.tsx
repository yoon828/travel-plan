import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">여행 상세</h1>
        <p className="text-sm text-muted-foreground mt-1">Trip ID: {id}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>여행 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            여행 정보를 로드하는 중입니다...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
