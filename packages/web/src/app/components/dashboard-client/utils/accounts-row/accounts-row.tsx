import React, { Fragment } from 'react'
import { Avatar, Separator } from '@radix-ui/themes'
import { PlusIcon } from '@radix-ui/react-icons'
import type { Account } from '@/types/account'
import * as Styled from './styles'
// import { getAccountLogo } from '@/helpers/get-account-logo'

type AccountsRowProps = {
  accounts: Account[]
  onAccountSelect?: (accountUniqueId: string) => void
}

const AccountsRow = ({ accounts, onAccountSelect }: AccountsRowProps) => {
  return (
    <div style={{ display: 'flex', gap: 5}}>
      <Styled.Button
        size="4"
        variant="soft"
        // color="gray"
        onClick={() => window.open(process.env.NEXT_PUBLIC_ADD_ACCOUNT_URL, '_blank')}
        >
        <PlusIcon />
      </Styled.Button>

      {accounts.map((account) => (
        <Fragment key={account.uniqueId}>
        <Separator orientation="vertical" color="indigo" size="3" />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <Styled.Button size="4" variant="soft" color="gray" onClick={() => {onAccountSelect && onAccountSelect(account.uniqueId)}}>
            <Avatar fallback='A' 
                src='https://media.licdn.com/dms/image/v2/D4E03AQGKackdOrVWWA/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1693591947730?e=1755734400&v=beta&t=-61IzpZRRGgQ1LSxu1LtkUXnwRZLrbPmBhVpTy6RhzY' 
        />
            </Styled.Button>
          <span style={{ fontSize: '0.8rem' }}>
            <strong>
              {Number(account.balance).toLocaleString(undefined, {
                style: 'currency',
                currency: account.bookedCurrency || account.availableCurrency,
              })}
            </strong>
          </span>
        </div>
        </Fragment>
      ))}
    </div>
  )
}

export default AccountsRow
