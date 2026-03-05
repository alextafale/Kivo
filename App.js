import React from 'react'
import { AuthProvider } from './supabase/frontend/application/context/AuthContext'
import StackNavigation from './supabase/frontend/navigation/StacNavigation'

export default function App() {
  return (
    <AuthProvider>
      <StackNavigation />
    </AuthProvider>
  )
}