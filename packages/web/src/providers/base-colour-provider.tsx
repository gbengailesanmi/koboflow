'use client'

import React, { createContext, useState, useContext, useEffect } from 'react'

type ColorContextType = {
  baseColor: string
  viaColor: string
  bottomColor: string
  viaStop: string
  bottomStop: string
  setBaseColor: (color: string, userSet?: boolean) => void
  isUserSet: boolean
}

const ColorContext = createContext<ColorContextType>({
  baseColor: '',
  viaColor: '',
  bottomColor: '',
  viaStop: '',
  bottomStop: '',
  setBaseColor: () => {},
  isUserSet: false,
})

export function useBaseColor() {
  return useContext(ColorContext)
}

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
  const [baseColor, _setBaseColor] = useState('#245cd4')
  const [isUserSet, setIsUserSet] = useState(false)

  const viaColor = shadeAndAlpha(baseColor, 0.5, 0.2)
  const bottomColor = '#040914'
  const viaStop = '40%'
  const bottomStop = '90%'

  const setBaseColor = (color: string, userSet = false) => {
    _setBaseColor(color)
    if (userSet) setIsUserSet(true)
    
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--baseColor', color)
    }
  }

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--baseColor', baseColor)
    }
  }, [baseColor])

  return (
    <ColorContext.Provider
      value={{
        baseColor,
        viaColor,
        bottomColor,
        viaStop,
        bottomStop,
        setBaseColor,
        isUserSet,
      }}
    >
      {children}
    </ColorContext.Provider>
  )
}
