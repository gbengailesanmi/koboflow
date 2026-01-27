'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function useScrollRestoration() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const key = `scroll:${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
  const isRestoredRef = useRef(false)

  // Restore scroll position on mount
  useEffect(() => {
    if (isRestoredRef.current) return
    
    const savedPosition = sessionStorage.getItem(key)
    if (savedPosition) {
      const y = Number(savedPosition)
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        window.scrollTo({
          top: y,
          behavior: 'instant' as ScrollBehavior
        })
      })
    }
    
    isRestoredRef.current = true
  }, [key])

  // Save scroll position before navigating away
  useEffect(() => {
    const saveScrollPosition = () => {
      sessionStorage.setItem(key, String(window.scrollY))
    }

    // Save on unmount (when navigating to another page)
    return () => {
      saveScrollPosition()
    }
  }, [key])

  // Also save on interval (in case of crashes/force refresh)
  useEffect(() => {
    const interval = setInterval(() => {
      sessionStorage.setItem(key, String(window.scrollY))
    }, 1000)

    return () => clearInterval(interval)
  }, [key])
}

/**
 * Hook to restore horizontal scroll position for carousels/sliders
 * Use this for elements that scroll horizontally (like account carousels)
 * 
 * @param ref - React ref to the scrollable element
 * @param storageKey - Unique key for this carousel (e.g., 'accounts-carousel')
 * 
 * @example
 * const carouselRef = useRef<HTMLDivElement>(null)
 * useHorizontalScrollRestoration(carouselRef, 'accounts-carousel')
 * 
 * <div ref={carouselRef} className="overflow-x-scroll">
 *   {accounts.map(...)}
 * </div>
 */
export function useHorizontalScrollRestoration(
  ref: React.RefObject<HTMLElement | null>,
  storageKey: string
) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const key = `hscroll:${storageKey}:${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
  const isRestoredRef = useRef(false)

  // Restore scroll position on mount
  useEffect(() => {
    if (!ref.current || isRestoredRef.current) return
    
    const savedPosition = sessionStorage.getItem(key)
    if (savedPosition) {
      const x = Number(savedPosition)
      requestAnimationFrame(() => {
        if (ref.current) {
          ref.current.scrollLeft = x
        }
      })
    }
    
    isRestoredRef.current = true
  }, [key, ref])

  // Save scroll position on scroll
  useEffect(() => {
    const element = ref.current
    if (!element) return

    const handleScroll = () => {
      sessionStorage.setItem(key, String(element.scrollLeft))
    }

    element.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      element.removeEventListener('scroll', handleScroll)
      // Final save on unmount
      sessionStorage.setItem(key, String(element.scrollLeft))
    }
  }, [key, ref])
}
