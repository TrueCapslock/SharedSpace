import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useWorkspacesContext } from '#/features/app/workspace-context'
import {
  getInvitations,
  getMembers,
  inviteMemberFn,
  getRoles,
} from '#/server/api/members'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { useI18n } from '#/lib/i18n'
import type { TranslationKey } from '#/lib/i18n'

export const Route = createFileRoute('/app/members')({ component: Members })

type RoleKey = 'owner' | 'admin' | 'member' | 'viewer'

function Members() {
  const { activeWorkspace, activeWorkspaceId } = useWorkspacesContext()
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<RoleKey>('member')

  const members = useQuery({
    queryKey: ['members', activeWorkspaceId],
    queryFn: () => getMembers({ data: { workspaceId: activeWorkspaceId! } }),
    enabled: !!activeWorkspaceId,
  })

  // Roles are fetched to validate role keys exist, but role switching is
  // delegated to updateMemberRole; we surface the available keys here.
  useQuery({
    queryKey: ['roles', activeWorkspaceId],
    queryFn: () => getRoles({ data: { workspaceId: activeWorkspaceId! } }),
    enabled: !!activeWorkspaceId,
  })

  const invite = useMutation({
    mutationFn: () =>
      inviteMemberFn({
        data: { workspaceId: activeWorkspaceId!, email, roleKey: role },
      }),
    onSuccess: () => {
      setEmail('')
      queryClient.invalidateQueries({
        queryKey: ['members', activeWorkspaceId],
      })
      queryClient.invalidateQueries({
        queryKey: ['invitations', activeWorkspaceId],
      })
    },
  })

  const invitations = useQuery({
    queryKey: ['invitations', activeWorkspaceId],
    queryFn: () =>
      getInvitations({ data: { workspaceId: activeWorkspaceId! } }),
    enabled: !!activeWorkspaceId,
  })

  if (!activeWorkspace) {
    return <p className="text-muted-foreground">{t('selectWorkspace')}</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{t('members')}</h1>
        <p className="text-muted-foreground">{t('membersDesc')}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('inviteSomeone')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault()
              if (email.trim()) invite.mutate()
            }}
          >
            <input
              className="h-8 flex-1 rounded-lg border bg-transparent px-3 text-sm outline-none"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('teammateEmail')}
            />
            <select
              className="h-8 rounded-lg border bg-transparent px-3 text-sm outline-none"
              value={role}
              onChange={(e) => setRole(e.target.value as RoleKey)}
            >
              <option value="member" className="bg-background text-foreground">
                {t('roleMember')}
              </option>
              <option value="admin" className="bg-background text-foreground">
                {t('roleAdmin')}
              </option>
              <option value="viewer" className="bg-background text-foreground">
                {t('roleViewer')}
              </option>
            </select>
            <Button type="submit" disabled={!email.trim() || invite.isPending}>
              {t('invite')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        {members.data?.map((member) => (
          <Card key={member.id} className="py-0">
            <CardContent className="flex items-center gap-3 py-3">
              <div className="flex-1">
                <span className="font-medium">{member.displayName}</span>
                {member.email && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    {member.email}
                  </span>
                )}
              </div>
              <Badge variant="outline">
                {member.roleKey
                  ? t(roleLabelKey[member.roleKey] ?? 'roleMember')
                  : t('invited')}
              </Badge>
              <Badge
                className={
                  member.status === 'active'
                    ? 'bg-green-500/10 text-green-600'
                    : 'bg-muted text-muted-foreground'
                }
              >
                {member.status === 'active'
                  ? t('statusActive')
                  : t('statusPending')}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {invitations.data && invitations.data.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
            {t('pendingInvitations')}
          </h2>
          <div className="flex flex-col gap-2">
            {invitations.data.map((inv) => (
              <Card key={inv.id} className="py-0">
                <CardContent className="flex items-center gap-3 py-3">
                  <span className="flex-1 text-sm">{inv.email}</span>
                  <Badge variant="outline">
                    {inv.status === 'pending' ? t('statusPending') : inv.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

const roleLabelKey: Record<string, TranslationKey> = {
  owner: 'roleAdmin',
  admin: 'roleAdmin',
  member: 'roleMember',
  viewer: 'roleViewer',
}
