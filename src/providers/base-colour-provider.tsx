'use client'

import React, { createContext, useState, useContext } from 'react'

type ColorContextType = {
  baseColor: string
  viaColor: string
  bottomColor: string
  viaStop: string
  bottomStop: string
  setBaseColor: (color: string) => void
}

const ColorContext = createContext<ColorContextType>({
  baseColor: '',
  viaColor: '',
  bottomColor: '',
  viaStop: '',
  bottomStop: '',
  setBaseColor: () => {},
})

export function useBaseColor() {
  return useContext(ColorContext)
}
// Helper to darken and add alpha
function shadeAndAlpha(color: string, percent: number, alpha: number) {
  const f = parseInt(color.slice(1), 16)
  const R = f >> 16
  const G = (f >> 8) & 0x00ff
  const B = f & 0x0000ff

  const newR = Math.round(R * (1 - percent))
  const newG = Math.round(G * (1 - percent))
  const newB = Math.round(B * (1 - percent))

  return `rgba(${newR}, ${newG}, ${newB}, ${alpha})`
}

export default function BaseColorProvider({ children }: { children: React.ReactNode }) {
  const [baseColor, setBaseColor] = useState('#245cd4')

  const viaColor = shadeAndAlpha(baseColor, 0.5, 0.2)
  const bottomColor = '#040914'

  const viaStop = '40%'
  const bottomStop = '90%'

  return (
    <ColorContext.Provider value={{ baseColor, viaColor, bottomColor, viaStop, bottomStop, setBaseColor }}>
      {children}
    </ColorContext.Provider>
  )
}
