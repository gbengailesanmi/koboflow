import { Grid } from "@radix-ui/themes"
import styled from 'styled-components'

const HeaderWrapper = styled.div`
  height: 10vh;
  width: 100%;
  display: flex;
  padding: 10px;

`

const AvatarWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`

const NameWrapper = styled.div`
  align-items: left;
  
  @media (max-width: 640px) {
    font-size: 1rem;
    line-height: 1;
    padding: 10px;
  }

  @media (min-width: 768px) {
    font-size: 1.2rem;
    line-height: 1.5;
    padding: 20px;
  }
`

export { HeaderWrapper, AvatarWrapper, NameWrapper }