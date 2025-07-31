# Consolidate Budget E2E

A comprehensive financial consolidation platform that integrates with Tink API to provide users with a unified view of their financial accounts and transactions. Built with Next.js, PostgreSQL, and modern web technologies.

## 🌟 Features

- **🔐 Secure Authentication**: User registration and login with JWT session management
- **💰 Account Aggregation**: Connect multiple bank accounts through Tink API integration
- **📊 Transaction Management**: View and manage transactions across all connected accounts
- **🎨 Modern UI**: Responsive design with Tailwind CSS and Radix UI components
- **🏦 Multi-Bank Support**: Support for various financial institutions through Tink
- **🔄 Real-time Data**: Automatic data refresh and synchronization
- **📱 Mobile Responsive**: Optimized for both desktop and mobile devices

## 🏗️ Architecture

This application follows a modern full-stack architecture:

- **Frontend**: Next.js 15 with React 19, TypeScript, and Tailwind CSS
- **Backend**: Next.js API routes for server-side functionality
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: JWT-based session management with bcrypt password hashing
- **External API**: Tink API integration for financial data aggregation
- **State Management**: React hooks and local state management
- **Styling**: Tailwind CSS with Radix UI components and custom styled-components

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Yarn package manager
- PostgreSQL database
- Tink API credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/gbengailesanmi/consolidate-budget-e2e.git
   cd consolidate-budget-e2e
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in the required environment variables (see [Environment Configuration](#environment-configuration))

4. **Set up the database**
   ```bash
   # Push database schema
   yarn db:schema
   
   # Open Drizzle Studio for database management
   yarn db:check
   ```

5. **Start the development server**
   ```bash
   yarn dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Environment Configuration

Create a `.env.local` file in the root directory with the following variables:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/consolidate_budget"

# Tink API Configuration
TINK_CLIENT_ID="your_tink_client_id"
TINK_CLIENT_SECRET="your_tink_client_secret"

# Application Configuration
BASE_URI="http://localhost"
PORT="3000"

# Session Configuration
SESSION_SECRET="your_secure_session_secret"

# Next.js Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_nextauth_secret"
```

## 📝 Available Scripts

- `yarn dev` - Start development server
- `yarn build` - Build production application
- `yarn start` - Start production server
- `yarn lint` - Run ESLint
- `yarn db:schema` - Push database schema to PostgreSQL
- `yarn db:check` - Open Drizzle Studio for database management

## 🗄️ Database Schema

The application uses three main tables:

### Users Table
- `id` - Primary key (serial)
- `name` - User's full name
- `email` - Unique email address
- `password` - Hashed password
- `customerId` - Unique customer identifier

### Accounts Table
- `id` - Primary key (varchar)
- `customerId` - Foreign key to users
- `name` - Account name
- `type` - Account type (checking, savings, etc.)
- `bookedAmount/bookedScale/bookedCurrency` - Booked balance information
- `availableAmount/availableScale/availableCurrency` - Available balance information
- `identifiers` - JSON field with account identifiers
- `lastRefreshed` - Last data refresh timestamp
- `financialInstitutionId` - Bank/institution identifier
- `customerSegment` - Customer segment classification

### Transactions Table
- `id` - Primary key (varchar)
- `accountId` - Foreign key to accounts
- `customerId` - Foreign key to users
- `unscaledValue/scale` - Transaction amount information
- `currencyCode` - Transaction currency
- `descriptions` - JSON field with transaction descriptions
- `bookedDate` - Transaction date
- `identifiers` - JSON field with transaction identifiers
- `types` - JSON field with transaction types
- `status` - Transaction status
- `providerMutability` - Provider mutability settings

## 🔄 Application Flow

1. **User Registration/Login**: Users create accounts or log in through secure authentication
2. **Tink Integration**: Users connect their bank accounts through Tink's OAuth flow
3. **Data Synchronization**: Financial data is fetched from Tink API and stored locally
4. **Dashboard View**: Users view their consolidated financial information
5. **Real-time Updates**: Data is periodically refreshed to maintain accuracy

## 🛠️ Development

### Code Structure

```
src/
├── app/                    # Next.js app directory
│   ├── [customerId]/      # Dynamic customer routes
│   │   └── dashboard/     # Customer dashboard
│   ├── api/               # API routes
│   ├── auth/              # Authentication logic
│   ├── components/        # Reusable UI components
│   ├── forms/             # Form components
│   ├── login/             # Login page
│   └── signup/            # Signup page
├── helpers/               # Utility functions
├── hooks/                 # Custom React hooks
├── lib/                   # Library functions and configurations
├── mocks/                 # Mock data for development
└── types/                 # TypeScript type definitions
```

### Key Components

- **Header/Footer**: Navigation and branding components
- **AccountsRow**: Horizontal scrollable account cards
- **TransactionsColumn**: Vertical transaction list
- **Forms**: Login and signup form components
- **DragHeight**: Custom hook for resizable UI elements

## 🔌 API Integration

### Tink API Integration

The application integrates with Tink's API for financial data:

- **OAuth Flow**: Secure bank account connection
- **Account Data**: Fetches account balances and information
- **Transaction Data**: Retrieves transaction history
- **Real-time Sync**: Periodic data updates

### Internal API Routes

- `GET /api/portfolio` - Fetch user's portfolio data
- `GET /callback` - Handle Tink OAuth callback
- Authentication APIs for user management

## 🚢 Deployment

### Vercel Deployment (Recommended)

1. **Connect to Vercel**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel
   ```

2. **Configure Environment Variables**
   Add all environment variables in Vercel dashboard

3. **Set up Database**
   Use a cloud PostgreSQL provider (e.g., Supabase, Railway, or Vercel Postgres)

### Docker Deployment

```dockerfile
# Dockerfile example
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

EXPOSE 3000
CMD ["yarn", "start"]
```

## 🧪 Testing

While the application doesn't currently include tests, here's the recommended testing structure:

- **Unit Tests**: Component and function testing with Jest
- **Integration Tests**: API route testing
- **E2E Tests**: Full user flow testing with Playwright
- **Database Tests**: Schema and query testing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use ESLint configuration
- Write meaningful commit messages
- Add JSDoc comments for complex functions
- Ensure responsive design
- Test across different browsers

## 🔒 Security

- Passwords are hashed using bcrypt
- JWT sessions with secure configuration
- Environment variables for sensitive data
- Input validation using Zod schemas
- HTTPS in production (recommended)

## 📚 Additional Documentation

For more detailed documentation, see the `docs/` folder:

- [API Documentation](docs/API.md)
- [Database Schema](docs/DATABASE.md)
- [Component Documentation](docs/COMPONENTS.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify PostgreSQL is running
   - Check DATABASE_URL environment variable
   - Ensure database exists and is accessible

2. **Tink API Issues**
   - Verify Tink credentials
   - Check redirect URI configuration
   - Ensure proper OAuth flow setup

3. **Build Issues**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify all environment variables are set

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Tink](https://tink.com/) - Financial data aggregation
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Radix UI](https://www.radix-ui.com/) - UI component library
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM

## 📞 Support

For support, please open an issue on GitHub or contact the development team.

---

**Built with ❤️ by the Consolidate Budget team**
