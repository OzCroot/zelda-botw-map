import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useUi, type Tab } from '@/store/ui'
import { CategoryFilters } from '../filters/CategoryFilters'
import { MarkerList } from '../list/MarkerList'
import { StatsDashboard } from '../progress/StatsDashboard'
import { DataMenu } from '../settings/DataMenu'

const TABS: { id: Tab; label: string }[] = [
  { id: 'filters', label: 'Filters' },
  { id: 'list', label: 'List' },
  { id: 'stats', label: 'Progress' },
  { id: 'data', label: 'Data' },
]

export function PanelContent() {
  const { tab, setTab } = useUi()
  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="h-full min-h-0 gap-3">
      <TabsList className="w-full">
        {TABS.map((t) => (
          <TabsTrigger key={t.id} value={t.id}>
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="filters" className="min-h-0 flex-1">
        <ScrollArea className="h-full">
          <div className="pr-3 pb-6">
            <CategoryFilters />
          </div>
        </ScrollArea>
      </TabsContent>
      <TabsContent value="list" className="min-h-0 flex-1 pb-2">
        <MarkerList />
      </TabsContent>
      <TabsContent value="stats" className="min-h-0 flex-1">
        <ScrollArea className="h-full">
          <div className="pr-3 pb-6">
            <StatsDashboard />
          </div>
        </ScrollArea>
      </TabsContent>
      <TabsContent value="data" className="min-h-0 flex-1">
        <ScrollArea className="h-full">
          <div className="pr-3 pb-6">
            <DataMenu />
          </div>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  )
}
