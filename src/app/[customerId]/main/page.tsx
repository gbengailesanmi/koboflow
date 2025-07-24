'use client'
import * as Styled from './styles/styles'
import { useParams } from 'next/navigation'
import { Section } from '@radix-ui/themes'
import Header from '@/app/components/header/header'
import Footer from '@/app/components/footer/footer'
import { DragHeight } from '@/../src/hooks/dragHeight'

export default function PortfolioPage() {
  const params = useParams()
  const customerId = params?.customerId

  const { height, heightAsStyle, handleDragStart } = DragHeight()

  return (
    <>
      <Header />
      <Section style={{ paddingTop: 0, marginTop: 0 }}>
        <Styled.TopGrid width='auto'>
          what a grid
        </Styled.TopGrid>

        <Styled.DragHandle
          $top={`${100 - height}dvh`}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          Drag to resize
        </Styled.DragHandle>
        <Styled.BottomGrid $height={heightAsStyle} rows='2' style={{ gridTemplateRows: '100px 1fr' }}>
          <div style={{ border: '1px solid black' }}>dkdkdkd</div>
          <div className='flex flex-col' style={{ height: '100%', border: '1px solid black' }}>
            what a grid<br />
            what a grid<br />
            what a grid<br />
            what a grid<br />
            what a grid<br />
            what a grid<br />
            what a grid<br />
            what a grid<br />
            what a grid
            what a grid
            what a grid
            what a grid
            what a grid
            what a grid
            what a grid
            what a grid

          </div>
        </Styled.BottomGrid>
      </Section>
      <Footer />
    </>
  )
}
