# Documentation Index

Welcome to the Consolidate Budget E2E documentation! This index provides an overview of all available documentation to help you understand, develop, deploy, and maintain the application.

## 📖 Getting Started

Start here if you're new to the project:

1. **[README.md](../README.md)** - Project overview, quick start guide, and essential information
2. **[Environment Configuration](ENVIRONMENT.md)** - Set up environment variables and configuration
3. **[Development Guide](DEVELOPMENT.md)** - Development workflows, coding standards, and best practices

## 🏗️ Architecture & Technical Documentation

Deep dive into the technical aspects:

- **[Database Schema](DATABASE.md)** - Complete database documentation with ERD and table descriptions
- **[API Documentation](API.md)** - All API endpoints with examples and response formats
- **[Component Documentation](COMPONENTS.md)** - React components, props, and usage examples

## 🚀 Deployment & Operations

Production deployment and maintenance:

- **[Deployment Guide](DEPLOYMENT.md)** - Step-by-step deployment instructions for various platforms
- **[Troubleshooting Guide](TROUBLESHOOTING.md)** - Common issues and debugging techniques

## 🤝 Contributing

Information for contributors:

- **[Contributing Guidelines](../CONTRIBUTING.md)** - How to contribute to the project
- **[Development Guide](DEVELOPMENT.md)** - Detailed development practices and standards

## 📋 Quick Reference

### Essential Commands

```bash
# Development
yarn dev              # Start development server
yarn build            # Build for production
yarn lint             # Run linting
yarn type-check       # TypeScript checking

# Database
yarn db:schema        # Push database schema
yarn db:check         # Open Drizzle Studio

# Environment
cp .env.example .env.local  # Create environment file
```

### Key Technologies

- **Framework**: Next.js 15 with React 19
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS + Radix UI
- **Authentication**: JWT sessions with bcrypt
- **API Integration**: Tink API for financial data
- **Language**: TypeScript

### Directory Structure

```
consolidate-budget-e2e/
├── docs/                    # Documentation files
├── drizzle/                 # Database schema
├── public/                  # Static assets
├── src/
│   ├── app/                 # Next.js app directory
│   ├── components/          # Reusable components
│   ├── lib/                 # Utilities and configurations
│   ├── types/               # TypeScript definitions
│   └── hooks/               # Custom React hooks
├── README.md                # Project overview
├── CONTRIBUTING.md          # Contribution guidelines
└── .env.example             # Environment template
```

## 📚 External Resources

### Next.js Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js Learn](https://nextjs.org/learn)
- [Next.js Examples](https://github.com/vercel/next.js/tree/canary/examples)

### Database Resources
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Drizzle Studio](https://orm.drizzle.team/drizzle-studio/overview)

### API Integration
- [Tink Documentation](https://docs.tink.com/)
- [Tink Console](https://console.tink.com/)
- [Tink API Reference](https://docs.tink.com/api/)

### UI/UX Resources
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com/docs)
- [React Documentation](https://react.dev/)

## 🆘 Getting Help

If you need help:

1. **Check Documentation**: Start with relevant documentation sections
2. **Search Issues**: Look through existing GitHub issues
3. **Troubleshooting Guide**: Check the [troubleshooting guide](TROUBLESHOOTING.md)
4. **Create Issue**: If you can't find an answer, create a new issue
5. **Community Support**: Reach out on community channels

## 📝 Documentation Maintenance

This documentation is actively maintained. If you find:

- Outdated information
- Missing details
- Unclear instructions
- Broken links

Please:

1. Create an issue describing the problem
2. Submit a pull request with improvements
3. Suggest new documentation topics

## 🔄 Updates and Changelog

Documentation is versioned alongside the codebase. Major changes to documentation are noted in:

- Git commit history
- Pull request descriptions
- Release notes

## 📞 Contact

For questions about the documentation:

- Create a GitHub issue with the `documentation` label
- Reach out to project maintainers
- Join project discussions

---

**Last Updated**: January 2024  
**Documentation Version**: 1.0.0

Thank you for using Consolidate Budget E2E! 🎉