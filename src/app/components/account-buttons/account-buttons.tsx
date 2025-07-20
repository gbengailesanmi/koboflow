import React from "react"
import * as Styled from "@/app/components/account-buttons/styles"

interface Account {
  id: number
  name: string
  balance: number
  currency: string
  type: string
  accountNo: string
  sortCode: string
}

interface Props {
  accounts: Account[]
  colors: string[]
  columnsOnLargeScreen: number
}

export default function AccountButtons({ accounts, colors, columnsOnLargeScreen }: Props) {
  const isOddOneOut = accounts.length % columnsOnLargeScreen === 1

  return (
    <>
      {accounts.map((account, index) => {
        const color = colors[index % colors.length]
        const isLast = index === accounts.length - 1
        const style =
          isOddOneOut && isLast
            ? { gridColumn: '2 / 3' }
            : undefined

        return (
          <Styled.StyledButton
            key={account.id}
            $bgColor={color}
            title={account.name}
            style={style}
          >
            <Styled.ButtonSpan>
              <span style={{ fontSize: '0.875rem', fontWeight: 'normal' }}>
                {account.name}<br />
                {account.accountNo} {account.sortCode}
              </span>
              <span style={{ fontSize: '1.25rem', fontWeight: 'bold', display: 'block', marginTop: '4px' }}>
                {account.currency} {account.balance.toLocaleString()}
              </span>
            </Styled.ButtonSpan>
          </Styled.StyledButton>
        )
      })}
    </>
  )
}
