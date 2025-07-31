export function getAccountLogo(accountName: string): string {
  const ext = 'png'
  return `/bankLogos/${accountName.toLowerCase()}.${ext}`;
}
