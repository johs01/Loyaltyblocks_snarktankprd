# LoyaltyBlocks

Multi-tenant SaaS platform for customer database and loyalty program management.

## Project Status

**Phase 0: Project Setup** ✅ Complete

## Technology Stack

- **Frontend:** Next.js 15+ (App Router), React 19, TypeScript, Tailwind CSS
- **Backend:** Next.js API routes, Node.js
- **Authentication:** Clerk
- **Database:** Neon PostgreSQL with Prisma ORM
- **Phone Handling:** libphonenumber-js
- **Testing:** Jest with React Testing Library

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Neon recommended)
- Clerk account for authentication

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Loyaltyblocks_snarktankprd
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your:
- Clerk API keys (from https://dashboard.clerk.com)
- Neon PostgreSQL connection string

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Development Commands

```bash
npm run dev              # Start development server
npm run build           # Create production build
npm start               # Run production server
npm run lint            # Run ESLint
npm test                # Run Jest tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate test coverage report
```

## Database Commands

```bash
npm run prisma:migrate  # Create and apply database migrations
npm run prisma:generate # Generate Prisma client types
npm run prisma:seed     # Seed database with test data
npm run prisma:studio   # Open Prisma Studio (database GUI)
```

## Project Structure

```
├── app/                    # Next.js App Router pages and layouts
├── components/             # Reusable React components
├── lib/                    # Utilities and helpers
│   ├── validation/        # Validation logic
│   ├── middleware/        # Custom middleware (RBAC, etc.)
│   └── database/          # Database query helpers
├── prisma/                # Database schema and migrations
├── types/                 # TypeScript type definitions
├── public/                # Static assets
└── tasks/                 # Project requirements and task list
```

## Architecture

### Multi-Tenant Design

LoyaltyBlocks uses path-based multi-tenancy where all routes follow the pattern:
```
/[tenantId]/[route]
```

Every database table includes a `tenant_id` column to ensure complete data isolation between tenants.

### Key Features (Planned)

- ✅ Phase 0: Project Setup
- ⏳ Phase 1: Multi-Tenant Architecture & Database
- ⏳ Phase 2: Public Customer Registration
- ⏳ Phase 3: Admin Dashboard & User Management
- ⏳ Phase 4: Customer Database Management
- ⏳ Phase 5: Settings & Configuration
- ⏳ Phase 6: Testing & Quality Assurance
- ⏳ Phase 7: Documentation & Deployment

## Contributing

See [CLAUDE.md](./CLAUDE.md) for development guidelines and architecture details.

See [tasks/tasks-loyaltyblocks-mvp.md](./tasks/tasks-loyaltyblocks-mvp.md) for the complete task breakdown.

## Documentation

- [Product Requirements Document](./tasks/prd-loyaltyblocks-mvp.md)
- [Implementation Task List](./tasks/tasks-loyaltyblocks-mvp.md)
- [Development Guidelines](./CLAUDE.md)

## License

Private - All Rights Reserved
