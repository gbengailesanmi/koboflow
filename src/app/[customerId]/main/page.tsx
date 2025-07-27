'use client'
import * as Styled from './styles/styles'
import { useParams } from 'next/navigation'
import { Section, ScrollArea } from '@radix-ui/themes'
import Header from '@/app/components/header/Header'
import Footer from '@/app/components/footer/Footer'
import { DragHeight } from '@/../src/hooks/dragHeight'
import AccountsRow from '@/app/components/accounts-row/AccountsRow'
import TransactionsColumn from '@/app/components/transactions-column/TransactionsColumn'
import { accountsMock } from '@/mocks/accountsMock'
import { trxnMock } from '@/mocks/trxnMock'

export default function PortfolioPage() {
  const params = useParams()
  const customerId = params?.customerId

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
          {/* <div style={{ border: '1px solid black' }}> */}
          <div>
            <Styled.SeeAllDiv>
              <span>Accounts</span>
              <span>see all</span>
            </Styled.SeeAllDiv>

            <ScrollArea type="always" scrollbars="horizontal">
              <AccountsRow accounts={accountsMock} />
          </ScrollArea>
          </div>

            <div className='flex flex-col h-[100%]'>
            <Styled.SeeAllDiv>
              <span>Transactions</span>
              <span>see all</span>
            </Styled.SeeAllDiv>
            <Styled.StyledScrollArea type="always" scrollbars="vertical">
              <TransactionsColumn transactions={trxnMock.transactions}/>
            </Styled.StyledScrollArea>
          </div>
        </Styled.BottomGrid>
      </Styled.StyledSection>
      <Footer />
    </>
  )
}
