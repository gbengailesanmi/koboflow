'use client'

import React, { useCallback } from 'react'
import type { Account } from '@/types/account'
import { useBaseColor } from '@/providers/base-colour-provider'
import useEmblaCarousel from 'embla-carousel-react'
import { Box, IconButton } from '@radix-ui/themes'
import { DoubleArrowLeftIcon, DoubleArrowRightIcon } from '@radix-ui/react-icons'
import FormatCarouselContent from '@/helpers/format-carousel-content'

type AccountsCarouselProps = {
  accounts: Account[]
  selectedAccount: string | null
  setSelectedAccount: (id: string | null) => void
  onNavigate?: () => void
}

export default function AccountsCarousel({
  accounts,
  selectedAccount,
  setSelectedAccount,
  onNavigate,
}: AccountsCarouselProps) {
  const { baseColor } = useBaseColor()
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false })

  const scrollPrev = useCallback(() => {
    if (emblaApi) {
      emblaApi.scrollPrev()
      onNavigate?.()
    }
  }, [emblaApi, onNavigate])

  const scrollNext = useCallback(() => {
    if (emblaApi) {
      emblaApi.scrollNext()
      onNavigate?.()
    }
  }, [emblaApi, onNavigate])

  // Total balance of all accounts
  const totalBalance = accounts.reduce(
    (sum, acc) => sum + Number(acc.balance ?? 0),
    0
  )

  return (
    <>
      <Box className="embla">        
        <div className="embla__viewport" ref={emblaRef}>
          <div className="embla__container">

            {/* Total Slide */}
            <div
              className="embla__slide"
              onClick={() => setSelectedAccount(null)}
            >
              <FormatCarouselContent
                accountType="Total Balance"
                accountName="All Accounts"
                balance={totalBalance}
              />
            </div>

            {/* Account Slides */}
            {accounts.map((account) => (
              <div
                key={account.id}
                className="embla__slide"
                onClick={() => setSelectedAccount(account.uniqueId)}
              >
                <FormatCarouselContent
                  accountType={account.type}
                  accountName={account.name}
                  balance={Number(account.balance)}
                />
              </div>
            ))}

          </div>
        </div>
      </Box>

      <div className="flex w-20 justify-between mt-4">
        <div
          onClick={scrollPrev}
          aria-label="Previous account"
        >
          <DoubleArrowLeftIcon width="18" height="18"/>
        </div>
        <button
          onClick={scrollNext}
          aria-label="Next account"
        >
          <DoubleArrowRightIcon width="18" height="18"/>
        </button>
      </div>
    </>
  )
}
