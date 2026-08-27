import { QueryClient } from '@tanstack/react-query'

let queryClient: QueryClient | undefined

export function getContext() {
  queryClient ??= new QueryClient()

  return {
    queryClient,
  }
}
