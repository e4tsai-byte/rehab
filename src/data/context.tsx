/* The only way UI code reaches data. Importing `fixtures` from a component is a
   bug: in October the provider is handed a LocalhostDataSource instead and
   nothing else changes. */

import { createContext, useContext, type ReactNode } from 'react'
import type { SessionDataSource } from './SessionDataSource'

const DataSourceContext = createContext<SessionDataSource | null>(null)

export function DataSourceProvider({
  source,
  children,
}: {
  source: SessionDataSource
  children: ReactNode
}) {
  return <DataSourceContext.Provider value={source}>{children}</DataSourceContext.Provider>
}

export function useDataSource(): SessionDataSource {
  const s = useContext(DataSourceContext)
  if (!s) throw new Error('useDataSource must be used inside DataSourceProvider')
  return s
}
