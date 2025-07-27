import { useEffect } from 'react'
import { Avatar } from '@radix-ui/themes'
import { PlusIcon } from '@radix-ui/react-icons'
import type { Accounts } from '@/types/account'
import { getAccountLogo } from '@/helpers/get-account-logo'

type AccountsRowProps = {
  accounts: Accounts
}

const AccountsRow = ({ accounts }: AccountsRowProps) => {
  const accountsData = accounts.accounts
  useEffect(() => {
    console.log('Accoundsdsdsd', accounts)
  }, [accounts])

  const getBalance = (account: typeof accountsData[0]) => {
    const balanceObj = account.balances.booked?.amount || account.balances.available?.amount
    if (!balanceObj) return 0
    const { unscaledValue, scale } = balanceObj.value
    return Number(unscaledValue) * Math.pow(10, -Number(scale))
  }

  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <Avatar fallback={<PlusIcon onClick={() => console.log('add button clicked')} />} />
      {accountsData.map((account: any) => (
        <div key={account.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <Avatar
            src={getAccountLogo(account.name)}
            fallback="A"
            alt={account.name}
            title={account.name}
            radius="full"
          />
          <span>
            <strong>
              {getBalance(account).toLocaleString(undefined, {
                style: 'currency',
                currency: account.balances.booked?.amount.currencyCode || 'GBP',
                // minimumFractionDigits: 2,
                // maximumFractionDigits: 2,
              })}
            </strong>
          </span>
        </div>
      ))}
    </div>
  )
}

export default AccountsRow
