import { Avatar } from '@radix-ui/themes'
import { PlusIcon } from '@radix-ui/react-icons'
import type { Account } from '@/types/account'
import { getAccountLogo } from '@/helpers/get-account-logo'
// import useBaseUrl from '@/hooks/use-base-url'

type AccountsRowProps = {
  accounts: Account[]
}

const AccountsRow = ({ accounts }: AccountsRowProps) => {
  return (
    <>
    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
      <Avatar
        fallback={
          <PlusIcon
            onClick={() =>
              window.open(
                `https://link.tink.com/1.0/transactions/connect-accounts/?client_id=c2296ba610e54fda8a7769872888a1f6&redirect_uri=${encodeURIComponent(`${process.env.NEXT_PUBLIC_BASE_URL}/api/callback`)}&market=GB&locale=en_US`,
                '_blank'
              )
            }
            style={{ cursor: 'pointer' }}
          />
        }
      />
      {accounts.map((account) => (
        <div
          key={account.id}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
        >
          <Avatar
            src={getAccountLogo(account.name)}
            fallback="A"
            alt={account.name}
            title={account.name}
            radius="full"
          />
          <span>
            <strong>
              {Number(account.balance).toLocaleString(undefined, {
                style: 'currency',
                currency: account.bookedCurrency || account.availableCurrency,
              })}
            </strong>
          </span>
        </div>
      ))}
    </div>
    </>
  )
}

export default AccountsRow
