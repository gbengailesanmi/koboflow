export type Transaction = {
    id: string;
    accountUniqueId: string;
    accountId: string;
    customerId: string;
    amount: string;
    unscaledValue: number;
    scale: number;
    narration: string;
    currencyCode: string;
    descriptions: any;
    bookedDate: Date;
    identifiers: any;
    types: any;
    status: string;
    providerMutability: string;
};
//# sourceMappingURL=transaction.d.ts.map