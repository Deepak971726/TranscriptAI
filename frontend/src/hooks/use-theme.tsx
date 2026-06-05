import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState, type PropsWithChildren } from "react"

type Theme = "light" | "dark" | "system"

type ThemeContextValue = {
  theme: Theme
  resolvedTheme: "light" | "dark"
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function applyTheme(theme: Theme) {
  const resolved = theme === "system" ? getSystemTheme() : theme
  document.documentElement.classList.toggle("dark", resolved === "dark")
  return resolved
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem("transcribeai-theme")
    return stored === "light" || stored === "dark" || stored === "system" ? stored : "system"
  })
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => {
    const stored = localStorage.getItem("transcribeai-theme")
    const initialTheme = stored === "light" || stored === "dark" || stored === "system" ? stored : "system"
    return initialTheme === "system" ? getSystemTheme() : initialTheme
  })

  useLayoutEffect(() => {
    setResolvedTheme(applyTheme(theme))
    localStorage.setItem("transcribeai-theme", theme)
  }, [theme])

  useEffect(() => {
    if (theme !== "system") {
      return undefined
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const listener = () => setResolvedTheme(applyTheme("system"))
    media.addEventListener("change", listener)
    return () => media.removeEventListener("change", listener)
  }, [theme])

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme: setThemeState,
    }),
    [resolvedTheme, theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider")
  }

  return context
}
