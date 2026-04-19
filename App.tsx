import React from 'react'
import { AuthProvider } from './supabase/frontend/application/context/AuthContext'
import { DomiciliosProvider } from './supabase/frontend/application/context/DomiciliosContext'
import StackNavigation from './supabase/frontend/navigation/StacNavigation'
import { CartProvider } from './supabase/frontend/application/context/CartContext'
import { ThemeProvider } from './supabase/frontend/application/context/ThemeContext'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DomiciliosProvider>
          <CartProvider>
            <StackNavigation />
          </CartProvider>
        </DomiciliosProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}