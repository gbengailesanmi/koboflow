declare module '@mono.co/connect.js' {
  interface MonoConnectConfig {
    key: string
    scope?: 'auth' | 'reauth'
    data?: {
      customer?: {
        id?: string
        name?: string
        email?: string
        identity?: {
          type: 'bvn'
          number: string
        }
      }
    }
    onSuccess: (data: { code: string }) => void
    onClose?: () => void
    onLoad?: () => void
    onEvent?: (eventName: string, data: any) => void
    reference?: string
  }

  interface SetupConfig {
    selectedInstitution?: {
      id: string
      auth_method: 'internet_banking' | 'mobile_banking'
    }
  }

  class MonoConnect {
    constructor(config: MonoConnectConfig)
    setup(config?: SetupConfig): void
    open(): void
    close(): void
    reauthorise(accountId: string): void
  }

  export default MonoConnect
}
