import { useRef, useState } from 'react'

export function DragHeight(initial = 60, min = 20, max = 80) {
  const [height, setHeight] = useState(initial)
  const isDraggingRef = useRef(false)
  const startYRef = useRef(0)
  const startHeightRef = useRef(initial)

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    isDraggingRef.current = true
    startYRef.current = 'touches' in e ? e.touches[0].clientY : e.clientY
    startHeightRef.current = height

    document.addEventListener('mousemove', handleDragMove)
    document.addEventListener('touchmove', handleDragMove)
    document.addEventListener('mouseup', handleDragEnd)
    document.addEventListener('touchend', handleDragEnd)
  }

  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    if (!isDraggingRef.current) return
    const currentY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY
    const diff = startYRef.current - currentY
    const vhDiff = (diff / window.innerHeight) * 100
    const newHeight = Math.min(max, Math.max(min, startHeightRef.current + vhDiff))
    setHeight(newHeight)
  }

  const handleDragEnd = () => {
    isDraggingRef.current = false
    document.removeEventListener('mousemove', handleDragMove)
    document.removeEventListener('touchmove', handleDragMove)
    document.removeEventListener('mouseup', handleDragEnd)
    document.removeEventListener('touchend', handleDragEnd)
  }

  return {
    height,
    heightAsStyle: `${height}dvh`,
    handleDragStart,
  }
}
