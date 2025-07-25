import { Avatar } from '@radix-ui/themes'
import { PlusIcon } from '@radix-ui/react-icons'
import type { Account } from '@/types/account-type'
import { getAccountLogo } from '@/helpers/get-account-logo'

interface AccountsRowProps {
  accounts: Account[]
}

const AccountsRow = ({ accounts }: AccountsRowProps) => {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      {<Avatar fallback={<PlusIcon onClick={() => console.log('add button clicked')}/>} />}
      {accounts.map((account) => (
        <div key={account.id} style={{ display: 'flex', flexDirection:'column', alignItems: 'center', gap: '4px' }}>
          <Avatar
            src={getAccountLogo(account.name)}
            fallback="A"
            alt={account.name}
            title={account.name}
            radius='full'
          />
            <span><strong>{account.balance.toLocaleString()}</strong></span>
        </div>
      ))}
    </div>
  )
}

export default AccountsRow
