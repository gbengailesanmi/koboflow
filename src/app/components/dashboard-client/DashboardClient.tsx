'use client'

import React, { useState } from 'react'
import { DragHeight } from '@/hooks/drag-height'
import * as Styled from './styles'
import { ScrollArea } from '@radix-ui/themes'
import AccountsRow from '@/app/components/accounts-row/AccountsRow'
import TransactionsColumn from '@/app/components/transactions-column/TransactionsColumn'
import type { Account } from '@/types/account'
import type { Transaction } from '@/types/transactions'
import Header from '@/app/components/header/Header'
import Footer from '@/app/components/footer/Footer'

type DashboardClientProps = {
  accounts: Account[]
  transactions: Transaction[]
}

export default function DashboardClient({ accounts, transactions }: DashboardClientProps) {
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)

  const filteredTransactions = selectedAccount
    ? transactions.filter((txn) => txn.accountUniqueId === selectedAccount)
    : transactions

  const { height, heightAsStyle, handleDragStart } = DragHeight()

  return (
    <>
    <Header />
    <Styled.StyledSection>
      <Styled.TopGrid width="auto">what a grid</Styled.TopGrid>

      <Styled.DragHandle
        $top={`${100 - height}dvh`}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
      >
        Drag to resize
      </Styled.DragHandle>

      <Styled.BottomGrid $height={heightAsStyle} rows="2">
        <div>
          <Styled.SeeAllDiv>
            <span>Accounts</span>
            <span>see all</span>
          </Styled.SeeAllDiv>

          <ScrollArea type="always" scrollbars="horizontal">
            <AccountsRow accounts={accounts} onAccountSelect={setSelectedAccount}/>
          </ScrollArea>
        </div>

        <div className="flex flex-col h-[100%]">
          <Styled.SeeAllDiv>
            <span>Transactions</span>
            <span>see all</span>
          </Styled.SeeAllDiv>

          <Styled.StyledScrollArea type="always" scrollbars="vertical">
            <TransactionsColumn transactions={filteredTransactions.slice(0, 100)} />
          </Styled.StyledScrollArea>
        </div>
      </Styled.BottomGrid>
    </Styled.StyledSection>
    <Footer />
    </>
  )
}
