# Heroes Rise Foundation Website

Professional non-profit platform for **Heroes Rise Foundation** with the motto:

> **Serving Those Who Serve. Saving Those Who Can't Speak.**

This project includes:

- **Next.js + TypeScript frontend** (single-page, responsive, animated)
- **Express backend on Vercel Functions** (`/api/index.ts`)
- **PostgreSQL schema** for stories, metrics, subscribers, contacts, admins, and CMS content
- **JWT admin authentication**
- **Stripe test-mode donation checkout endpoint**

---

## Features Implemented

### Frontend

- Hero banner and mission tagline
- About section with impact metrics
- How We Help service offerings
- Our Heroes section with testimonial carousel + story highlights
- Get Involved (donate, volunteer, partner)
- Newsletter signup form
- Contact form
- Footer with social sharing links
- Mobile-first responsive UI
- Smooth section animations (Framer Motion)
- SEO metadata + JSON-LD structured data

### Backend (Express + Vercel Function)

REST API endpoints for:

- **Auth**
  - `POST /api/auth/login`
- **Stories/Heroes**
  - `GET /api/stories`
  - `POST /api/stories` (admin)
  - `GET /api/stories/:id`
  - `PUT /api/stories/:id` (admin)
  - `DELETE /api/stories/:id` (admin)
- **Testimonials**
  - `GET /api/testimonials`
  - `POST /api/testimonials` (admin)
  - `PUT /api/testimonials/:id` (admin)
  - `DELETE /api/testimonials/:id` (admin)
- **Impact Metrics**
  - `GET /api/impact-metrics`
  - `PUT /api/impact-metrics` (admin)
  - `POST /api/impact-metrics/views`
- **Subscribers**
  - `POST /api/subscribers`
  - `GET /api/subscribers` (admin)
- **Contact**
  - `POST /api/contact`
  - `GET /api/contact` (admin)
- **Donations**
  - `GET /api/donation-links`
  - `POST /api/donations/checkout-session`
- **Admin CMS**
  - `GET /api/admin/content` (admin)
  - `PUT /api/admin/content` (admin)

Security and reliability:

- Helmet headers
- CORS allowlist support
- Rate limiting
- Zod input validation
- HTML sanitization
- Centralized error responses

---

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- Express + CORS + Helmet + Rate Limit
- PostgreSQL (`pg`)
- JWT (`jose`)
- Password hashing (Node `crypto`, HMAC-SHA256 `salt:hash`)
- Stripe SDK

---

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

App runs at `http://localhost:3000`.

---

## Environment Variables

Create `.env.local` with:

```env
# Database
POSTGRES_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME

# Auth
JWT_SECRET=your-long-random-secret

# Stripe (test mode)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# CORS
CORS_ORIGINS=http://localhost:3000,https://your-vercel-domain.vercel.app

# Optional donation links fallback
DONATION_LINK_PRIMARY=https://donate.stripe.com/test_xxx
DONATION_LINK_PARTNER=https://donate.stripe.com/test_xxx

# Optional contact email notifications (Resend)
RESEND_API_KEY=re_xxx
CONTACT_NOTIFICATION_EMAIL=alerts@yourdomain.org
CONTACT_FROM_EMAIL=Heroes Rise <no-reply@yourdomain.org>
```

---

## Database Setup

Run schema:

```bash
psql "$POSTGRES_URL" -f sql/schema.sql
```

Create admin hash:

```bash
npm run hash:admin -- "strong-admin-password"
```

Insert admin user (replace values):

```sql
INSERT INTO admin_users (email, password_hash)
VALUES ('admin@heroesrise.org', '<salt_hash_here>');
-- Example generated via:
-- npm run hash:admin -- "HEROr9%3S"
-- 81c2fee328a02ead8857aed00db57956:47bfe1c058795deacebb2d06269b28b88ddbdc4d0716fff1848c6079b4307886
```

---

## Deployment (Vercel)

1. Push this repo to GitHub
2. Import project in Vercel
3. Add all environment variables
4. Provision Vercel Postgres and set `POSTGRES_URL`
5. Run SQL schema against production DB
6. Deploy

`vercel.json` rewrites `/api/*` to the Express function.

---

## Admin Dashboard

- Visit `/admin`
- Sign in with admin credentials
- Update metrics
- Publish stories and testimonials
- Save simple homepage CMS content
