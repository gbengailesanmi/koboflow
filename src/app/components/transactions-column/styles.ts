import styled from "styled-components"

const TransactionsWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
`

const BoxWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  padding: .5rem;
`

export { TransactionsWrapper, BoxWrapper }
