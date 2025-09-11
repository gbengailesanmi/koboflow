export const formatAmount = (unscaledValue?: string, scale?: string): string => {
  const value = Number(unscaledValue)
  const scaleNum = Number(scale)

  if (isNaN(value) || isNaN(scaleNum)) return '0.00'

  const result = value * Math.pow(10, -scaleNum)
  return result.toFixed(2)
}