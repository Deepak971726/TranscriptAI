import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { AppLogo } from "@/components/common/app-logo"
import { PageTransition } from "@/components/common/page-transition"
import { ThemeToggle } from "@/components/common/theme-toggle"

type AuthShellProps = {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <PageTransition>
      <div className="min-h-screen bg-muted/25">
        <header className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-6">
          <AppLogo />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link className="text-sm text-muted-foreground hover:text-foreground" to="/">
              Home
            </Link>
          </div>
        </header>
        <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-10">
          <div className="w-full rounded-lg border bg-card p-6 shadow-sm">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold">{title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            </div>
            {children}
            <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
          </div>
        </main>
      </div>
    </PageTransition>
  )
}
