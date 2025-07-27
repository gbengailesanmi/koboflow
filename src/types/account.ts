export type Accounts = {
  accounts: Account[];
  nextPageToken: string;
};

export type Account = {
  id: string;
  name: string;
  type: string;
  balances: {
    booked: BalanceDetail;
    available: BalanceDetail;
  };
  identifiers: {
    sortCode?: SortCodeIdentifier;
    financialInstitution?: FinancialInstitutionIdentifier;
    iban?: IbanIdentifier;
  };
  dates: {
    lastRefreshed: string;
  };
  financialInstitutionId: string;
  customerSegment: string;
};

export type BalanceDetail = {
  amount: {
    value: {
      unscaledValue: string;
      scale: string;
    };
    currencyCode: string;
  };
};

export type SortCodeIdentifier = {
  code: string;
  accountNumber: string;
};

export type FinancialInstitutionIdentifier = {
  accountNumber: string;
  referenceNumbers: Record<string, unknown>;
};

export type IbanIdentifier = {
  iban: string;
  bban: string;
};