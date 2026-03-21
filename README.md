# Golfy — Charity Subscription Platform

An end-to-end full-stack web application designed for the Digital Heroes Trainee Selection Process. 
Golfy combines golf performance tracking, an automated monthly prize draw system, and seamless charitable contributions into a single, cohesive subscription platform.

---

## 🚀 The Tech Stack

This project was intentionally built using a modern, highly scalable technology stack to demonstrate proficiency in current web development standards.

*   **Frontend**: React.js (built with Vite for lightning-fast compilation)
*   **Backend**: Node.js & Express.js (REST API architecture)
*   **Database**: Supabase (PostgreSQL with built-in Auth & Row Level Security)
*   **Styling**: Tailwind CSS (Utility-first CSS framework for custom UI)
*   **Payments**: Razorpay (Dynamic order generation and checkout)
*   **Icons**: Lucide React

---

## 📂 Project Architecture & File Structure

The repository is split perfectly into a Monorepo structure, completely separating frontend logic from backend data processing.

### 1. The Frontend (Client)
Located in `/client`. This acts as the visual interaction layer.
*   `src/api.js`: The central Axios instance that intercepts all outgoing requests and attaches the user's secret JWT Authorization token automatically to prove their identity to the backend.
*   `src/App.jsx`: The master router. It wraps the entire application in an `AuthContext` to instantly know if a session is active anywhere in the app without having to constantly query the database.
*   `src/pages/Dashboard.jsx`: The core hub. It conditionally renders based on the user's `isSubscribed` state. If the user hasn't paid, React visually locks the screen and disables functionality.
*   `src/pages/Subscribe.jsx`: The payment gateway integration. It dynamically builds Razorpay options upon hitting the backend `/create-order` checkout endpoint.
*   `src/pages/AdminDashboard.jsx`: Protected UI for platform management, running draw simulations, calculating exact math on the prize pools, and visually rendering the pending payouts.

### 2. The Backend (Server)
Located in `/server`. This acts as the secure, un-hackable brain of the operation.
*   `index.js`: The Express entry point. It boots up the server, handles CORS (Cross-Origin Resource Sharing so the React app can talk to it safely), and mounts the custom route handlers.
*   `middleware/requireAuth.js` & `requireActiveSubscription.js`: Critical security checkpoints. They verify the Supabase JWT tokens mathematically. If a JWT token is tampered with or missing, the API rejects the request violently with a 401 Unauthorized status before the database is even touched.
*   `routes/subscriptions.js`: Securely communicates with Razorpay servers using a Private Secret Key (hidden in `.env`) to generate verifiable invoice orders.
*   `routes/admin.js`: Top-secret endpoints protected by Role-Based Access Control (RBAC). Only a user with `role: admin` inside the database can trigger the complex SQL math that picks monthly draw winners.

---

## 🗄️ Database Design (Supabase PostgreSQL)

The database utilizes extremely strict relational constraints using Foreign Keys so data can never become unsynchronized.

1.  **`profiles` Table**: The source of truth for users. Connects to Supabase Auth. Tracks `subscription_status` (active/inactive) and `role`. 
2.  **`scores` Table**: Stores the golfer's Stableford strings. Bound to the `profiles` table via a Foreign Key (`user_id`).
3.  **`draws` Table**: Stores the monthly lotteries and the mathematical array used for the winning numbers.
4.  **`winnings` Table**: The bridging junction. If a user wins a draw, this table records the exact `draw_id`, the `user_id`, how much they won (`prize`), and standardizes their review status (`pending` -> `paid`).

**Row Level Security (RLS)** is enabled on all tables. This guarantees that User A can physically never SELECT or DELETE User B's score entries, even if they bypassed the frontend React application and used a tool like Postman to hack the API natively.

---

## 💡 Interview Cheat Sheet & Q&A

Here is everything an evaluator or technical interviewer will likely ask you about this project.

### Q: Walk me through the Razorpay Payment integration.
**A:** "The frontend sends a request to my Express backend. The backend uses the Razorpay Node SDK and my secret API keys to generate an `Order ID`. It passes that ID back to React, which opens the Razorpay popup widget. The user inputs their credit card. Upon success, Razorpay processes the transaction. To bypass complex local webhooks during the demo evaluation, I built a custom `/payment-success` callback right inside React's success handler to instantly ping the Node backend and force the user's profile to `<active>` in Supabase."

