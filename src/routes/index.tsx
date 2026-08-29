import { Link, createFileRoute } from '@tanstack/react-router'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import Header from '#/components/Header'
import Footer from '#/components/Footer'

export const Route = createFileRoute('/')({ component: Home })

const modules = [
  'Tasks',
  'Documents',
  'Meetings',
  'Decisions',
  'Expenses',
  'Booking',
  'Notifications',
]

function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-screen-xl flex-1 flex-col items-center justify-center gap-8 px-4 py-16 text-center sm:px-6">
        <div className="flex flex-col items-center gap-4">
          <Badge variant="secondary">Workspace platform</Badge>
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            Organize what you share.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            SharedSpace gives groups a modern home for the resources,
            responsibilities, decisions, and work they share — from housing
            boards to cabins, boats, and projects.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/app">
              <Button size="lg">Open your workspaces</Button>
            </Link>
            <Button size="lg" variant="outline">
              Learn more
            </Button>
          </div>
        </div>

        <section className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <Card key={module}>
              <CardHeader>
                <CardTitle className="text-base">{module}</CardTitle>
                <CardDescription>
                  Manage {module.toLowerCase()} across your workspace.
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  )
}
