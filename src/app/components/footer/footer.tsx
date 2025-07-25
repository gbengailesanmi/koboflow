import React from 'react'
import * as Styled from '@/app/components/footer/styles'
import { IconButton, Card } from '@radix-ui/themes'
import { HomeIcon, Pencil2Icon, MixerHorizontalIcon, BackpackIcon } from '@radix-ui/react-icons'

const Footer: React.FC = () => {
  return (
    <Styled.FooterDiv>
      <Card>

      <IconButton variant='soft'><HomeIcon /></IconButton>
      <IconButton variant='soft'><Pencil2Icon /></IconButton>
      <IconButton variant='soft'><MixerHorizontalIcon /></IconButton>
      <IconButton variant='soft'><BackpackIcon /></IconButton>
      
      </Card>
    </Styled.FooterDiv>
  )
}

export default Footer
