import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useUi, type Tab } from '@/store/ui'
import { CategoryFilters } from '../filters/CategoryFilters'
import { MarkerList } from '../list/MarkerList'
import { StatsDashboard } from '../progress/StatsDashboard'
import { DataMenu } from '../settings/DataMenu'
import { SearchBox } from './SearchBox'

const TABS: { id: Tab; label: string }[] = [
  { id: 'filters', label: 'Filters' },
  { id: 'list', label: 'List' },
  { id: 'stats', label: 'Progress' },
  { id: 'data', label: 'Data' },
]

export function PanelContent() {
  const { tab, setTab, theme, toggleTheme } = useUi()
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <SearchBox />
        </div>
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun /> : <Moon />}
        </Button>
      </div>
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="min-h-0 flex-1 gap-3">
        <TabsList className="w-full">
          {TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="filters" className="min-h-0 flex-1 overflow-y-auto pb-6">
          <CategoryFilters />
        </TabsContent>
        <TabsContent value="list" className="min-h-0 flex-1 pb-2">
          <MarkerList />
        </TabsContent>
        <TabsContent value="stats" className="min-h-0 flex-1 overflow-y-auto pb-6">
          <StatsDashboard />
        </TabsContent>
        <TabsContent value="data" className="min-h-0 flex-1 overflow-y-auto pb-6">
          <DataMenu />
        </TabsContent>
      </Tabs>
    </div>
  )
}
