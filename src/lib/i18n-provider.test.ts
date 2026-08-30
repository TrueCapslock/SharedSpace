import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'

import { I18nProvider, useI18n } from './i18n'

function Harness() {
  const { locale, t } = useI18n()
  return createElement(
    'div',
    null,
    createElement('span', null, locale),
    createElement('span', null, t('home')),
    createElement('span', null, t('settings')),
  )
}

describe('I18nProvider', () => {
  it('renders with the default English locale and its translations', () => {
    const html = renderToString(
      createElement(I18nProvider, null, createElement(Harness)),
    )

    // locale is 'en', and t() resolves to the English catalog values.
    expect(html).toContain('>en<')
    expect(html).toContain('>Home<')
    expect(html).toContain('>Settings<')
  })

  it('forwards children through the provider', () => {
    const html = renderToString(
      createElement(I18nProvider, null, createElement(Harness)),
    )

    expect(html).toContain('>en<')
    expect(html).toContain('>Home<')
  })
})

describe('useI18n', () => {
  it('throws when used outside an I18nProvider', () => {
    expect(() => renderToString(createElement(Harness))).toThrow(
      'useI18n must be used within I18nProvider',
    )
  })
})
