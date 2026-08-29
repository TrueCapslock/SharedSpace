import { createContext, useContext } from 'react'
import type { JsonValue } from '#/lib/json'

export type WorkspaceOption = {
  id: string
  name: string
  slug: string
  workspaceType: string
  settings: JsonValue | null
}

type WorkspaceContextValue = {
  workspaces: WorkspaceOption[] | undefined
  activeWorkspaceId: string | undefined
  activeWorkspace: WorkspaceOption | undefined
  isLoading: boolean
}

export const WorkspaceContext = createContext<WorkspaceContextValue>({
  workspaces: undefined,
  activeWorkspaceId: undefined,
  activeWorkspace: undefined,
  isLoading: true,
})

export function useWorkspacesContext() {
  return useContext(WorkspaceContext)
}
