'use client'

import { CreateTripButton } from '@/components/trip/CreateTripForm'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function Sidebar() {
  return (
    <aside className="w-64 bg-card border-r flex flex-col shrink-0 h-screen sticky top-0">
      {/* Header */}
      <div className="px-6 py-6">
        <h1 className="text-xl font-bold">Travel Planner</h1>
      </div>

      <Separator />

      {/* New Trip Button */}
      <div className="px-4 py-4">
        <CreateTripButton />
      </div>

      <Separator />

      {/* Trip List */}
      <ScrollArea className="flex-1">
        <nav className="px-3 py-4">
          <p className="text-xs text-muted-foreground px-3 py-2">
            아직 여행이 없습니다
          </p>
        </nav>
      </ScrollArea>
    </aside>
  )
}
