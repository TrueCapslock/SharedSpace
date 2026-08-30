import { describe, expect, it } from 'vitest'

import {
  dashboardWidgets,
  getCustomWorkspaceTemplate,
  getModulePool,
  getWorkspaceSettings,
  getWorkspaceTemplate,
  workspaceModuleKeys,
  workspaceThemes,
} from './templates'

type WorkspaceType = Parameters<typeof getWorkspaceTemplate>[0]

const workspaceTypes: WorkspaceType[] = [
  'housing_board',
  'cabin',
  'boat',
  'project',
  'agile_project',
  'association',
  'custom',
]

describe('workspace templates', () => {
  it('limits non-custom workspaces to their template module pool', () => {
    const settings = getWorkspaceSettings('boat', {
      modules: ['tasks', 'logbook', 'board', 'unknown'],
      moduleOrder: ['board', 'logbook', 'unknown'],
    })

    expect(settings.modules).toEqual(['tasks', 'logbook'])
    expect(settings.modulePool).toEqual([
      'tasks',
      'documents',
      'members',
      'bookings',
      'maintenance',
      'logbook',
      'inventory',
      'berths',
      'expenses',
    ])
    expect(settings.moduleOrder).toEqual(['board', 'logbook'])
  })

  it('uses template defaults when module settings are empty or invalid', () => {
    const settings = getWorkspaceSettings('cabin', {
      modules: ['not-a-module'],
    })

    expect(settings.modules).toEqual(getModulePool('cabin'))
    expect(settings.dashboardWidgets).toEqual([
      'tasks',
      'bookings',
      'documents',
      'calendar',
      'activity',
    ])
  })

  it('allows custom workspaces to select from every known module', () => {
    const settings = getWorkspaceSettings('custom', {
      modules: ['board', 'logbook', 'not-a-module'],
      moduleOrder: ['logbook', 'board'],
    })

    expect(settings.modulePool).toEqual([...workspaceModuleKeys])
    expect(settings.modules).toEqual(['board', 'logbook'])
    expect(settings.moduleOrder).toEqual(['logbook', 'board'])
  })

  it('uses supplied non-empty custom template choices and falls back for empty choices', () => {
    expect(
      getCustomWorkspaceTemplate({
        theme: 'harbor',
        modules: ['logbook'],
        dashboardWidgets: ['activity'],
      }),
    ).toMatchObject({
      template: 'custom',
      theme: 'harbor',
      modules: ['logbook'],
      dashboardWidgets: ['activity'],
    })

    expect(
      getCustomWorkspaceTemplate({ modules: [], dashboardWidgets: [] }),
    ).toMatchObject({
      modules: ['tasks', 'documents', 'members'],
      dashboardWidgets: [
        'tasks',
        'schedule',
        'documents',
        'calendar',
        'activity',
      ],
    })
  })
})

describe('all workspace templates', () => {
  it('uses only valid modules, widgets and themes', () => {
    for (const type of workspaceTypes) {
      const template = getWorkspaceTemplate(type)

      expect(
        template.modules.every((module) =>
          workspaceModuleKeys.includes(module),
        ),
      ).toBe(true)
      expect(
        template.dashboardWidgets.every((widget) =>
          dashboardWidgets.includes(widget),
        ),
      ).toBe(true)
      expect(workspaceThemes).toContain(template.theme)
    }
  })

  it('keeps every template module set inside its module pool', () => {
    for (const type of workspaceTypes) {
      const template = getWorkspaceTemplate(type)
      const pool = getModulePool(type)

      expect(pool).toEqual(expect.arrayContaining(template.modules))
    }
  })

  it('normalizes invalid settings back to template defaults', () => {
    const settings = getWorkspaceSettings('boat', {
      theme: 'neon',
      modules: ['hacking', 'logbook'],
      moduleOrder: ['hacking'],
      dashboardWidgets: ['hacking'],
    })

    expect(settings.theme).toBe('harbor')
    expect(settings.modules).toEqual(['logbook'])
    expect(settings.moduleOrder).toEqual(['logbook'])
    expect(settings.dashboardWidgets).toEqual([])
  })
})
