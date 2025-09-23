# Money-Mapper

Money-Mapper is a small mobile-first personal finance fullstack app built with Next.js (app router). It pulls account and transaction data (current dev integration with Tink), stores data in MongoDB, and provides client UI components for browsing accounts and transactions.

### Key Tech & Integrations
- Next.js (see [package.json](package.json))
- MongoDB driver (see [`connectDB`](src/db/mongo.js))
- Tink integration (see [`getTinkTokens`](src/app/api/tink.js), [`getTinkAccountsData`](src/app/api/tink.js), [`getTinkTransactionsData`](src/app/api/tink.js))

### App Features

The eventual scope of the app features:

- A landing dashbaord page
- Transactions
- Spending and Budget
- Switching Plans, Deals, etc

### Quickstart

Prerequisites
- Node version in [.nvmrc](.nvmrc)
- MongoDB connection string & other details
- IP whitelisting on MongoDB Atlas
- Tink key, secret, and connection string

Environment
Create a .env.local with at least:

```bash
TINK_CLIENT_ID
TINK_CLIENT_SECRET
SESSION_SECRET
BASE_URI="http://localhost"
PORT=3000
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
NEXT_PUBLIC_ADD_ACCOUNT_URL
MONGODB_URI
MONGO_DB_NAME
```
## How to Run this App

1. First, run the development server:

```bash
yarn dev
```

2. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

That's all you need to do.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