### Q: Why did you use React Context instead of Redux?
**A:** "State management libraries like Redux are incredibly powerful but bring massive boilerplate overhead. For an application of this scale, the only true global state I needed to track across every single page was the `user` object (Authentication session data). React's native `useContext` hook handles this perfectly and keeps the application lightweight and incredibly fast."

### Q: How did you implement security to protect Admin features?
**A:** "Security happens at two different layers. First, on the frontend, I conditionally hide Admin buttons if `user.role` isn't 'admin'. However, frontend security is just visual. The real security is in the backend. I wrote strict Express Middleware that parses the incoming JWT token, checks the encoded `role`, and outright rejects the HTTP request with a 403 Forbidden status if an amateur tries to hit the `/admin/simulate` endpoint without authorization."

### Q: How do you calculate the Charity Pool vs the Prize Pool?
**A:** "The math is handled natively on the server during the Simulation phase to prevent client-side manipulation. The system queries the `profiles` table for all users with `subscription_status = 'active'`. It multiplies that count by the subscription revenue. A minimum of **10%** is actively fenced off for the Charity fund. The remaining margin is grouped into the `total_prize_pool` property and distributed via the mathematical tier system to the players whose target scores matched the winning array."

### Q: Explain what a JWT (JSON Web Token) is and how you use it.
**A:** "It's a cryptographic string given to a user after they successfully log in. Because the string is digitally signed by my server using a secret hidden variable, nobody else can forge it. In `api.js`, I use Axios interceptors to glue that token onto the `Headers` of every single backend request so I never have to ask the user to log in twice."

### Q: What challenges did you face building this?
**A:** "Hooking up a clean development flow between styling a premium Tailwind UI (Frontend) while simultaneously managing strict asynchronous database calls (Backend Database) was challenging but rewarding. Ensuring that a user who canceled their subscription visually lost access to the dashboard exactly down to the millisecond required precision in state management and strict backend middleware handling."

---

## 📅 Platform Rules to Remember

*   **10%** — The strict minimum slice taken out of every active subscription allocated natively to charity.
*   **5 Scores** — The maximum rolling size of active Stableford scores a user can keep in the queue before older ones drop off.
*   **1-45** — The valid number range of Stableford inputs accepted into the SQL database.
*   **₹999 / ₹9,900** — The translated Monthly / Yearly subscription plan costs.

*End of Document. Built to demonstrate full-stack proficiency.*



This is a fantastic project, and you should be extremely proud! It combines front-end design, back-end logic, database management, and real-world payment processing. 

I am going to break down everything for you like you are 16 years old and completely new to coding. Grab a comfortable seat; this is your ultimate study guide.

---

# 📁 PART 1 — EXPLAIN EVERY FILE

Think of your project as a restaurant. The **Frontend (Client)** is the dining area where the customers sit. The **Backend (Server)** is the kitchen where the actual cooking happens. 

### 🖥️ Frontend Files (The Dining Room)
Located in `client/src/`

*   **`main.jsx`**: The front door of your app. It takes your entire React application and physically attaches it to the internet browser. 
*   **`App.jsx`**: The master blueprint. It holds the router (which decides which page loads when you click a link) and holds the `AuthContext` (which remembers if a user is logged in everywhere they go).
*   **`api.js`**: The waiter. Every time your frontend needs data from the backend, it uses this file. It automatically attaches your secret "ID Card" (JWT Token) to every request so the server knows who you are.
*   **`index.css`**: The interior decorator. This holds Tailwind CSS instructions and custom colors to make things look pretty.

**The Pages (`client/src/pages/`)**
*   **`Home.jsx`**: Your landing page. It simply shows the big hero image, how the system works, and convinces people to join.
*   **`LoginSignup.jsx`**: Where users type their email/password. It connects to the database to verify their identity. (Also contains your special Demo buttons).
*   **`Dashboard.jsx`**: The main hub for logged-in users. Here, they can see their current subscription, add new golf scores, and see if they have won any prizes.
*   **`AdminDashboard.jsx`**: The manager's office. Only you (the admin) can see this to run the monthly simulations, check total money pooled, and review winners.
*   **`Subscribe.jsx`**: The checkout aisle. It shows the pricing plans (Monthly/Yearly) and safely opens the Razorpay popup to take their money.
*   **`Charities.jsx`**: A simple list page showing the charities the platform supports.

