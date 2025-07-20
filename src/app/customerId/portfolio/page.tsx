'use client'
import * as Styled from "./styles/styles"
import { Section } from "@radix-ui/themes"
import AccountButtons from "@/app/components/account-buttons/account-buttons"
import Header from "@/app/components/header/header"


export default function PortfolioPage() {

  const accounts = [
    { id: 1, name: "Savings Account", balance: 1000, currency: "USD" , type: "savings", accountNo: "60806761", sortCode: "20-04-70"},
    { id: 2, name: "Checking Account", balance: 500, currency: "GBP", type: "checking", accountNo: "60806761", sortCode: "20-04-70" },
    { id: 3, name: "Investment Account", balance: 15000, currency: "NGN", type: "investment", accountNo: "60806761", sortCode: "20-04-70" },
    { id: 4, name: "Retirement Account", balance: 20000, currency: "EUR", type: "retirement", accountNo: "60806761", sortCode: "20-04-70" },
    { id: 5, name: "Emergency Fund", balance: 3000, currency: "USD", type: "savings", accountNo: "60806761", sortCode: "20-04-70" },
    { id: 6, name: "Credit Card", balance: -200, currency: "USD", type: "credit", accountNo: "60806761", sortCode: "20-04-70" },
    { id: 7, name: "Loan Account", balance: -5000, currency: "USD", type: "loan", accountNo: "60806761", sortCode: "20-04-70" },
    { id: 8, name: "Joint Account", balance: 8000, currency: "USD", type: "joint", accountNo: "60806761", sortCode: "20-04-70" },
    { id: 9, name: "Business Account", balance: 25000, currency: "USD", type: "business", accountNo: "60806761", sortCode: "20-04-70" },
    { id: 10, name: "Travel Fund", balance: 1200, currency: "USD", type: "savings", accountNo: "60806761", sortCode: "20-04-70" }
  ]

  const colors = [
    '#10B981', '#EF4444', '#3B82F6', '#F59E0B', '#F87171',
    '#8B5CF6', '#EC4899', '#22D3EE', '#F43F5E', '#6366F1'
  ]
  const accountsToDisplay = accounts.slice(0, 10)

  return (
    <>
    {/* header */}
    <Header />
    {/* start of top */}
    <Section style={{ paddingTop: 0, marginTop: 0 }}>
    <Styled.TopGrid
      width='auto'
    >
      what a grid
      what a grid
      what a grid
      what a grid
      what a grid
      what a grid
      what a grid
    </Styled.TopGrid>
    {/* end of top */}
    <Styled.PortfolioText> My Portfolio </Styled.PortfolioText>
    {/* start of bottom */}
    <Styled.BottomGrid 
      overflowY="auto">
    <Styled.InsideBottomGrid columns="2">
    <AccountButtons
      accounts={accountsToDisplay}
      colors={colors}
      columnsOnLargeScreen={3}
    />
    </Styled.InsideBottomGrid>
    </Styled.BottomGrid>
    {/* end of bottom */}
    </Section>
    </>
  )
}
