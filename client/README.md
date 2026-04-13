# Golf Charity Subscription Platform

Full-stack web platform where users subscribe, upload their latest golf stableford scores, and participate in monthly prize draws. A fixed part of subscription money also goes to selected charities.

This project is built to show real-world engineering skills for placements: authentication, role-based access, payment integration, protected APIs, admin workflows, and clean frontend UX.


## Why This Project

Most demo projects stop at login/signup. This one goes further:

- Paid and unpaid user journeys
- Monthly draw simulation and publishing
- Admin panel for operations
- Stripe checkout + webhook support
- Charity contribution concept built into product flow

## Main Features

### User Side

- Signup/login with Supabase Auth
- Mandatory charity selection at signup
- Dashboard with last 5 active stableford scores
- Add/delete scores (protected by active subscription)
- Stripe checkout for monthly/yearly plans
- Optional standalone donation checkout
- Draw participation summary and winnings section
- Proof upload flow for winner verification (URL-based simulation)

### Admin Side

- Admin-only dashboard and reports
- Create draw and run simulation
- Publish official draw results
- Manage charity records (create/update/delete)
- Search users and inspect subscription status
- Review winners list and payout states

### Platform/Security

- JWT-protected routes
- Role checks (`user`, `admin`)
- Subscription guard middleware for paid actions
- Rate limiting (`express-rate-limit`)
- Security headers (`helmet`)
- CORS allowlist for localhost + Vercel deployments

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, Axios, React Router
- Backend: Node.js, Express
- Auth + DB: Supabase (Auth + PostgreSQL)
- Payments: Stripe Checkout + Webhook
- Monitoring/Analytics: Vercel Analytics

## High-Level Architecture

1. User logs in from React app.
2. Frontend stores token and sends it as `Authorization: Bearer <token>`.
3. Express middleware validates token and fetches profile.
4. Protected routes perform business logic (scores, draws, charities, subscriptions).
5. Supabase stores user/profile/scores/draw data.
6. Stripe handles checkout; webhook (or evaluation fallback) updates subscription status.

## Folder Structure

```text
GOLF project task/
	client/
		src/
			pages/            # Home, Dashboard, Subscribe, Admin, etc.
			components/       # Shared UI parts
			api.js            # Axios client with auth interceptor
	server/
		routes/             # auth, scores, draws, admin, subscriptions, etc.
		middleware/         # requireAuth, requireAdmin, requireActiveSubscription
		supabase.js         # Supabase client setup
	supabase_schema.sql   # DB schema + triggers + RLS
	seed_dummy_data.sql   # Sample charities and config
```

## Database Design (Supabase)

Important tables:

- `profiles`
- `charities`
- `scores`
- `draws`
- `draw_entries`
- `charity_contributions`
- `prize_pool_config`
- `email_logs`

Important database logic:

- Trigger to keep only latest 5 scores per user
- Trigger to auto-update `updated_at`
- Trigger to update total charity contributions
- RLS policies for secure row-level access

## Setup Guide

## 1. Clone

```bash
git clone https://github.com/TanmayVyavahare/golfplatform-.git
cd "GOLF project task"
```

## 2. Setup Backend

```bash
cd server
npm install
```

Create `.env` in `server/`:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173

SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

Run backend:

```bash
npm run dev
```

## 3. Setup Frontend

```bash
cd ../client
npm install
```

Create `.env` in `client/`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Run frontend:

```bash
npm run dev
```

## 4. Setup Supabase SQL

Run these files in Supabase SQL editor in order:

1. `supabase_schema.sql`
2. `seed_dummy_data.sql`

## Demo Accounts / Demo Access

The app includes one-click demo login buttons on login page:

- Unpaid/Free User
- Paid Subscriber
- Admin Reviewer

This helps evaluators quickly check all flows without full payment setup.

## API Summary

Auth:

- `POST /api/auth/signup`
- `POST /api/auth/login`

User:

- `GET /api/profile`
- `PUT /api/profile`
- `GET /api/scores`
- `POST /api/scores`
- `DELETE /api/scores/:id`

Draw and Charity:

- `GET /api/draws`
- `GET /api/draws/:id`
- `GET /api/charities`
- `GET /api/charities/:slug`

Subscription:

- `POST /api/subscriptions/create-checkout-session`
- `POST /api/subscriptions/payment-success` (evaluation fallback)
- `POST /api/webhook/stripe`

Admin:

- `GET /api/admin/reports`
- `POST /api/admin/draws`
- `POST /api/admin/draws/:id/simulate`
- `POST /api/admin/draws/:id/publish`
- `GET /api/admin/charities`
- `POST /api/admin/charities`
- `PUT /api/admin/charities/:id`
- `DELETE /api/admin/charities/:id`
- `GET /api/admin/users/search?email=`

## Placement-Focused Talking Points

You can present this project in interviews like this:

- Built a production-style full-stack platform with role-based auth and payment-gated features.
- Designed secure middleware architecture for authentication, admin control, and subscription checks.
- Integrated Stripe checkout and webhook handling with fallback flow for evaluation environments.
- Implemented Supabase schema with triggers and RLS policies for secure and scalable data access.
- Created an admin operations panel for draw management, winner tracking, and charity CRUD.

## Challenges Solved

- Handling real payments while still supporting demo/evaluation mode
- Keeping business flows secure with middleware and route-level guards
- Managing game logic + contribution logic + admin workflows in one platform

## Future Improvements

- Real file upload to Supabase Storage for proof documents
- Scheduled monthly draw automation (cron/queue)
- Transaction history page for users and charities
- Unit/integration tests for routes and business logic
- Email notifications for draw results and payout updates

## License

This project is built for learning, portfolio, and placement demonstration.