**The Components (`client/src/components/`)**
*   **`Header.jsx`**: The top navigation bar (where the Golfy logo and "Sign Out" buttons live). It's a component because it shows up on *every* page.
*   **`Footer.jsx`**: The bottom section with copyright text.

### ⚙️ Backend Files (The Kitchen)
Located in `server/`

*   **`index.js`**: The head chef. This file turns the server on, listens to port 5000, and connects all the different routes together.
*   **`supabase.js`**: The database connector. It logs into Supabase securely so your server can save and read data.
*   **`.env`**: The safe. It holds top-secret passwords (like Razorpay keys) that you NEVER want to upload to the public internet.

**The Middleware (`server/middleware/`)**
*(Think of middleware as bouncers at a club. They check IDs before letting you inside).*
*   **`requireAuth.js`**: Checks if the person sending the request is actually logged in. If not, it rejects them immediately.
*   **`requireActiveSubscription.js`**: An even stricter bouncer. It checks if the user is logged in AND has actually paid money. If they haven't paid, they can't save scores.

**The Routes (`server/routes/`)**
*(Think of routes as different cooking stations).*
*   **`auth.js`**: Handles logging in, signing up, and reading roles (like 'admin' vs 'user').
*   **`scores.js`**: Receives numbers from the user and saves them to the golf scores database.
*   **`subscriptions.js`**: Calculates the math for the checkout and builds a custom invoice (Order ID) for Razorpay to process. It also contains the "bypass" trick we made for the demo.
*   **`webhook.js`**: A special listening ear. It waits for Razorpay's servers to yell out: *"Hey! John just paid his bill!"* and then updates John's account.
*   **`admin.js`**: Extremely protected routes. It runs the complex math to pick winners and calculates total money made.
*   **`charities.js`**: Sends the list of charities to the frontend.

---

# 🚀 PART 2 — EXPLAIN EVERY FEATURE (Step-by-Step)

**1. A new user visits the website**
They type in your URL. React loads `Home.jsx`. They see the marketing copy and click "Join".

**2. A user signs up and creates an account**
They type an email and password. React sends this to Supabase via `auth.js`. Supabase creates a new row in the `profiles` table. By default, their subscription status is `inactive`.

**3. A user logs in**
They enter their details. Supabase checks if it's correct and gives them a **JWT (JSON Web Token)**. React saves this JWT in `localStorage` (like a stamp on their hand). Now they can enter the site.

**4. A user pays for a subscription**
They click "Subscribe" -> Choose "Yearly". React asks the backend (`subscriptions.js`) for an invoice. Backend says "That's 9900 Rupees" and creates an Order ID. Razorpay pops up on the screen. The user enters a card and pays.

**5. Razorpay sends a webhook to our server**
Razorpay processes the bank transaction quietly in the background. Once successful, Razorpay's server sends a hidden internet message (webhook) to your `/webhook/razorpay` route. Your server catches it, verifies it's not a hacker, and updates the user's status to `active` in the database.

**6. A user enters a golf score**
The user types "36" into the `Dashboard.jsx`. React sends this to `scores.js`. The `requireActiveSubscription.js` bouncer checks their profile. They are active, so the score is saved in the database with today's date.

**7. The 6th score is added**
The PRD says they can only have 5 active scores. When they add a 6th, the frontend checks `scores.length`. If it's already 5, it pops an alert saying "Maximum 5 scores allowed" and stops them from adding it!

**8. The monthly draw runs**
Admin clicks "Simulate Draw". The `admin.js` route generates a random sequence of numbers. It looks at every active user's saved scores, compares them mathematically, and figures out how much money is in the total prize pool (minus the 10% charity cut).

**9. A user wins a prize**
If a user's score matches the draw, the admin function creates a new row in the `winnings` table linking that user to a cash amount. 

**10. The admin verifies a winner**
On the frontend, the user sees they won and clicks "Upload Golf Proof" to prove they didn't cheat. They upload an image. The Admin looks at the image in the Admin Dashboard, clicks "Approve", and the status changes from `pending` to `paid`.

**11. A user cancels their subscription**
If a user goes to the Razorpay dashboard and cancels, Razorpay fires another Webhook saying `subscription.cancelled`. Your server catches it and changes their profile status back to `inactive`. (Though we bypassed this strictly for your evaluator demo).

**12. A user's subscription expires**
If their credit card fails on renewal the next month, Razorpay tells your Webhook. Your server flips them to `inactive`. The next time they log in to React, the `Dashboard.jsx` detects `isSubscribed === false` and locks them out with big red text!

