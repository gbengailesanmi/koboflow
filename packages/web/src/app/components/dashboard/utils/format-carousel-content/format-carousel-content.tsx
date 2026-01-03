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
  const [whole, fraction] = balance
    .toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .split('.')

  return (
    <>
      <h3 className="text-normal font-normal">
        <span className="inline-flex items-center gap-1">
          {accountType} <DotIcon /> {accountName}
        </span>
      </h3>
      <span className="text-6xl font-bold mt-2">
        £{whole}
        <span className="text-4xl font-bold align-bottom ml-1">.{fraction}</span>
      </span>
    </>
  )
}

export default memo(FormatCarouselContent)