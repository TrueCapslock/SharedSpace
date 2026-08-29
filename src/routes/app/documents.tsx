import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useWorkspacesContext } from '#/features/app/workspace-context'
import {
  createDocumentFn,
  deleteDocumentFn,
  getDocuments,
} from '#/server/api/documents'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { useI18n } from '#/lib/i18n'

export const Route = createFileRoute('/app/documents')({
  component: Documents,
})

function Documents() {
  const { activeWorkspace, activeWorkspaceId } = useWorkspacesContext()
  const { t } = useI18n()
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [storageKey, setStorageKey] = useState('')

  const documents = useQuery({
    queryKey: ['documents', activeWorkspaceId],
    queryFn: () =>
      getDocuments({
        data: { workspaceId: activeWorkspaceId! },
      }),
    enabled: !!activeWorkspaceId,
  })

  const create = useMutation({
    mutationFn: () =>
      createDocumentFn({
        data: { workspaceId: activeWorkspaceId!, name, storageKey },
      }),
    onSuccess: () => {
      setName('')
      setStorageKey('')
      queryClient.invalidateQueries({
        queryKey: ['documents', activeWorkspaceId],
      })
    },
  })

  const remove = useMutation({
    mutationFn: (documentId: string) =>
      deleteDocumentFn({
        data: { workspaceId: activeWorkspaceId!, documentId },
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['documents', activeWorkspaceId],
      }),
  })

  if (!activeWorkspace) {
    return <p className="text-muted-foreground">{t('selectWorkspace')}</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{t('documents')}</h1>
        <p className="text-muted-foreground">{t('filesResources')}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('registerDocument')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault()
              if (name.trim() && storageKey.trim()) create.mutate()
            }}
          >
            <input
              className="h-8 flex-1 rounded-lg border bg-transparent px-3 text-sm outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('documentName')}
            />
            <input
              className="h-8 flex-1 rounded-lg border bg-transparent px-3 text-sm outline-none"
              value={storageKey}
              onChange={(e) => setStorageKey(e.target.value)}
              placeholder={t('storageKey')}
            />
            <Button
              type="submit"
              disabled={!name.trim() || !storageKey.trim() || create.isPending}
            >
              {t('add')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        {documents.isLoading && (
          <p className="text-muted-foreground">{t('loadingDocuments')}</p>
        )}
        {documents.data?.length === 0 && (
          <p className="text-muted-foreground">{t('noDocuments')}</p>
        )}
        {documents.data?.map((doc) => (
          <Card key={doc.id} className="py-0">
            <CardContent className="flex items-center gap-3 py-3">
              <span className="flex-1">{doc.name}</span>
              {doc.mimeType && <Badge variant="outline">{doc.mimeType}</Badge>}
              {doc.sizeBytes != null && (
                <span className="text-xs text-muted-foreground">
                  {(doc.sizeBytes / 1024).toFixed(1)} KB
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => remove.mutate(doc.id)}
              >
                {t('delete')}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
