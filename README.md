# MentorLagbe Backend REST API Server

Express.js and MongoDB REST API backend service powering the **MentorLagbe (Smart Tuition & Mentorship Platform)**.

---

## 🚀 Overview & Key Capabilities

- **Role-Based Middlewares:** Secured with `verifyToken` (JWKS verification against Better Auth), `verifyStudent`, `verifyTutor`, and `verifyAdmin`.
- **4 MongoDB Collections Architecture:**
  - `user` (Managed with Better Auth: `_id, name, email, image, role, phone, bio, plan, createdAt`)
  - `tuitions` (`_id, title, subject, classLevel, mode, location, monthlyFee, daysPerWeek, bannerImage, description, tutorName, tutorEmail, approvalStatus, isActive, createdAt`)
  - `applications` (`_id, tuitionId, tuitionTitle, subject, monthlyFee, tutorEmail, tutorName, studentName, studentEmail, studentPhone, preferredSchedule, studentNote, status, appliedAt`)
  - `payments` (`_id, userEmail, userName, userRole, planName, amount, currency, transactionId, stripeSessionId, paymentStatus, paidAt`)
- **Stripe Subscriptions Integration:** Checkout session creation and payment verification for Tutor Pro ($15) and Student Pro ($10).
- **Server-Side Search & Filter:** Dynamic MongoDB query engine supporting subject regex matching, class level filtering, and pagination.
- **Admin Moderation & Role Assignment:** Endpoints to approve/reject tuitions and assign user roles.

---

## 🛠️ Tech Stack & Packages

- **Node.js** with **Express.js v5** (ES Modules)
- **MongoDB** Native Driver (`mongodb`)
- **Stripe SDK** (`stripe`)
- **JWT & JWKS** (`jose`)
- **CORS** (`cors`)
- **Environment Management** (`dotenv`)

---

## 📡 Core API Endpoints

### Public & Tuitions
- `GET /` - Root health endpoint
- `GET /health` - Server uptime & status
- `GET /tuitions` - Search, filter, and pagination (`?search=&subject=&classLevel=&mode=&sort=&page=&limit=`)
- `GET /tuitions/featured` - 6 latest approved and active listings
- `GET /tuitions/:id` - Single tuition batch details

### Tutor Operations (Protected)
- `POST /tuitions` - Create tuition post (enforces max 2 posts for Free Plan; unlimited for Pro)
- `GET /tutor/my-tuitions` - Tutor's created listings
- `PATCH /tuitions/:id` - Update tuition details
- `PATCH /tuitions/:id/toggle-status` - Toggle Active / Closed visibility
- `DELETE /tuitions/:id` - Delete tuition listing
- `GET /tutor/applicants` - View all students applied to tutor's posts
- `PATCH /applications/:id/status` - Accept or reject an application

### Student Operations (Protected)
- `POST /applications` - Apply for tuition (validates approved status & prevents duplicates)
- `GET /student/my-applications` - View submitted applications
- `DELETE /applications/:id` - Cancel pending application
- `POST /tuitions/:id/bookmark` - Bookmark tuition (max 5 for Free Plan; unlimited for Pro)
- `GET /student/saved-tuitions` - Retrieve bookmarked tuitions

### Stripe Payments (Protected)
- `POST /payments/create-checkout-session` - Generate Stripe checkout session for Pro upgrade
- `POST /payments/verify-session` - Verify checkout session, log transaction, and update user `plan: 'pro'`

### Admin Moderation (Protected)
- `GET /admin/users` - View all registered users
- `PATCH /admin/users/:id/role` - Update user role (`student`, `tutor`, `admin`)
- `GET /admin/tuitions` - View all tuition listings for moderation
- `PATCH /admin/tuitions/:id/approval` - Approve (`approved`) or Reject (`rejected`) listings
- `GET /admin/transactions` - Audit all subscription payments
- `GET /stats/admin` - Platform-wide statistics

---

## ⚙️ Environment Variables (`.env`)

```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
AUTH_URL=http://localhost:3000
CLIENT_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_...
```

---

## 📜 CLI Scripts

- `node scripts/seed.js` — Seeds 12 realistic approved tuitions
- `node scripts/promote-admin.js <email>` — Promotes any user to Administrator
- `node scripts/seed-applications.js` — Seeds sample connected student applications
