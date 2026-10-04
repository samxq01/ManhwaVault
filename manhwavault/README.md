# ManhwaVault

ManhwaVault is a premium, personal digital library and reading-progress tracker designed specifically for Manhwa, Manga, Manhua, and Webtoons. It embraces a sophisticated **"Midnight Library"** aesthetic—featuring deep ink backgrounds, cinematic covers, and warm ivory typography—to create a tactile and elegant reading journal experience.

> **Disclaimer**: ManhwaVault is strictly a progress tracker and personal journal. It is NOT a reader application and does not host, scrape, or distribute copyrighted chapters or images.

---

## Features

- **Premium Editorial Interface**: A completely custom, responsive UI built with Tailwind CSS, ditching generic SaaS dashboards for an immersive, cinematic digital archive look.
- **Lightning-Fast Quick Updates**: A dedicated, keyboard-accessible screen (`Q`) designed to update chapter progress in less than two seconds.
- **Cinematic Library**: A visually rich grid prioritizing high-quality cover art, with subtle 3D hover interactions and inline chapter controls.
- **Reading History Journal**: A timeline-based history log that automatically records when and what you read.
- **Insightful Statistics**: Track your reading habits with elegant charts, library distribution metrics, and reading velocity (chapters per week).
- **Offline & PWA Support**: Installable as a Progressive Web App (PWA) with built-in network status indicators.
- **Data Portability**: Full JSON backup and restore functionality, plus CSV exports for your library.
- **Complete Privacy**: Powered by Supabase Row Level Security (RLS) ensuring your library is entirely private to your account.

---

## Tech Stack

**Frontend:**
- [React 19](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) (Midnight Library aesthetic)
- [React Router v7](https://reactrouter.com/)
- [Lucide React](https://lucide.dev/) (Icons)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)

**Backend (BaaS):**
- [Supabase](https://supabase.com/)
- PostgreSQL (Database)
- Supabase Auth (User Authentication)
- Supabase Storage (Cover Image Hosting)
- Supabase RLS (Row Level Security)

---

## Architecture

ManhwaVault follows a standard Single Page Application (SPA) architecture interacting directly with a Backend-as-a-Service (BaaS).

1. **Presentation Layer**: React components organized by domains (`pages/`, `components/`, `layouts/`).
2. **State & Context**: React Context API handles global states like Authentication (`AuthContext`) and Toasts (`ToastContext`).
3. **Service Layer**: Abstraction classes (`services/`) that encapsulate Supabase SDK calls (e.g., `manhwaService.ts`, `historyService.ts`).
4. **Data Layer**: Supabase PostgreSQL database accessed directly from the client securely via Row Level Security (RLS) policies.

---

## Folder Structure

```text
manhwavault/
├── public/                 # Static assets (PWA icons, manifest)
├── src/
│   ├── assets/             # Images and global styles
│   ├── components/         # Reusable UI components (CoverImage, ChapterControls, etc.)
│   ├── contexts/           # React Context providers (Auth, Toast)
│   ├── hooks/              # Custom React hooks (useNetworkStatus, useInstallPrompt)
│   ├── layouts/            # Application shells (AppLayout)
│   ├── lib/                # Utility configurations (Supabase client)
│   ├── pages/              # Route-level components (Dashboard, Library, QuickUpdate)
│   ├── services/           # API interaction layer (manhwa, history, tags, backup)
│   ├── types/              # TypeScript interfaces and definitions
│   ├── utils/              # Helper functions
│   ├── App.tsx             # Root component and Routing
│   ├── index.css           # Global Tailwind and custom base styles
│   └── main.tsx            # Application entry point
├── .env.example            # Example environment variables
├── package.json            # Project dependencies and scripts
├── tailwind.config.js      # Tailwind configuration and theme extensions
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite bundler configuration (includes PWA setup)
```

---

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/manhwavault.git
   cd manhwavault
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   See the [Environment Variables](#environment-variables) section below.

4. **Start the development server:**
   ```bash
   npm run dev
   ```

---

## Environment Variables

Copy the `.env.example` file to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in the required Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> **Important**: Never expose your Supabase Service Role Key in `.env.local` or commit it to version control.

---

## Supabase Setup

### Database

ManhwaVault requires the following tables:

1. `manhwas`: Stores title, alternative_title, description, cover_url, status, total_chapters, current_chapter, rating, and user_id.
2. `reading_history`: Tracks progress over time (manhwa_id, user_id, previous_chapter, new_chapter, created_at).
3. `tags`: User-defined categories (id, user_id, name).
4. `manhwa_tags`: Junction table connecting manhwas to tags.

### Authentication

1. Go to your Supabase Dashboard -> Authentication.
2. Enable **Email/Password** sign-in.
3. Configure your Site URL in the Authentication settings (e.g., `http://localhost:5173` for local development).

### Row Level Security (RLS)

RLS is strictly enforced. Every table must have policies ensuring users can only `SELECT`, `INSERT`, `UPDATE`, and `DELETE` rows where `user_id = auth.uid()`.

Example RLS Policy for `manhwas`:
```sql
CREATE POLICY "Users can only access their own manhwas"
ON manhwas FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

### Storage

1. Create a public storage bucket named `covers`.
2. Apply RLS policies to allow authenticated users to upload and delete images where the path contains their `user_id`.

---

## Development

- **Linting**: Ensure code quality by running `npm run lint`.
- **Typing**: The project strictly uses TypeScript. Avoid using `any`.
- **Styling**: Tailwind CSS is used extensively. Stick to the "Midnight Library" aesthetic (avoid standard vibrant primary colors; utilize `bg-background`, `bg-surface`, `text-accent`, etc.).

---

## Testing

Currently, manual testing is required before claiming a feature is complete. 
*Always verify:*
1. Responsive design across Desktop, Tablet, and Mobile views.
2. Network resilience (offline behavior and error handling).
3. Accessibility (keyboard navigation on the Quick Update screen).

---

## Deployment

ManhwaVault is optimized for deployment on **Vercel**:

1. Push your code to GitHub.
2. Import the repository into Vercel.
3. Add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the Vercel Environment Variables.
4. Deploy. Vercel will automatically detect the Vite framework and build the app using `npm run build`.

---

## Backup

The application includes a comprehensive Backup & Restore system built directly into the Settings page:
- **JSON Export**: Downloads the entire library, reading history, and tags structure.
- **CSV Export**: Downloads a simple spreadsheet of titles and progress.
- **Import**: Supports safely merging backups with existing data or completely replacing the library.

---

## Future Features

- **External API Integration**: Fetch cover art and metadata automatically from APIs like Anilist or MangaUpdates.
- **Advanced Analytics**: Reading speed estimations and predictive completion dates.
- **Custom Collections**: Create curated, shareable lists of top recommendations.
- **Browser Extension**: A companion extension to instantly add a title from a reading site to the Vault.
