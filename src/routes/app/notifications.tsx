import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useWorkspacesContext } from '#/features/app/workspace-context'
import {
  getNotifications,
  markAllReadFn,
  markNotificationReadFn,
} from '#/server/api/notifications'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import { Card, CardContent } from '#/components/ui/card'
import { useI18n } from '#/lib/i18n'

export const Route = createFileRoute('/app/notifications')({
  component: Notifications,
})

function Notifications() {
  const { activeWorkspaceId } = useWorkspacesContext()
  const { t } = useI18n()
  const queryClient = useQueryClient()

  const notifications = useQuery({
    queryKey: ['notifications', activeWorkspaceId],
    queryFn: () =>
      getNotifications({ data: { workspaceId: activeWorkspaceId } }),
    enabled: !!activeWorkspaceId,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] })
  }

  const markRead = useMutation({
    mutationFn: (notificationId: string) =>
      markNotificationReadFn({
        data: { notificationId, workspaceId: activeWorkspaceId! },
      }),
    onSuccess: invalidate,
  })

  const markAll = useMutation({
    mutationFn: () =>
      markAllReadFn({ data: { workspaceId: activeWorkspaceId } }),
    onSuccess: invalidate,
  })

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('notifications')}
          </h1>
          <p className="text-muted-foreground">{t('updatesFromWorkspaces')}</p>
        </div>
        <Button variant="outline" onClick={() => markAll.mutate()}>
          {t('markAllRead')}
        </Button>
      </header>

      <div className="flex flex-col gap-2">
        {notifications.isLoading && (
          <p className="text-muted-foreground">{t('loadingNotifications')}</p>
        )}
        {notifications.data?.length === 0 && (
          <p className="text-muted-foreground">{t('allCaughtUp')}</p>
        )}
        {notifications.data?.map((notification) => (
          <Card
            key={notification.id}
            className={notification.readAt ? 'py-0 opacity-70' : 'py-0'}
          >
            <CardContent className="flex items-center gap-3 py-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{notification.title}</span>
                  {notification.readAt == null && (
                    <Badge className="bg-primary/10 text-primary">
                      {t('newBadge')}
                    </Badge>
                  )}
                </div>
                {notification.body && (
                  <p className="text-sm text-muted-foreground">
                    {notification.body}
                  </p>
                )}
              </div>
              {notification.readAt == null && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markRead.mutate(notification.id)}
                >
                  {t('markRead')}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
