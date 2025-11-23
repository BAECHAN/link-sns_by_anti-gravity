# LinkSphere

A company-internal SNS for sharing useful links between coworkers.

## Features

- **Login/Signup**: Google OAuth or Email/Password.
- **Feed**: View shared links in reverse chronological order.
- **Submit**: Share a URL and automatically fetch OG metadata (title, image).
- **Reactions**: React to posts with 👍, 🔥, 💡, 😂.
- **Comments**: Discuss shared links.

## Tech Stack

- Next.js 15 (App Router)
- Prisma + PostgreSQL
- NextAuth.js
- shadcn/ui + Tailwind CSS
- Framer Motion

## Getting Started

1. **Clone the repo**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Environment Variables**
   Create a `.env` file with:
   ```env
   DATABASE_URL="postgresql://..."
   NEXTAUTH_SECRET="your-secret"
   NEXTAUTH_URL="http://localhost:3000"
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

4. **Run Database Migrations**
   ```bash
   npx prisma migrate dev
   ```

5. **Run Development Server**
   ```bash
   npm run dev
   ```

## Deployment

Deploy to Vercel:
1. Import project.
2. Set environment variables.
3. Deploy.
