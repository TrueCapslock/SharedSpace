import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import { getThemeInitScript } from '../hooks/use-theme'
import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import { ClerkProvider } from '@clerk/tanstack-react-start'
import { env } from '../env'
import { I18nProvider } from '../lib/i18n'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'SharedSpace',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: getThemeInitScript() }} />
        <HeadContent />
      </head>
      <body>
        {env.VITE_CLERK_PUBLISHABLE_KEY ? (
          <ClerkProvider publishableKey={env.VITE_CLERK_PUBLISHABLE_KEY}>
            <I18nProvider>{children}</I18nProvider>
          </ClerkProvider>
        ) : (
          <I18nProvider>{children}</I18nProvider>
        )}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
