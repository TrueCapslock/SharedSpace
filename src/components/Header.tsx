import { Link } from '@tanstack/react-router'

import ThemeToggle from './ThemeToggle'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <nav className="mx-auto flex h-16 w-full max-w-screen-xl items-center gap-4 px-4 sm:px-6">
        <Link
          to="/"
          className="text-sm font-semibold tracking-tight text-foreground"
        >
          <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-primary align-middle" />
          SharedSpace
        </Link>

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
