import { Moon, Sun } from 'lucide-react'
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
  const { tab, setTab, theme, toggleTheme } = useUi()
  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="h-full min-h-0 gap-4">
      <div className="flex items-center gap-2">
        <TabsList className="min-w-0 flex-1">
          {TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
          className="grid size-9 shrink-0 place-items-center rounded-lg border border-border/70 bg-card/40 text-muted-foreground outline-none transition-colors hover:bg-card/70 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>
      </div>
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
