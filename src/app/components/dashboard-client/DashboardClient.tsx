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
import LinePlotChart from '@/app/components/line-plot-chart/LinePlotChart'

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
      <Styled.TopGrid width="auto"><LinePlotChart transactions={transactions} accounts={accounts} /></Styled.TopGrid>

      <Styled.DragHandle
        $top={`${100 - height}dvh`}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
      >
        Drag to resize
      </Styled.DragHandle>

      <Styled.BottomGrid $height={heightAsStyle} rows="2">
        <div>
          <Styled.AccountScrollArea type="always" scrollbars="horizontal">
            <AccountsRow accounts={accounts} onAccountSelect={setSelectedAccount}/>
          </Styled.AccountScrollArea>
        </div>

        <div className="flex flex-col h-[100%]">
          <Styled.SeeAll>
            <span>My transactions</span>
            {selectedAccount && <span
              role='button'
              tabIndex={0}
              onClick={() => setSelectedAccount(null)}
              >
                see all
              </span>}
          </Styled.SeeAll>

          <Styled.TrxnScrollArea type="always" scrollbars="vertical">
            <TransactionsColumn transactions={filteredTransactions.slice(0, 100)} />
          </Styled.TrxnScrollArea>
        </div>
      </Styled.BottomGrid>
    </Styled.StyledSection>
    <Footer />
    </>
  )
}
