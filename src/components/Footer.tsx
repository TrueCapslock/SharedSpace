export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t py-6">
      <div className="mx-auto flex w-full max-w-screen-xl flex-col items-center justify-between gap-2 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <p>&copy; {year} SharedSpace</p>
        <p>Organize what you share.</p>
      </div>
    </footer>
  )
}
