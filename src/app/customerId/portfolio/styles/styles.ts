import styled, { css } from 'styled-components'
import { Grid } from "@radix-ui/themes"

const gridStyles = css`
  // border: 1px solid black;
  border-radius: 15px;
  text-align: center;
  cursor: pointer;
`

const TopGrid = styled(Grid)`
  ${gridStyles}
  height: 40dvh;
  margin: 10px;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #1e3a8a 0%, #000000 100%);
`

const BottomGrid = styled(Grid)`
  ${gridStyles}
  display: flex;
  gap: 2rem;
  margin: 0 auto;
  max-height: 50dvh;
  justify-content: center;

  @media (max-width: 768px) {
    margin: 10px;
  }
  @media (min-width: 1024px) {
    width: 70%;
  }
`

const PortfolioText = styled.div`
  font-weight: bold;
  font-size: 1rem;

  @media (max-width: 768px) {
    margin-left: 50px;
  }

  @media (min-width: 1024px) {
    width: 70%;
  }
`

const InsideBottomGrid = styled(Grid)`
  display: grid;
  width: 80%;
  margin: 10px;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  grid-template-columns: repeat(2, 1fr);

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
    grid-auto-rows: 150px;
  }
`

export { TopGrid, BottomGrid, InsideBottomGrid, gridStyles, PortfolioText }