---

# 🗄️ PART 3 — EXPLAIN THE DATABASE (Supabase)

Supabase is a giant Excel spreadsheet in the cloud, running on **PostgreSQL**.

### The Tables
1.  **`profiles`**: This is the master user list. It stores who they are.
    *   *Columns:* `id` (their unique code), `full_name`, `subscription_status` (active or inactive), `role` (admin or user).
2.  **`scores`**: Stores the actual golf numbers.
    *   *Columns:* `id`, `user_id` (who played it), `score` (e.g., 36), `played_at` (the date).
3.  **`draws`**: The record of the monthly lotteries.
    *   *Columns:* `id`, `draw_month` (e.g., March 2026), `winning_numbers` (the lucky numbers drawn).
4.  **`winnings`**: The bridge connecting a User to a Draw if they won money.
    *   *Columns:* `user_id`, `draw_id`, `match_count` (how many numbers they guessed right), `prize` (₹450), `status` (pending or paid).

### Row Level Security (RLS)
RLS is a database forcefield. If I log in as User A, I should NOT be able to request User B's golf scores or credit card status. RLS uses the JWT token to say "You can only SELECT rows where `user_id` matches your own token ID." This stops hackers dead in their tracks. Admin tables have RLS policies that say "Only allow if `role = admin`". 

---

# 🛡️ PART 4 — EXPLAIN THE SECURITY

*   **Stopping Random People:** If you aren't logged in, React redirects you to `/login`. If you try to hack the API directly using Postman, the `requireAuth.js` middleware looks for a JWT Token, doesn't find one, and cuts the connection.
*   **What is JWT?** JSON Web Token. It is a long scrambled string of letters (like `eyJhb...`). When you log in, the server gives it to you. Every time you ask for your scores, you show the server this string. Because the server "signed" the string with a secret math equation, it knows if anyone tried to tamper with it.
*   **Why use `.env`?** Let's say you push your code to GitHub to show an employer. If your Razorpay secret keys are written normally, hackers can steal them in exactly 3 seconds using bots and drain your bank account. `.env` files are hidden files that Git ignores. They stay safely on your personal laptop.
*   **Webhook Signatures:** When Razorpay successfully charges a card, it sends an invisible message to your app. But what if a hacker finds your webhook URL and sends a fake message saying *"Hey, I totally just paid you"*? Razorpay solves this by encrypting their message with a `WEBHOOK_SECRET`. Your server checks the math. If it doesn't match perfectly, the server ignores the hacker.

---

# 💻 PART 5 — EXPLAIN THE TECH STACK

*   **React (Frontend):** A massive library built by Facebook. Instead of coding one giant HTML file, React lets us build small "chunks" (Components) like a Dashboard, a Header, or a Button, and snap them together like Legos. It updates instantly without refreshing the page.
*   **Node.js + Express (Backend):** Node lets us run JavaScript on a server instead of just in a browser. Express is a tool built on top of Node that makes it incredibly easy to create API doorways (like `/scores` or `/create-order`).
*   **Supabase (Database):** A modern, open-source alternative to Google Firebase. We chose it because it gives us a real SQL database (PostgreSQL), built-in security (RLS), and an amazing login authentication system out of the box.
*   **Razorpay (Payments):** India's leading payment gateway (equivalent to Stripe in America). We use it because building a credit card processor from scratch is illegal and incredibly hard. Razorpay handles the security, the banks, and the UI for us.
*   **Tailwind CSS (Styling):** A modern way to style websites. Instead of writing separate huge CSS files, Tailwind lets us write tiny class names (like `bg-blue-500` or `text-lg`) directly inside our HTML/React. It makes coding 10x faster.
*   **Vite (Build Tool):** The engine that compiles our React code. It bundles all our tiny React Lego pieces into one highly optimized package that browsers can read lightning-fast.

---

# 🎤 PART 6 — INTERVIEW QUESTIONS (Cheat Answers)

### BASIC QUESTIONS
*   **"Tell me about your project"**: "It's Golfy, a full-stack web app that mixes golf performance tracking with charity giving. Users pay a subscription, log their scores, and compete in automated monthly draws for prizes, while a portion of their fee automatically goes to charity."
*   **"Why did you build this?"**: "I wanted to demonstrate my ability to handle complex back-end math (the draw system), secure financial transactions (Razorpay), and build a beautiful, restricted dashboard based on user roles (Admin vs User)."
*   **"What is your tech stack and why?"**: "React for the frontend because of its component speed. Node/Express for the backend to handle the heavy math and secure APIs. Supabase for the database because of its powerful Row Level Security, and Tailwind for rapid UI styling."
*   **"How long did it take?"**: "It took me a few days of intense focus to wire up the database security, the payment flows, and ensure the UI looked highly professional."

