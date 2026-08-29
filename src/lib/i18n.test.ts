import { describe, expect, it } from 'vitest'

import { translations } from './i18n'

describe('translations', () => {
  it('keeps English and Norwegian catalogs in sync', () => {
    expect(Object.keys(translations.no).sort()).toEqual(
      Object.keys(translations.en).sort(),
    )

    for (const translation of Object.values(translations.no)) {
      expect(translation.trim()).not.toBe('')
    }
  })

  it('uses Norwegian special characters in key labels', () => {
    expect(translations.no).toMatchObject({
      language: 'Språk',
      meters: 'Målere',
      access: 'Nøkler og tilgang',
      yourVessel: 'Din båt',
      workspaceSettings: 'Innstillinger for arbeidsområdet',
      themeDark: 'Mørk',
    })
  })
})
