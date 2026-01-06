import { useEffect } from 'react'

interface UseDynamicBackgroundProps {
  activeIndex: number
  colors: readonly string[]
}

/**
 * Hook to dynamically update CSS variables based on active slide index
 * Updates the dashboard background gradient as user scrolls through carousel
 */
export function useDynamicBackground({ activeIndex, colors }: UseDynamicBackgroundProps) {
  useEffect(() => {
    if (colors.length === 0) return

    const activeColor = colors[activeIndex] || colors[0]
    
    document.documentElement.style.setProperty('--dashboard-bg-color', activeColor)
    const bottomBlend = `color-mix(in srgb, ${activeColor} 10%, var(--dashboard-bottom-bg-color) 90%)`
    document.documentElement.style.setProperty('--dashboard-bottom-blend', bottomBlend)
  }, [activeIndex, colors])
}
