import { DotIcon } from '@radix-ui/react-icons'
import { memo } from 'react'

function FormatCarouselContent({
  accountType,
  accountName,
  balance
}: {
  accountType: string
  accountName: string
  balance: number
}) {
  const isNegative = balance < 0
  const absBalance = Math.abs(balance)
  const [whole, fraction] = absBalance
    .toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .split('.')

  return (
    <>
      <h3 className="text-normal font-normal">
        <span className="inline-flex items-center gap-1">
          {accountType} <DotIcon /> {accountName}
        </span>
      </h3>
      <span className="text-4xl md:text-5xl lg:text-6xl font-bold mt-2">
        {isNegative && '-'}£{whole}
        <span className="text-base md:text-2xl align-bottom ml-1">.{fraction}</span>
      </span>
    </>
  )
}

export default memo(FormatCarouselContent)