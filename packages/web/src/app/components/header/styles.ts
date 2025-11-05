import { Grid } from "@radix-ui/themes"
import styled from 'styled-components'

const HeaderWrapper = styled.div`
  height: 7vh;
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
    font-size: 0.6rem;
    line-height: 1;
    // align-items: center;
    align-self: center;
    align-text: center;
    // padding: 12px;
  }

  @media (min-width: 768px) {
    font-size: 1.2rem;
    line-height: 1.5;
    padding: 20px;
  }
`

export { HeaderWrapper, AvatarWrapper, NameWrapper }