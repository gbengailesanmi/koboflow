'use client'

import { useEffect } from 'react'

type PageBackgroundProps = {
  baseColor: string
  children: React.ReactNode
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

export function PageBackground({ baseColor, children }: PageBackgroundProps) {
  const viaColor = shadeAndAlpha(baseColor, 0.5, 0.2)
  const bottomColor = '#040914'
  const viaStop = '40%'
  const bottomStop = '90%'

  useEffect(() => {
    // Apply gradient to body
    document.body.style.background = `
      linear-gradient(
        135deg,
        ${baseColor} 0%,
        ${viaColor} ${viaStop},
        ${bottomColor} ${bottomStop}
      )
    `
    document.body.style.minHeight = '100vh'
    document.body.style.margin = '0'
    
    // Cleanup
    return () => {
      document.body.style.background = ''
      document.body.style.minHeight = ''
    }
  }, [baseColor, viaColor, bottomColor, viaStop, bottomStop])

  return <>{children}</>
}
