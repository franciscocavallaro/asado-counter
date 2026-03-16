# Asado Counter 🔥

A minimalist web app to track your asados (Argentinian BBQs). Record meat cuts, weights, guests, and ratings for each asado. At the end of the year, see your "Asado Wrapped" with statistics!

## Features

- 📅 Register asados with date and rating (1-10)
- 🥩 Track meat cuts with weights (auto-complete from history)
- 📷 Scan product barcodes to auto-complete cut + weight
- 👥 Record guests who attended (auto-complete from history)
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
   - `migration-add-barcode-mappings.sql`
4. Go to Settings → API and copy your Project URL and anon key

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

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

Barcode scanner notes:
- Camera access requires HTTPS (Vercel provides this automatically in production).
- First-time scans are resolved against an external barcode catalog (Open Food Facts).
- If a product is found, the app auto-fills cut and (when available) package weight.

## License

MIT
