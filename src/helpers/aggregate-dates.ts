function aggregateDates(
  data: Record<string, Record<string, number>>,
  allDates: string[],
  allAccountIds: string[],
  bucketCount = 10
) {
  if (allDates.length <= bucketCount) {
    return allDates.map(date => ({
      date,
      ...allAccountIds.reduce((acc, id) => {
        acc[id] = data[date][id] || 0
        return acc
      }, {} as Record<string, number>)
    }))
  }

  const bucketSize = Math.ceil(allDates.length / bucketCount)
  const aggregated: { date: string; [key: string]: number | string }[] = []

  for (let i = 0; i < allDates.length; i += bucketSize) {
    const bucketDates = allDates.slice(i, i + bucketSize)
    const bucketLabel = `${bucketDates[0]} → ${bucketDates[bucketDates.length - 1]}`

    const bucketTotals: Record<string, number> = {}
    allAccountIds.forEach(id => {
      bucketTotals[id] = bucketDates.reduce((sum, date) => sum + (data[date][id] || 0), 0)
    })

    aggregated.push({ date: bucketLabel, ...bucketTotals })
  }

  return aggregated
}

export { aggregateDates }