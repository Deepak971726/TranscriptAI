import { GitBranch } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/auth-store"

type SocialAuthButtonsProps = {
  mode: "signin" | "signup"
}

export function SocialAuthButtons({ mode }: SocialAuthButtonsProps) {
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle)
  const signInWithGithub = useAuthStore((state) => state.signInWithGithub)
  const action = mode === "signin" ? "Sign in" : "Sign up"

  function handleOAuth(provider: "Google" | "GitHub", request: () => Promise<void>) {
    void request().catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : `${provider} authentication failed`)
    })
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <Button
        className="h-11 border-slate-200 bg-white/75 text-slate-700 shadow-sm hover:border-cyan-300/60 hover:bg-white hover:text-slate-950 hover:shadow-[0_9px_24px_rgba(8,145,178,0.10)]"
        type="button"
        variant="outline"
        onClick={() => handleOAuth("Google", signInWithGoogle)}
      >
        <span className="flex size-4 items-center justify-center rounded-full border border-slate-300 text-[10px] font-bold text-slate-700">
          G
        </span>
        <span className="hidden sm:inline">{action} with</span> Google
      </Button>
      <Button
        className="h-11 border-slate-200 bg-white/75 text-slate-700 shadow-sm hover:border-cyan-300/60 hover:bg-white hover:text-slate-950 hover:shadow-[0_9px_24px_rgba(8,145,178,0.10)]"
        type="button"
        variant="outline"
        onClick={() => handleOAuth("GitHub", signInWithGithub)}
      >
        <GitBranch className="size-4" />
        <span className="hidden sm:inline">{action} with</span> GitHub
      </Button>
    </div>
  )
}
