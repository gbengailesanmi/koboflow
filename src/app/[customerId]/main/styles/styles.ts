import styled, { css } from 'styled-components'
import { Grid } from "@radix-ui/themes"

const gridStyles = css`
  border: 1px solid black;
  border-radius: 15px;
  text-align: center;
  cursor: pointer;
`

const TopGrid = styled(Grid)`
  ${gridStyles}
  height: 40dvh;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #1e3a8a 0%, #000000 100%);
  width: calc(100% - 1rem);
  margin-left: .5rem;
  margin-right: .5rem;
`

const DragHandle = styled.div<{ $top: string }>`
  position: absolute;
  top: ${({ $top }) => $top};
  left: 0;
  right: 0;
  height: 20px;
  cursor: ns-resize;
  z-index: 10;
  background: rgba(0, 0, 0, 0.1);
  text-align: center;
  color: white;
  font-size: 12px;
  touch-action: none;
  user-select: none;
`

const BottomGrid = styled(Grid)<{ $height: string }>`
  ${gridStyles}
  gap: .5rem;
  max-height: 80dvh;
  min-height: 20dvh;
  scroll-behavior: smooth;
  background: white;
  position: absolute;
  bottom: 0;
  height: ${({ $height }) => $height};
  transition: height 0.25s ease;
  touch-action: none;
  user-select: none;
  width: 100%;
  color: black;
`

export { TopGrid, BottomGrid, gridStyles, DragHandle }