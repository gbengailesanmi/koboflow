export const formatAmount = (unscaledValue?: string, scale?: string): string => {
  const value = Number(unscaledValue)
  const scaleNum = Number(scale)

  const result = value * Math.pow(10, -scaleNum)
  return result.toFixed(2)
}
