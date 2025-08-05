'use client'

import { useEffect, useState } from 'react'
import * as Styled from './styles'
import type { Account } from '@/types/account'
import type { Transaction } from '@/types/transactions'
import { ScrollArea } from '@radix-ui/themes'
import Header from '@/app/components/header/Header'
import Footer from '@/app/components/footer/Footer'
import { DragHeight } from '@/hooks/drag-height'
import AccountsRow from '@/app/components/accounts-row/AccountsRow'
import { getAccountsForCustomer } from '@/app/actions/accounts'
import TransactionsColumn from '@/app/components/transactions-column/TransactionsColumn'
import { getTransactionsForCustomer } from '@/app/actions/transactions'

export default function PortfolioPage() {
  const [user, setUser] = useState(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    fetch('/api/session')
      .then(res => res.json())
      .then(userData => {
        setUser(userData)
        if (userData?.user) {
          getAccountsForCustomer(userData.user).then(setAccounts)
          getTransactionsForCustomer(userData.user).then(setTransactions)
        }
      })
  }, [])

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
              <TransactionsColumn transactions={transactions.slice(0,50)} />
            </Styled.StyledScrollArea>
          </div>
        </Styled.BottomGrid>
      </Styled.StyledSection>
      <Footer />
    </>
  )
}
