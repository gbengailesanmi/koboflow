import styled from 'styled-components'
import { Button } from "@radix-ui/themes"

const StyledButton = styled(Button)<{ $bgColor: string }>`
  width: 100%;
  height: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 1.5rem;
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

export { StyledButton, ButtonSpan }