import { describe, expect, it } from 'vitest'

import {
  getCustomWorkspaceTemplate,
  getModulePool,
  getWorkspaceSettings,
  workspaceModuleKeys,
} from './templates'

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
