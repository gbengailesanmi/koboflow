# API Documentation

This document provides comprehensive documentation for all API endpoints in the Consolidate Budget E2E application.

## Base URL

- **Development**: `http://localhost:3000`
- **Production**: `https://your-domain.com`

## Authentication

The application uses JWT-based session authentication. Users must be authenticated to access protected endpoints.

### Authentication Headers

```
Authorization: Bearer <jwt_token>
```

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/signup
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "customerId": "customer_123"
}
```

**Validation Rules:**
- `name`: Minimum 2 characters
- `email`: Valid email format
- `password`: Minimum 8 characters, must include letter, number, and special character

#### POST /api/auth/login
Authenticate existing user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "customerId": "customer_123"
}
```

#### POST /api/auth/logout
Logout current user and invalidate session.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Portfolio Endpoints

#### GET /api/portfolio
Get user's complete financial portfolio including accounts and transactions.

**Authentication Required**: Yes

**Query Parameters:**
- `customerId` (required): Customer identifier
- `limit` (optional): Number of transactions to return (default: 10)
- `offset` (optional): Offset for pagination (default: 0)

**Response:**
```json
{
  "accounts": {
    "accounts": [
      {
        "id": "account_123",
        "name": "Main Checking",
        "type": "CHECKING",
        "balances": {
          "booked": {
            "amount": {
              "value": {
                "unscaledValue": "150000",
                "scale": "2"
              },
              "currencyCode": "USD"
            }
          },
          "available": {
            "amount": {
              "value": {
                "unscaledValue": "149500",
                "scale": "2"
              },
              "currencyCode": "USD"
            }
          }
        },
        "identifiers": {
          "sortCode": {
            "code": "123456",
            "accountNumber": "12345678"
          }
        },
        "dates": {
          "lastRefreshed": "2024-01-15T10:30:00Z"
        },
        "financialInstitutionId": "bank_123",
        "customerSegment": "RETAIL"
      }
    ],
    "nextPageToken": "next_page_token"
  },
  "transactions": [
    {
      "id": "txn_123",
      "accountId": "account_123",
      "customerId": "customer_123",
      "unscaledValue": -2500,
      "scale": 2,
      "currencyCode": "USD",
      "descriptions": {
        "display": "Coffee Shop Purchase",
        "original": "COFFEE SHOP 123 MAIN ST"
      },
      "bookedDate": "2024-01-15T08:30:00Z",
      "identifiers": {
        "reference": "ref_123"
      },
      "types": ["PURCHASE"],
      "status": "BOOKED",
      "providerMutability": "MUTABLE"
    }
  ]
}
```

### Tink Integration Endpoints

#### GET /callback
Handle Tink OAuth callback and process authorization code.

**Authentication Required**: Yes

**Query Parameters:**
- `code` (required): Authorization code from Tink OAuth flow

**Response:**
- Redirects to dashboard on success
- Returns error JSON on failure

**Process Flow:**
1. Validates authorization code
2. Exchanges code for access token
3. Fetches account and transaction data from Tink
4. Stores data in local database
5. Redirects to user dashboard

### Account Management Endpoints

#### GET /api/accounts
Get all accounts for authenticated user.

**Authentication Required**: Yes

**Query Parameters:**
- `customerId` (required): Customer identifier
- `includeBalances` (optional): Include balance information (default: true)

**Response:**
```json
{
  "accounts": [
    {
      "id": "account_123",
      "name": "Main Checking",
      "type": "CHECKING",
      "balances": {
        "booked": {
          "amount": {
            "value": {
              "unscaledValue": "150000",
              "scale": "2"
            },
            "currencyCode": "USD"
          }
        }
      }
    }
  ],
  "total": 1
}
```

#### GET /api/accounts/:accountId
Get specific account details.

**Authentication Required**: Yes

**Path Parameters:**
- `accountId`: Account identifier

**Response:**
```json
{
  "id": "account_123",
  "name": "Main Checking",
  "type": "CHECKING",
  "balances": {
    "booked": {
      "amount": {
        "value": {
          "unscaledValue": "150000",
          "scale": "2"
        },
        "currencyCode": "USD"
      }
    },
    "available": {
      "amount": {
        "value": {
          "unscaledValue": "149500",
          "scale": "2"
        },
        "currencyCode": "USD"
      }
    }
  },
  "identifiers": {
    "sortCode": {
      "code": "123456",
      "accountNumber": "12345678"
    }
  },
  "financialInstitutionId": "bank_123"
}
```

