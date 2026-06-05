import type { Session, User } from "@supabase/supabase-js"
import { create } from "zustand"
import { api } from "@/lib/api"
import { supabase } from "@/lib/supabase"

type SignUpPayload = {
  name: string
  email: string
  password: string
}

type AuthState = {
  session: Session | null
  user: User | null
  loading: boolean
  setSession: (session: Session | null) => void
  setLoading: (loading: boolean) => void
  signIn: (email: string, password: string) => Promise<void>
  signUp: (payload: SignUpPayload) => Promise<boolean>
  signInWithGoogle: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  loading: true,
  setSession: (session) => set({ session, user: session?.user ?? null, loading: false }),
  setLoading: (loading) => set({ loading }),
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      throw error
    }
    set({ session: data.session, user: data.user, loading: false })
  },
  signUp: async ({ name, email, password }) => {
    await api.register({ name, email, password })
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      throw error
    }
    set({ session: data.session, user: data.user, loading: false })
    return Boolean(data.session)
  },
  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })
    if (error) {
      throw error
    }
  },
  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })
    if (error) {
      throw error
    }
  },
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }
    set({ session: null, user: null, loading: false })
  },
}))
