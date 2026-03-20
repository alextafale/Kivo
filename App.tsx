import React from 'react'
import { AuthProvider } from './supabase/frontend/application/context/AuthContext'
import { DomiciliosProvider } from './supabase/frontend/application/context/DomiciliosContext'
import StackNavigation from './supabase/frontend/navigation/StacNavigation'
import { CartProvider } from './supabase/frontend/application/context/CartContext'

export default function App() {
  return (
    <AuthProvider>
      <DomiciliosProvider>
        <CartProvider>
          <StackNavigation />
        </CartProvider>
      </DomiciliosProvider>
    </AuthProvider>
  )
}