### Transaction Endpoints

#### GET /api/transactions
Get transactions for authenticated user.

**Authentication Required**: Yes

**Query Parameters:**
- `customerId` (required): Customer identifier
- `accountId` (optional): Filter by specific account
- `limit` (optional): Number of transactions (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)
- `startDate` (optional): Filter transactions from date (ISO format)
- `endDate` (optional): Filter transactions to date (ISO format)
- `minAmount` (optional): Minimum transaction amount
- `maxAmount` (optional): Maximum transaction amount

**Response:**
```json
{
  "transactions": [
    {
      "id": "txn_123",
      "accountId": "account_123",
      "unscaledValue": -2500,
      "scale": 2,
      "currencyCode": "USD",
      "descriptions": {
        "display": "Coffee Shop Purchase",
        "original": "COFFEE SHOP 123 MAIN ST"
      },
      "bookedDate": "2024-01-15T08:30:00Z",
      "status": "BOOKED",
      "types": ["PURCHASE"]
    }
  ],
  "total": 1,
  "hasMore": false
}
```

#### GET /api/transactions/:transactionId
Get specific transaction details.

**Authentication Required**: Yes

**Path Parameters:**
- `transactionId`: Transaction identifier

**Response:**
```json
{
  "id": "txn_123",
  "accountId": "account_123",
  "customerId": "customer_123",
  "unscaledValue": -2500,
  "scale": 2,
  "currencyCode": "USD",
  "descriptions": {
    "display": "Coffee Shop Purchase",
    "original": "COFFEE SHOP 123 MAIN ST",
    "enriched": "Coffee & Beverages"
  },
  "bookedDate": "2024-01-15T08:30:00Z",
  "identifiers": {
    "reference": "ref_123",
    "providerTransactionId": "provider_txn_123"
  },
  "types": ["PURCHASE"],
  "status": "BOOKED",
  "providerMutability": "MUTABLE"
}
```

## Error Handling

All API endpoints follow consistent error response format:

### Error Response Format

```json
{
  "error": true,
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  }
}
```

### Common HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation errors
- `500 Internal Server Error`: Server error

### Common Error Codes

- `INVALID_CREDENTIALS`: Authentication failed
- `VALIDATION_ERROR`: Request validation failed
- `RESOURCE_NOT_FOUND`: Requested resource not found
- `TINK_API_ERROR`: Error from Tink API
- `DATABASE_ERROR`: Database operation failed
- `SESSION_EXPIRED`: User session has expired

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- **Authentication endpoints**: 5 requests per minute per IP
- **Data endpoints**: 100 requests per minute per user
- **Tink integration**: 10 requests per minute per user

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1609459200
```

## Data Format Standards

### Monetary Values

All monetary values use unscaled integers with scale information:

```json
{
  "amount": {
    "value": {
      "unscaledValue": "150000",  // $1,500.00
      "scale": "2"                // 2 decimal places
    },
    "currencyCode": "USD"
  }
}
```

### Dates

All dates are in ISO 8601 format with UTC timezone:
```
2024-01-15T08:30:00Z
```

### Identifiers

Account and transaction identifiers use provider-specific formats and are treated as opaque strings.

## Testing API Endpoints

### Using cURL

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get portfolio data
curl -X GET "http://localhost:3000/api/portfolio?customerId=customer_123" \
  -H "Authorization: Bearer <jwt_token>"
```

### Using JavaScript/Fetch

```javascript
// Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const data = await response.json();

// Get portfolio
const portfolioResponse = await fetch(`/api/portfolio?customerId=${customerId}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## Webhook Endpoints (Future)

*Note: Webhook functionality is planned for future implementation*

#### POST /api/webhooks/tink
Handle Tink webhook notifications for real-time data updates.

## API Versioning

Current API version is v1. Future versions will be supported through URL versioning:
- `/api/v1/` - Current version
- `/api/v2/` - Future version

## Support

For API support or questions, please:
1. Check this documentation
2. Review the troubleshooting guide
3. Open an issue on GitHub
4. Contact the development team