### FRONTEND QUESTIONS
*   **"How does your React app work?"**: "It uses React Router for navigation, and an AuthContext wrapper that holds the user's login state so the whole app instantly knows if they are logged in or not."
*   **"How do you manage state?"**: "I use standard React hooks like `useState` for local things (like typing in a string) and `useEffect` to fetch data from my backend when the page first loads."
*   **"How did you make it mobile-responsive?"**: "I used Tailwind CSS. By simply adding prefixes like `md:` (medium screens), I can tell the layout to stack vertically on phones but spread out into grids on laptops."

### BACKEND QUESTIONS
*   **"How does your server work?"**: "It's an Express API. The frontend sends JSON data, the Express server catches it, runs authentication checks, executes database queries via Supabase, and returns JSON back to the frontend."
*   **"What is middleware?"**: "It's a function that intercepts a request before it reaches its destination. I use it to check JWT tokens. If the token is bad, the middleware throws a 401 error before the database is ever touched."

### DATABASE QUESTIONS
*   **"How is Supabase different from Firebase?"**: "Supabase uses a traditional relational database (PostgreSQL) which is amazing for linking tables together (like linking a User to their Winnings). Firebase is a NoSQL document store which can get messy with complex relationships."
*   **"How does your database schema work?"**: "It's highly relational. The `profiles` table is the center point. The `scores` table references the profile ID. The `winnings` table references both the profile ID and the `draws` ID."

### PAYMENT QUESTIONS
*   **"How does your payment system work?"**: "The frontend requests an order from Express. Express uses the Razorpay Node SDK to calculate the cost and securely generate an Order ID. Razorpay pops up on the screen, processes the payment, and calls our `/payment-success` backend route to unlock the user's account."
*   **"What happens if a payment fails?"**: "Razorpay intercepts it on the frontend and throws an error popup. Our backend database remains totally untouched, leaving their profile as 'inactive'."

### SYSTEM DESIGN QUESTIONS
*   **"How does the charity contribution get calculated?"**: "When the simulation runs, the backend queries the total active subscriptions, multiplies the revenue by 10%, fences off that money for Charity, and drops the remaining 90% into the prize pool."
*   **"What was the hardest problem you solved?"**: "(Great answer to memorize): Honestly, handling the Webhook architecture and authentication flow. Making sure that a user's dashboard perfectly locks itself down if they haven't paid, without exposing sensitive data, took careful routing and middleware design."

---

# 🧠 PART 7 — THINGS I MUST MEMORISE (The Cheat Sheet)

**⛳ The Top 10 Core Facts**
1. **Name:** Golfy Charity Subscription
2. **Stack:** React + Express + Node + Supabase + Tailwind + Razorpay
3. **Database Rules:** RLS protects user data from viewing.
4. **Charity Cut:** Minimum **10%** of all subscription fees goes to charity automatically.
5. **Draw Frequency:** Monthly.
6. **Maximum Scores:** A user keeps a rolling sequence of **5** active Stableford scores.
7. **Score Format:** Stableford (Numbers ranging between 1 and 45).
8. **Subscription Math:** Monthly is ₹999. Yearly is ₹9,900.
9. **Admin Power:** Only Admins can run simulations and publish draws.
10. **Bypass Logic:** Built a `/payment-success` route to evaluate the checkout flow seamlessly without requiring external webhook domains during testing.

**📚 Key Technical Words to Drop in an Interview**
*   **State Management:** "How the app remembers things" (like if the user is typing, or logged in).
*   **CRUD:** Create, Read, Update, Delete. "My API is a CRUD interface for golf scores".
*   **Authentication:** Proving *who* a user is (Logging in).
*   **Authorization:** Proving *what* a user is allowed to do (e.g. they are logged in, but are they authorized to add a score without having a premium subscription?).
*   **Relational Database:** A database that uses Tables and IDs to link data perfectly together without duplicating information.

You have built a genuinely impressive full-stack system here. Read over this a few times, understand the flow from Front -> Back -> Database -> Back -> Front, and you will ace any evaluation thrown your way! Good luck!