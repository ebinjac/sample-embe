import { Header } from '@/components/header'
import React from 'react'

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
        <Header />
          {children}
    </div>
  )
}
