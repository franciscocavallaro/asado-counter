# Asado Counter 🔥

A minimalist web app to track your asados (Argentinian BBQs). Record meat cuts, weights, guests, and collect ratings through an in-app public voting page for each asado. At the end of the year, see your "Asado Wrapped" with statistics!

## Features

- 📅 Register asados with date and details
- 🥩 Track meat cuts with weights (auto-complete from history)
- 👥 Record guests who attended (auto-complete from history)
- 🗳️ Public vote page per asado (`/vote/:asadoId`)
- ⭐ Live rating average from votes
- 🔒 Protected admin pages with password login
- 📊 Year-end wrapped with stats:
  - Total kg of meat
  - Total asados
  - Unique guests
  - Average rating
  - Top cuts ranking
  - Top guests ranking

## Tech Stack

- **Next.js 14** with App Router
- **Supabase** for database
- **shadcn/ui** for components
- **Tailwind CSS** for styling
- **TypeScript** throughout

## Setup

### 1. Clone and install dependencies

```bash
cd asado-counter
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor and run the contents of `supabase-schema.sql`
3. If your project is already running, also execute:
   - `migration-add-title.sql`
   - `migration-add-location.sql`
   - `migration-add-asado-votes.sql`
   - `migration-make-rating-nullable.sql`
4. Go to Settings → API and copy your Project URL and anon key

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
ADMIN_ACCESS_PASSWORD=your_admin_password
```

If `ADMIN_ACCESS_PASSWORD` is empty, admin protection is disabled.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add the environment variables in Vercel's project settings
4. Deploy!

## License

MIT
