import React from 'react'
import * as Styled from '@/app/components/footer/styles'
import { IconButton } from '@radix-ui/themes'
import { HomeIcon, Pencil2Icon, MixerHorizontalIcon, BackpackIcon } from '@radix-ui/react-icons'

const Footer: React.FC = () => {
  return (
    <Styled.FooterDiv className='bg-blue-950 flex justify-between items-center gap-8'>
      <IconButton variant='outline' size='3' onClick={() => (console.log('fvfggd'))}><HomeIcon width='25' height='25'/></IconButton>
      <IconButton variant='outline' size='3'><Pencil2Icon width='25' height='25'/></IconButton>
      <IconButton variant='outline' size='3'><MixerHorizontalIcon width='25' height='25'/></IconButton>
      <IconButton variant='outline' size='3'><BackpackIcon width='25' height='25'/></IconButton>
    </Styled.FooterDiv>
  )
}

export default Footer
