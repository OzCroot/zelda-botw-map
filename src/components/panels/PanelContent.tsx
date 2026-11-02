import { Moon, Sun } from 'lucide-react'
import { useUi, type Tab } from '../../store/ui'
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
        <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
      <div role="tablist" className="grid grid-cols-4 gap-1 rounded-xl bg-border p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`min-h-10 rounded-lg text-sm transition ${tab === t.id ? 'bg-card font-medium shadow' : 'text-muted-foreground'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pb-6" role="tabpanel">
        {tab === 'filters' && <CategoryFilters />}
        {tab === 'list' && <MarkerList />}
        {tab === 'stats' && <StatsDashboard />}
        {tab === 'data' && <DataMenu />}
      </div>
    </div>
  )
}
