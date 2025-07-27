export type Transaction = {
  id: string;
  accountId: string;
  amount: {
    value: {
      unscaledValue: string;
      scale: string;
    };
    currencyCode: string;
  };
  descriptions: {
    original: string;
    display: string;
  };
  dates: {
    booked: string;
  };
  identifiers: {
    providerTransactionId: string;
  };
  types: {
    type: string;
  };
  status: string;
  providerMutability: string;
};

export type TransactionsType = {
  transactions: Transaction[];
};