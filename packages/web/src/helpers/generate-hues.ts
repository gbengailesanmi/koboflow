function generateHues(count = 20) {
  return Array.from({ length: count }, (_, i) => `hsl(${Math.floor((360 / count) * i)}, 70%, 50%)`)
}

export default generateHues
