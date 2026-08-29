import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Monitor, Moon, Sun } from 'lucide-react'

import { getMe } from '#/server/api/workspaces'
import { updateProfileFn } from '#/server/api/users'
import { useTheme } from '#/hooks/use-theme'
import type { Theme } from '#/hooks/use-theme'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { useI18n } from '#/lib/i18n'
import type { TranslationKey } from '#/lib/i18n'

export const Route = createFileRoute('/app/profile')({
  component: Profile,
})

const themeOptions: {
  value: Theme
  label: TranslationKey
  icon: typeof Sun
}[] = [
  { value: 'light', label: 'themeLight', icon: Sun },
  { value: 'dark', label: 'themeDark', icon: Moon },
  { value: 'system', label: 'themeSystem', icon: Monitor },
]

function Profile() {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const { theme, setTheme } = useTheme()

  const me = useQuery({ queryKey: ['me'], queryFn: () => getMe() })
  const user = me.data ?? null

  const [name, setName] = useState('')

  useEffect(() => {
    if (user) {
      setName(user.displayName)
      const savedTheme = (user.preferences as { theme?: Theme } | null)?.theme
      if (savedTheme && savedTheme !== theme) {
        setTheme(savedTheme)
      }
    }
  }, [user, theme, setTheme])

  const saveName = useMutation({
    mutationFn: () => updateProfileFn({ data: { displayName: name } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['me'] })
    },
  })

  const saveTheme = useMutation({
    mutationFn: (next: Theme) => updateProfileFn({ data: { theme: next } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['me'] })
    },
  })

  const selectTheme = (next: Theme) => {
    setTheme(next)
    saveTheme.mutate(next)
  }

  const dirty = !!user && name.trim() !== user.displayName

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{t('profile')}</h1>
        <p className="text-muted-foreground">{t('manageProfile')}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('displayName')}</CardTitle>
          <CardDescription>{t('displayNameHint')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (dirty) saveName.mutate()
            }}
          >
            <input
              className="h-9 w-full rounded-lg border bg-transparent px-3 text-sm outline-none focus-visible:border-ring"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('yourName')}
              maxLength={255}
            />
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={!dirty || saveName.isPending}>
                {saveName.isPending ? t('saving') : t('saveName')}
              </Button>
              {saveName.isSuccess && (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Check className="size-4 text-primary" /> {t('saved')}
                </span>
              )}
              {saveName.isError && (
                <span className="text-sm text-destructive">
                  {t('couldNotSaveName')}
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('appearance')}</CardTitle>
          <CardDescription>{t('appearanceHint')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 sm:max-w-sm">
            {themeOptions.map((option) => {
              const active = theme === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => selectTheme(option.value)}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition ${active ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/50'}`}
                >
                  <option.icon className="size-5" />
                  {t(option.label)}
                  {active && <Check className="size-3.5" />}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
