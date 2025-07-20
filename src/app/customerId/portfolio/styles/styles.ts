import styled, { css } from 'styled-components'
import { Grid, Button } from "@radix-ui/themes"

const gridStyles = css`
  border: 1px solid black;
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
`

const BottomGrid = styled(Grid)`
  ${gridStyles}
  display: flex;
  gap: 2rem;
  margin: 0 auto;
  max-height: 60dvh;

  @media (max-width: 768px) {
    margin: 10px;
  }
  @media (min-width: 1024px) {
    width: 70%;
  }
`

const InsideBottomGrid = styled(Grid)`
  display: grid;
  width: 100%;
  margin: 10px;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  grid-template-columns: repeat(2, 1fr);

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
    grid-auto-rows: 150px;
  }
`

const StyledButton = styled(Button)<{ $bgColor: string }>`
  width: 100%;
  height: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 0.5rem;
  background-color: ${({ $bgColor }) => $bgColor};
  color: white;
  display: flex;
  align-items: center;
  cursor: pointer;
`

const ButtonSpan = styled.span`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`

export { TopGrid, BottomGrid, InsideBottomGrid, StyledButton, ButtonSpan, gridStyles }