'use client'

import { useEffect, useState } from 'react'
import * as Styled from './styles'
import type { Account } from '@/types/account'
import { useSearchParams } from 'next/navigation'
import { ScrollArea } from '@radix-ui/themes'
import Header from '@/app/components/header/Header'
import Footer from '@/app/components/footer/Footer'
import { DragHeight } from '@/hooks/drag-height'
import AccountsRow from '@/app/components/accounts-row/AccountsRow'
import { getAccountsForCustomer } from '@/app/actions/accounts'
import TransactionsColumn from '@/app/components/transactions-column/TransactionsColumn'

export default function PortfolioPage() {
  const [user, setUser] = useState(null)
  const [accounts, setAccounts] = useState<Account[]>([])

  useEffect(() => {
    fetch('/api/session')
      .then(res => res.json())
      .then(userData => {
        setUser(userData)
        if (userData?.user) {
          getAccountsForCustomer(userData.user).then(setAccounts)
        }
      })
  }, [])

  console.log('accounts', accounts)

  const { height, heightAsStyle, handleDragStart } = DragHeight()

  return (
    <>
      <Header />
      <Styled.StyledSection>
        <Styled.TopGrid width='auto'>
          what a grid
        </Styled.TopGrid>
        <Styled.DragHandle
          $top={`${100 - height}dvh`}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          Drag to resize
        </Styled.DragHandle>
        <Styled.BottomGrid $height={heightAsStyle} rows='2'>
          <div>
            <Styled.SeeAllDiv>
              <span>Accounts</span>
              <span>see all</span>
            </Styled.SeeAllDiv>

            <ScrollArea type="always" scrollbars="horizontal">
              <AccountsRow accounts={accounts} />
            </ScrollArea>
          </div>

          <div className='flex flex-col h-[100%]'>
            <Styled.SeeAllDiv>
              <span>Transactions</span>
              <span>see all</span>
            </Styled.SeeAllDiv>

            <Styled.StyledScrollArea type="always" scrollbars="vertical">
              {/* <TransactionsColumn transactions={transactions} /> */}
            </Styled.StyledScrollArea>
          </div>
        </Styled.BottomGrid>
      </Styled.StyledSection>
      <Footer />
    </>
  )
}
