type Accounts = {
  accounts: any[]
  nextPageToken?: string
}

export const accountsMock: Accounts = {
  "accounts": [
    {
      "id": "986ef4a5f8464a5db2c9db23c131adc7",
      "name": "Savings Account",
      "type": "SAVINGS",
      "balances": {
        "booked": {
          "amount": {
            "value": {
              "unscaledValue": "124",
              "scale": "-2"
            },
            "currencyCode": "GBP"
          }
        },
        "available": {
          "amount": {
            "value": {
              "unscaledValue": "124",
              "scale": "-2"
            },
            "currencyCode": "GBP"
          }
        }
      },
      "identifiers": {
        "sortCode": {
          "code": "987106",
          "accountNumber": "06527609"
        },
        "financialInstitution": {
          "accountNumber": "9871066527609",
          "referenceNumbers": {}
        }
      },
      "dates": {
        "lastRefreshed": "2025-07-24T17:59:55Z"
      },
      "financialInstitutionId": "85fda619bbdc40369502ec3f792ae644",
      "customerSegment": "PERSONAL"
    },
    {
      "id": "77319513a22f4d438486aee9833f0504",
      "name": "Current Account",
      "type": "CHECKING",
      "balances": {
        "booked": {
          "amount": {
            "value": {
              "unscaledValue": "210109",
              "scale": "2"
            },
            "currencyCode": "GBP"
          }
        },
        "available": {
          "amount": {
            "value": {
              "unscaledValue": "206693",
              "scale": "2"
            },
            "currencyCode": "GBP"
          }
        }
      },
      "identifiers": {
        "iban": {
          "iban": "GB39YGDH90153671247781",
          "bban": "YGDH90153671247781"
        },
        "sortCode": {
          "code": "987106",
          "accountNumber": "07897654"
        },
        "financialInstitution": {
          "accountNumber": "9871067897654",
          "referenceNumbers": {}
        }
      },
      "dates": {
        "lastRefreshed": "2025-07-24T17:59:55Z"
      },
      "financialInstitutionId": "85fda619bbdc40369502ec3f792ae644",
      "customerSegment": "PERSONAL"
    }
  ],
  "nextPageToken": ""
}
