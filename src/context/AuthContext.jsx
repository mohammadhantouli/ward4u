import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)

  const [authLoading, setAuthLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)

  const loading = authLoading || profileLoading

  // ---------------------------
  // Init auth (on page load)
  // ---------------------------
  useEffect(() => {
    const initAuth = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (error || !data.session) {
        setUser(null)
        setProfile(null)
        setAuthLoading(false)
        return
      }

      setUser(data.session.user)
      setAuthLoading(false)
      loadProfile(data.session.user)
    }

    initAuth()

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Don't update user state - let ResetPassword page handle it
        return
      }

      if (!session) {
        setUser(null)
        setProfile(null)
        setAuthLoading(false)
        return
      }

      setUser(session.user)
      loadProfile(session.user)
    })

    return () => subscription.unsubscribe()
  }, [])

  // ---------------------------
  // Load / create profile
  // ---------------------------
  const loadProfile = async (authUser) => {
    setProfileLoading(true)

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()

    // Profile not found → create one
    if (!data && error?.code === 'PGRST116') {
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({
          id: authUser.id,
          email: authUser.email,
          role: 'client',
          budget: 0
        })
        .select()
        .single()

      setProfile(newProfile)
      setProfileLoading(false)
      return
    }

    setProfile(data || null)
    setProfileLoading(false)
  }

  // ---------------------------
  // Auth actions
  // ---------------------------
  const signUp = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    })

    if (!error && data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        full_name: fullName,
        role: 'client',
        budget: 0
      })
    }

    return { data, error }
  }

  const signIn = async (email, password) => {
    return await supabase.auth.signInWithPassword({ email, password })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setAuthLoading(false)
  }

  const updateProfile = async (updates) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (!error) setProfile(data)
    return { data, error }
  }

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    isAdmin: profile?.role === 'admin',
    isSeller: profile?.role === 'seller',
    isClient: profile?.role === 'client'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
