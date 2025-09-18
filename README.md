# CopyBot - AI-Powered Email Copy Generator

CopyBot is an intelligent email copy generation platform designed for marketing agencies. It integrates with Airtable for campaign management, uses Supabase for data storage, and leverages Claude AI for generating high-converting email copy.

## 🚀 Features

### Core Functionality
- **AI Copy Generation**: Claude-powered email copy creation using client context
- **Client Management**: Store brand questionnaires, notes, and preferences
- **Airtable Integration**: Sync campaigns and push generated copy back
- **Website Scraping**: Extract brand voice and content from client websites
- **Campaign Management**: Organize email campaigns and copy versions

### Email Copy Types
- Promotional campaigns
- Welcome sequences
- Nurture flows  
- Abandoned cart emails
- Newsletters
- Transactional emails

## 🏗️ Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + TailwindCSS
- **Backend**: Next.js API Routes + Server Actions
- **Database**: Supabase (PostgreSQL + Auth + Real-time)
- **AI**: Claude 3.5 Sonnet (Anthropic)
- **Integrations**: Airtable API, Playwright (web scraping)
- **Deployment**: Vercel
- **Styling**: TailwindCSS + Radix UI components

## 📁 Project Structure

```
copybot/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication pages
│   │   ├── dashboard/         # Main dashboard & pages
│   │   ├── campaigns/         # Campaign management
│   │   ├── clients/           # Client management
│   │   └── api/               # API routes
│   ├── components/            # Reusable UI components
│   │   ├── ui/               # Base UI components
│   │   └── forms/            # Form components
│   ├── lib/                   # Core utilities & services
│   │   ├── supabase.ts       # Database client & operations
│   │   ├── claude.ts         # AI copy generation
│   │   ├── airtable.ts       # Airtable integration
│   │   └── scraper.ts        # Web scraping utilities
│   ├── types/                 # TypeScript definitions
│   │   ├── index.ts          # Main types
│   │   └── database.ts       # Supabase types
│   └── utils/                 # Helper functions
├── supabase/
│   └── migrations/           # Database migrations
└── docs/                     # Documentation
```

## 🛠️ Setup Instructions

### 1. Prerequisites
- Node.js 18+ and npm
- Supabase account
- Anthropic API key (Claude)
- Airtable account & API key

### 2. Installation

```bash
# Clone the repository
git clone <repository-url>
cd copybot

# Install dependencies  
npm install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Claude API
ANTHROPIC_API_KEY=your_claude_api_key

# Airtable  
AIRTABLE_API_KEY=your_airtable_api_key
AIRTABLE_BASE_ID=your_airtable_base_id

# Next.js
NEXTAUTH_SECRET=your_random_secret_key
NEXTAUTH_URL=http://localhost:3000
```

### 4. Database Setup

1. Create a new Supabase project
2. Run the database migration:

```bash
# Apply the database schema
supabase db push
```

Or manually run the SQL in `supabase/migrations/001_initial_schema.sql` in your Supabase SQL editor.

### 5. Airtable Setup

1. Create an Airtable base with a "Campaigns" table
2. Ensure your table has these fields:
   - Campaign Name (Single line text)
   - Client Name (Single line text)
   - Status (Single select: Draft, In Progress, Completed, Archived)
   - Deadline (Date)
   - Campaign Brief (Long text)
   - Campaign Type (Single select)
   - Priority (Single select)

### 6. Run the Application

```bash
# Development server
npm run dev

# Build for production
npm run build
npm run start
```

Visit `http://localhost:3000` to see the application.

## 📊 Database Schema

### Core Tables

**clients**
- Client information and brand questionnaires
- Website URLs for scraping
- User associations with RLS

**campaigns** 
- Campaign details synced from Airtable
- Campaign briefs and context
- Status tracking and deadlines

**email_copy**
- Generated email copy versions
- Subject lines, preview text, and body
- Copy type categorization and performance notes

**client_notes**
- Freeform client insights and preferences  
- Categorized notes (insight, preference, feedback, general)

**scraped_content**
- Website content extraction
- Content categorization and freshness tracking

## 🎯 Key Features Implementation

### AI Copy Generation
The `ClaudeService` class in `src/lib/claude.ts` handles:
- Context assembly from client data, campaigns, and notes
- Structured prompt engineering for consistent output
- Multiple copy variations and subject line testing
- Copy optimization based on feedback

### Airtable Integration  
The `AirtableService` class provides:
- Campaign synchronization
- Webhook handling for real-time updates
- Field mapping configuration
- Bidirectional data flow

### Database Operations
The `DatabaseService` class offers:
- Type-safe database operations
- Row Level Security (RLS) enforcement  
- Efficient querying with joins
- Real-time subscriptions capability

## 🚀 Deployment

### Vercel Deployment

1. Connect your repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on git push

### Environment Variables for Production

Make sure to set all environment variables in your Vercel project settings, replacing localhost URLs with production URLs.

## 📝 Development Workflow

### Phase 1 (Current - MVP)
- ✅ Project setup and configuration
- ✅ Database schema and migrations  
- ✅ Core service integrations (Claude, Airtable, Supabase)
- ✅ Basic UI layout and dashboard
- ⏳ Campaign and client CRUD operations
- ⏳ Basic copy generation functionality

### Phase 2 (Next Steps)
- Client management UI with brand questionnaires
- Website scraping implementation
- Advanced copy generation with context
- Copy version management and comparison
- Airtable webhook integration

### Phase 3 (Advanced)
- Real-time collaboration features
- Performance analytics and insights
- Custom AI training/fine-tuning
- Advanced workflow automation
- Comprehensive reporting dashboard

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is private and proprietary.

## 🐛 Known Issues

- Environment variable template needs to be created manually
- Airtable field mapping may need customization based on your setup
- Web scraping functionality not yet implemented
- Authentication system needs to be connected

## 🔗 Useful Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Claude API Documentation](https://docs.anthropic.com/)
- [Airtable API Documentation](https://airtable.com/developers/web/api/introduction)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)

---

**Need help?** Open an issue or check the documentation links above.# Trigger fresh Vercel deployment
