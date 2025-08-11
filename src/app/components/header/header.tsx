import * as Styled from './styles'
import { Avatar, TextField } from '@radix-ui/themes'
import { MagnifyingGlassIcon, GearIcon } from '@radix-ui/react-icons'

const Header = () => {
  
  return (
    <Styled.HeaderWrapper>
      {/* <Styled.AvatarWrapper>
        <Avatar fallback='G' 
                src='https://media.licdn.com/dms/image/v2/D4E03AQGKackdOrVWWA/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1693591947730?e=1755734400&v=beta&t=-61IzpZRRGgQ1LSxu1LtkUXnwRZLrbPmBhVpTy6RhzY' 
                radius='full'
        />
      </Styled.AvatarWrapper>
      <Styled.NameWrapper>
        <span>Welcome Back, <br /><strong>Gbenga Ilesanmi</strong></span>
      </Styled.NameWrapper>
      <TextField.Root placeholder='Search...' radius='full' >
        <TextField.Slot>
          <MagnifyingGlassIcon height='16' width='16' />
        </TextField.Slot>
      </TextField.Root>
      <GearIcon height='30' width='26' /> */}
    </Styled.HeaderWrapper>
  )
}

export default Header