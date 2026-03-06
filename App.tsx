import React from 'react'
import { AuthProvider } from './supabase/frontend/application/context/AuthContext'
import { DomiciliosProvider } from './supabase/frontend/application/context/DomiciliosContext'
import StackNavigation from './supabase/frontend/navigation/StacNavigation'

export default function App() {
  return (
    <AuthProvider>
      <DomiciliosProvider>
        <StackNavigation />
      </DomiciliosProvider>
    </AuthProvider>
  )
}