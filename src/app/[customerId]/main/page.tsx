'use client'
import * as Styled from './styles/styles'
import { useParams } from 'next/navigation'
import { Section } from '@radix-ui/themes'
import Header from '@/app/components/header/Header'
import Footer from '@/app/components/footer/Footer'
import { DragHeight } from '@/../src/hooks/dragHeight'
import AccountsRow from '@/app/components/accounts-row/AccountsRow'
import { accounts } from '@/..//src/mocks/accounts'
import TransactionsColumn from '@/app/components/transactions-column/TransactionsColumn'

export default function PortfolioPage() {
  const params = useParams()
  const customerId = params?.customerId

  const { height, heightAsStyle, handleDragStart } = DragHeight()

  return (
    <>
      <Header />
      <Section style={{ paddingTop: 0, marginTop: 0 }}>
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
        <Styled.BottomGrid $height={heightAsStyle} rows='2' style={{ gridTemplateRows: '100px 1fr' }}>
          <div style={{ border: '1px solid black' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px'}}>
              <span>Accounts</span>
              <span>see all</span>
            </div>
            <div style={{ display: 'flex', overflowX: 'auto' }}>
              <AccountsRow accounts={accounts}/>
            </div>
          </div>
          <div className='flex flex-col' style={{ height: '100%', border: '1px solid black' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px'}}>
              <span>Transactions</span>
              <span>see all</span>
            </div>
            <div style={{ flexGrow: 1, overflowY: 'auto' }}>
              <TransactionsColumn />
            </div>
          </div>
        </Styled.BottomGrid>
      </Section>
      <Footer />
    </>
  )
}
