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
        className="auth-reference-social group relative h-12 overflow-hidden"
        type="button"
        variant="outline"
        onClick={() => handleOAuth("Google", signInWithGoogle)}
      >
        <span className="auth-reference-social-icon flex size-5 items-center justify-center rounded-full text-base font-bold">
          G
        </span>
        <span className="sr-only">{action} with</span> Google
      </Button>
      <Button
        className="auth-reference-social group relative h-12 overflow-hidden"
        type="button"
        variant="outline"
        onClick={() => handleOAuth("GitHub", signInWithGithub)}
      >
        <GitBranch className="auth-reference-social-icon size-4" />
        <span className="sr-only">{action} with</span> GitHub
      </Button>
    </div>
  )
}
