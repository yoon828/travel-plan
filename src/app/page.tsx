import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Home() {
  return (
    <div className="w-full h-full flex items-center justify-center p-6 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-3xl">Welcome to Travel Planner</CardTitle>
          <CardDescription>
            Start planning your next adventure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Create a new trip to get started with organizing your travel plans.
          </p>
          <p className="text-xs text-muted-foreground border-l-2 border-primary pl-3">
            Click the "+ New Trip" button in the sidebar to begin planning your next journey.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
