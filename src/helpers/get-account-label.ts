import type { Account } from '@/types/account'

function getAccountLabel(account: Account) {
  try {
    const accountNumber = account.identifiers?.sortCode?.accountNumber ?? 'UnknownAccNum'
    const accountBal = account.balance
    const formattedBal = Number(accountBal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

    return `${accountNumber} (${formattedBal})`
  } catch (error) {
    return `Unknown Account: ${error}`
  }
}

export { getAccountLabel }