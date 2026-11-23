<div align="center">

# ⚡ MentorLagbe Backend REST API Server

**High-performance, secure Express.js REST API service powering the MentorLagbe Smart Tuition & Mentorship Platform.**

[![Node.js](https://img.shields.io/badge/Node.js-v20+-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v5.3.0-black?style=flat-square&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Stripe](https://img.shields.io/badge/Stripe-SDK-6772E5?style=flat-square&logo=stripe)](https://stripe.com/)
[![JOSE](https://img.shields.io/badge/JOSE-JWKS_Verification-blueviolet?style=flat-square)](https://github.com/panva/jose)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com/)

---

### 📡 [Production API URL](https://mentorlagbe-backend-xi.vercel.app) | 🌐 [Frontend Live Application](https://mentorlagbe-frontend-three.vercel.app)

</div>

<br/>

## 📖 Project Purpose & Backend Architecture

The **MentorLagbe Backend** is an enterprise-grade RESTful API built with **Express.js v5 (ES Modules)** and **MongoDB Native Driver**. It serves as the authoritative data and business-logic engine for the MentorLagbe platform:

- **Decoupled Security via JWKS:** Verifies authentication JWTs issued by Better Auth on the frontend using asynchronous JSON Web Key Sets (JWKS) via `jose`, eliminating shared secrets and enabling microservice-ready security.
- **Role-Based Access Control (RBAC):** Strict middleware guards ensuring students, tutors, and administrators can only execute authorized operations.
- **Dynamic Search & Pagination Engine:** Fast MongoDB aggregation pipeline supporting regex search, multi-field filtering (subject, class level, mode), and server-side pagination.
- **Payment Lifecycle & Subscription Upgrades:** Secure checkout session creation and session validation with Stripe SDK, automatically updating user account tiers upon completion.
- **Zero-Commission Mentorship Workflows:** Complete CRUD operations for tuition batches, applications, bookmarks, and admin platform moderation.

---

## 🌐 Live URLs & Demo Accounts

| Resource                    | URL                                                                                            |
| :-------------------------- | :--------------------------------------------------------------------------------------------- |
| **Backend REST API Server** | [https://mentorlagbe-backend-xi.vercel.app](https://mentorlagbe-backend-xi.vercel.app)         |
| **Frontend Web App**        | [https://mentorlagbe-frontend-three.vercel.app](https://mentorlagbe-frontend-three.vercel.app) |

### 🔑 Test Demo Accounts

| Role           | Email               | Password   | Access Capabilities                                                                 |
| :------------- | :------------------ | :--------- | :---------------------------------------------------------------------------------- |
| 🛡️ **Admin**   | `hossain@gmail.com` | `********` | Moderate listings, reassign user roles, review platform stats & Stripe transactions |
| 👨‍🏫 **Tutor**   | `sabbirt@gmail.com` | `********` | Create & manage tuition listings, accept/reject applicants, review analytics        |
| 🎓 **Student** | `sabbir3@gmail.com` | `********` | Search & apply to tuitions, track application status, cancel pending requests       |

---

## 🚀 Key Features & Capabilities

### 1. 🛡️ Multi-Tier RBAC Middlewares

- **`verifyToken`:** Intercepts incoming bearer tokens and validates signature/claims against Better Auth JWKS endpoint (`AUTH_URL/api/auth/jwks`).
- **`verifyStudent`:** Enforces student-only operations (submitting applications, viewing personal applications, bookmarking tuitions).
- **`verifyTutor`:** Enforces tutor-only actions (posting tuitions, updating batch visibility, managing student applicants).
- **`verifyAdmin`:** Restricts moderation queues, role promotions, and financial audit logs to verified administrators.

### 2. 🗄️ 4 MongoDB Collections Architecture

- **`user`:** Managed in synchronization with Better Auth (`_id, name, email, image, role, phone, bio, plan, createdAt, updatedAt`).
- **`tuitions`:** Stores tuition batches with fields for `title`, `subject`, `classLevel`, `mode`, `location`, `monthlyFee`, `daysPerWeek`, `bannerImage`, `description`, `tutorName`, `tutorEmail`, `approvalStatus` (`pending` | `approved` | `rejected`), and `isActive`.
- **`applications`:** Tracks mentorship requests with `tuitionId`, `tuitionTitle`, `subject`, `monthlyFee`, `tutorEmail`, `studentName`, `studentEmail`, `studentPhone`, `preferredSchedule`, `studentNote`, and `status` (`pending` | `accepted` | `rejected`).
- **`payments`:** Auditable Stripe transaction logs (`userEmail`, `userName`, `userRole`, `planName`, `amount`, `currency`, `transactionId`, `stripeSessionId`, `paymentStatus`, `paidAt`).

### 3. 💳 Stripe Checkout & Pro Subscription Engine

- Creates dynamic Stripe Checkout Sessions with line items tailored to user role (Tutor Pro at $15/mo, Student Pro at $10/mo).
- Endpoints to verify session completion, prevent double-processing, log payments into MongoDB, and upgrade user `plan: 'pro'`.

### 4. ⚡ Tier Limits Enforcement

- Enforces Free vs. Pro tier limits at the backend layer (e.g., Free Tutors are capped at 2 active tuitions; Pro Tutors get unlimited postings).
- Enforces bookmark quotas (Free Students capped at 5 saved tuitions; Pro Students get unlimited bookmarks).

---

## 🛠️ NPM Packages & Dependencies

### Backend Dependencies (`package.json`)

| Package       | Version    | Purpose / Usage                                                    |
| :------------ | :--------- | :----------------------------------------------------------------- |
| **`express`** | `^5.3.0`   | Next-generation Node.js web framework for routing and middleware   |
| **`mongodb`** | `^7.9.1`   | Native MongoDB driver for Atlas database connection and queries    |
| **`stripe`**  | `^23.2.0`  | Official Stripe SDK for checkout sessions and payment verification |
| **`jose`**    | `^6.2.18`  | Universal JSON Web Key Sets (JWKS) and JWT verification library    |
| **`cors`**    | `^2.8.6`   | Cross-Origin Resource Sharing middleware for frontend requests     |
| **`dotenv`**  | `^18.0.10` | Secure environment variable management                             |

---

## 📡 REST API Endpoints Specification

### 1. Public & Tuitions Endpoints

| Method | Endpoint             | Access | Description                                                                                                  |
| :----- | :------------------- | :----- | :----------------------------------------------------------------------------------------------------------- |
| `GET`  | `/`                  | Public | Root welcome & health status                                                                                 |
| `GET`  | `/health`            | Public | System uptime & MongoDB connection status                                                                    |
| `GET`  | `/tuitions`          | Public | Search, filter, sort & paginate approved tuitions (`?search=&subject=&classLevel=&mode=&sort=&page=&limit=`) |
| `GET`  | `/tuitions/featured` | Public | Returns the 6 latest approved and active tuition listings                                                    |
| `GET`  | `/tuitions/:id`      | Public | Fetch comprehensive details for a single tuition listing                                                     |

### 2. Tutor Operations (Protected: Tutor Role)

| Method   | Endpoint                      | Access | Description                                                                       |
| :------- | :---------------------------- | :----- | :-------------------------------------------------------------------------------- |
| `POST`   | `/tuitions`                   | Tutor  | Create a tuition listing (enforces 2-post limit for Free tier; unlimited for Pro) |
| `GET`    | `/tutor/my-tuitions`          | Tutor  | Retrieve all tuition batches created by the logged-in tutor                       |
| `PATCH`  | `/tuitions/:id`               | Tutor  | Update details of an owned tuition batch                                          |
| `PATCH`  | `/tuitions/:id/toggle-status` | Tutor  | Toggle listing between `Active` and `Closed` visibility                           |
| `DELETE` | `/tuitions/:id`               | Tutor  | Delete a tuition post                                                             |
| `GET`    | `/tutor/applicants`           | Tutor  | Retrieve all student applications submitted to the tutor's batches                |
| `PATCH`  | `/applications/:id/status`    | Tutor  | Update application status (`accepted` or `rejected`)                              |

### 3. Student Operations (Protected: Student Role)

| Method   | Endpoint                   | Access  | Description                                                             |
| :------- | :------------------------- | :------ | :---------------------------------------------------------------------- |
| `POST`   | `/applications`            | Student | Submit an application to a tuition batch (validates duplicate requests) |
| `GET`    | `/student/my-applications` | Student | Retrieve all submitted tuition applications for the logged-in student   |
| `DELETE` | `/applications/:id`        | Student | Cancel a pending tuition application                                    |
| `POST`   | `/tuitions/:id/bookmark`   | Student | Bookmark or remove a saved tuition                                      |
| `GET`    | `/student/saved-tuitions`  | Student | Fetch all bookmarked tuitions for the student                           |

### 4. Stripe Payments (Protected)

| Method | Endpoint                            | Access        | Description                                                                  |
| :----- | :---------------------------------- | :------------ | :--------------------------------------------------------------------------- |
| `POST` | `/payments/create-checkout-session` | Authenticated | Create a Stripe checkout session for Pro upgrade                             |
| `POST` | `/payments/verify-session`          | Authenticated | Verify Stripe payment, log transaction record, and update user plan to `pro` |

### 5. Admin Moderation (Protected: Admin Role)

| Method  | Endpoint                       | Access | Description                                                                     |
| :------ | :----------------------------- | :----- | :------------------------------------------------------------------------------ |
| `GET`   | `/stats/admin`                 | Admin  | Aggregate platform metrics (Users, Tutors, Students, Approved/Pending, Revenue) |
| `GET`   | `/admin/users`                 | Admin  | Retrieve all registered users with pagination & search                          |
| `PATCH` | `/admin/users/:id/role`        | Admin  | Reassign user role (`student`, `tutor`, `admin`)                                |
| `GET`   | `/admin/tuitions`              | Admin  | Retrieve all tuition listings across all statuses for moderation                |
| `PATCH` | `/admin/tuitions/:id/approval` | Admin  | Approve (`approved`) or Reject (`rejected`) a tuition listing                   |
| `GET`   | `/admin/transactions`          | Admin  | Inspect all processed Stripe payment and subscription records                   |

---

## ⚙️ Environment Variables Guide

Create a `.env` file in the root of `mentorlagbe-backend/`:

```env
# Server Port
PORT=5000

# MongoDB Atlas Connection String
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/?retryWrites=true&w=majority

# Better Auth Origin (Used to fetch JWKS public keys)
AUTH_URL=http://localhost:3000

# Frontend Client Origin (Allowed for CORS requests)
CLIENT_URL=http://localhost:3000

# Stripe Secret Key (For checkout session generation & validation)
STRIPE_SECRET_KEY=sk_test_51Ue7...your_stripe_secret_key
```

---

## 📜 CLI Utility Scripts

The backend includes purpose-built Node.js scripts for testing, initialization, and administrative elevation:

- **Database Seeder:** Populates MongoDB with 12 diverse, realistic approved tuitions across SSC, HSC, and University levels:
  ```bash
  node scripts/seed.js
  ```
- **Promote Administrator:** Elevates any user account to `admin` role instantly:
  ```bash
  node scripts/promote-admin.js <user-email>
  ```
- **Sample Applications Seeder:** Seeds test student applications linked to real tuition posts:
  ```bash
  node scripts/seed-applications.js
  ```

---

## 🚀 Local Development Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/sabbirhossain-dev/mentor-lagbe-backend.git
   cd mentor-lagbe-backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure Environment:**
   Create `.env` using the environment variables guide above.

4. **Start the API Server:**

   ```bash
   # Development mode with auto-reload:
   npm run dev

   # Production mode:
   npm start
   ```

5. **Verify Server:**
   Open [http://localhost:5000/health](http://localhost:5000/health) in your browser. You should receive `{ status: "ok", timestamp: ... }`.

---

## 👨‍💻 Developer Information

- **Developer:** Md. Sabbir Hossain
- **GitHub Profile:** [@sabbirhossain-dev](https://github.com/sabbirhossain-dev)
- **Repository:** [mentor-lagbe-backend](https://github.com/sabbirhossain-dev/mentor-lagbe-backend)
- **Production API:** [https://mentorlagbe-backend-xi.vercel.app](https://mentorlagbe-backend-xi.vercel.app)

---

<div align="center">
  <sub>Developed with 💻 & ☕ by <b>Md. Sabbir Hossain</b>.</sub>
</div>
