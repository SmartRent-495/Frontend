# SmartRent Frontend

Next.js web application for the SmartRent property management platform. Built with TypeScript, App Router, and Material UI.

## Overview

SmartRent is a comprehensive property management platform with three distinct user roles:
- **Landlords**: Manage properties, create leases, track payments, and handle maintenance requests
- **Tenants**: View properties, pay rent, submit maintenance requests, and manage their lease
- **Admins**: Full system oversight including user management, all properties, leases, and payments

## Prerequisites

- Node.js v18 or higher
- npm (or pnpm if preferred)
- Backend server running on http://localhost:5000

## Quick Start

1. **Install dependencies**
```powershell
npm install
```

2. **Configure environment**

Create `.env.local` in the project root:

```env
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Stripe (optional for client-side testing)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Important**: Never expose server secrets (`STRIPE_SECRET_KEY`, Firebase service account) as `NEXT_PUBLIC_*` variables. Those belong in the backend environment only.

3. **Start development server**
```powershell
npm run dev
```

Application will be available at http://localhost:3000

4. **Build for production**
```powershell
npm run build
npm start
```

## Project Structure

```
Frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── auth/               # Authentication (sign-in, sign-up, reset-password)
│   │   ├── landlord/           # Landlord dashboard and features
│   │   │   ├── properties/
│   │   │   │   ├── create/     # Create property form
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx    # Property detail (view, delete)
│   │   │   │       └── edit/       # Edit property form
│   │   │   ├── leases/
│   │   │   │   ├── new/        # Create lease
│   │   │   │   └── [id]/       # Lease detail page
│   │   │   ├── payments/       # Payment management
│   │   │   ├── maintenance/    # Maintenance requests
│   │   │   └── tenants/        # Tenant management
│   │   ├── tenant/             # Tenant dashboard and features
│   │   │   ├── payments/       # Rent payment and history
│   │   │   ├── maintenance/    # Submit maintenance requests
│   │   │   └── properties/     # View assigned properties
│   │   └── admin/              # Admin dashboard and features
│   │       ├── users/          # User management
│   │       ├── properties/     # Property oversight
│   │       ├── leases/         # Lease management
│   │       ├── maintenance/    # Maintenance requests overview
│   │       ├── notifications/  # Notifications management
│   │       └── payments/       # Payment tracking
│   ├── components/             # Reusable UI components
│   │   ├── auth/               # Auth-related components
│   │   ├── landlord/           # Landlord-specific components
│   │   ├── tenant/             # Tenant-specific components
│   │   └── admin/              # Admin-specific components
│   ├── contexts/               # React Context providers
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utilities and API client
│   │   ├── api-client.ts       # Axios-based API wrapper
│   │   ├── admin/              # Admin-specific API client
│   │   └── firebase/           # Firebase initialization
│   ├── styles/                 # Global styles and theme
│   └── types/                  # TypeScript type definitions
├── public/                     # Static assets
├── .env.local                  # Local environment variables (not committed)
├── next.config.js              # Next.js configuration
└── package.json                # Dependencies and scripts
```

## Key Routes

### Landlord
- `/landlord` - Landlord dashboard
- `/landlord/properties` - Property list
- `/landlord/properties/create` - Add new property
- `/landlord/properties/[id]` - Property details (view, edit, delete)
- `/landlord/properties/[id]/edit` - Edit property form
- `/landlord/leases` - Lease management
- `/landlord/leases/new` - Create new lease
- `/landlord/leases/[id]` - Lease details
- `/landlord/payments` - Payment tracking
- `/landlord/maintenance` - Maintenance request dashboard
- `/landlord/tenants` - Tenant management
- `/landlord/settings` - Landlord settings

### Tenant
- `/tenant` - Tenant dashboard
- `/tenant/properties` - View assigned properties
- `/tenant/lease` - View current lease
- `/tenant/payments` - Rent payment and history
- `/tenant/payments/[paymentId]` - Payment detail and Stripe checkout
- `/tenant/maintenance` - Submit and track maintenance requests

### Admin
- `/admin` - Admin dashboard and system overview
- `/admin/users` - User management (view all users, roles, status)
- `/admin/properties` - Property oversight (all properties across landlords)
- `/admin/leases` - Lease management (view all leases)
- `/admin/maintenance` - Maintenance requests overview
- `/admin/notifications` - Notifications management
- `/admin/payments` - Payment tracking (all transactions)

## Available Scripts

```powershell
npm run dev          # Start development server (port 3000)
npm run build        # Build production bundle
npm start            # Start production server
npm run lint         # Run ESLint
npm test             # Run tests (if configured)
```

## Key Features

### Property Management (Landlord)
- Create, edit, and delete properties
- Upload property images
- Track property status and availability
- View detailed property information

### Lease Management (Landlord)
- Create and manage leases
- Track lease status (pending, active, expired, terminated)
- View lease details with property and tenant information
- Monitor lease terms and payment schedules

### Payment Processing (Tenant)
- Stripe integration for secure rent payments
- View payment history
- Track upcoming and overdue payments
- Payment receipt generation

### Maintenance Requests (Tenant & Landlord)
- Submit maintenance requests with descriptions and priority
- Track request status (pending, in-progress, completed)
- Landlord can view and manage all requests
- Tenant can view their submitted requests

### Admin Panel
- System-wide dashboard with key metrics
- User management (view all users, roles, and status)
- Property oversight across all landlords
- Lease management and monitoring
- Maintenance request overview
- Payment tracking across the platform
- Notification management
- Database export functionality (CSV format)

## API Integration

The frontend communicates with the backend through `src/lib/api-client.ts`, which uses Axios with automatic Firebase token injection. All requests require authentication except for `/auth/login` and `/auth/register`.

API base URL is configured via `NEXT_PUBLIC_API_URL`. Ensure the backend is running before starting the frontend.

### Role-Based Access Control

The application implements three distinct user roles:

- **Landlord**: Can manage their own properties, leases, tenants, and view payments/maintenance requests
- **Tenant**: Can view assigned properties, pay rent, submit maintenance requests, and manage their lease
- **Admin**: Has full system access including user management, all properties, leases, payments, and maintenance requests

### Admin API

Admins have access to additional endpoints through `src/lib/admin/api.ts`:
- `adminApi.collection(name)` - Fetch all documents from a Firestore collection
- `adminApi.updateDocument(collection, id, data)` - Update any document
- `adminApi.deleteDocument(collection, id)` - Delete any document
- `adminApi.exportDatabase()` - Export entire database as CSV

## Firebase Setup

The app uses Firebase for authentication and notifications:

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication (Email/Password)
3. Copy your web app configuration to `.env.local`
4. For backend integration, download the service account JSON and configure it in the backend repository

## Deployment

The frontend is deployed to Vercel:

```powershell
npm run build
vercel deploy --prod
```

Configure environment variables in Vercel dashboard before deploying.

## Troubleshooting

**Multiple lockfiles warning**: The project has both `package-lock.json` and `pnpm-lock.yaml`. If you prefer `pnpm`, delete `package-lock.json` and run `pnpm install`. Otherwise, use `npm install`.

**Firebase initialization errors**: Verify all `NEXT_PUBLIC_FIREBASE_*` variables are set in `.env.local`.

**API connection refused**: Ensure the backend server is running at the URL specified in `NEXT_PUBLIC_API_URL`.

**Build fails with type errors**: Run `npm run build` to see specific TypeScript errors. Check that all required environment variables are defined.

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and test locally
3. Run lint and build: `npm run lint && npm run build`
4. Commit changes: `git commit -m "Description of changes"`
5. Push and create pull request

## License

MIT License
**Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ``


**Start Frontend Development Server**
   ```bash
   cd frontend
   npm run dev
   ```
   Application runs on http://localhost:3000

## 📱 User Roles

### Tenant
- Register and manage personal profile
- View assigned properties
- Pay rent and utilities online
- Submit maintenance requests
- View payment history
- Receive notifications

### Landlord
- Register and manage business profile
- Add and manage properties
- Add and manage tenants
- Set rent amounts and due dates
- Track payments
- Manage maintenance requests
- View financial reports

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Rate limiting on API endpoints
- CORS protection
- Helmet security headers
- Input validation and sanitization
- SQL injection protection

## 💳 Payment Integration

- Stripe integration for secure payments
- Support for rent and utility payments
- Automated payment confirmations
- Payment history tracking
- Refund processing
- Webhook handling for payment events

## 🔔 Notification System

- Payment reminders (3 days before due date)
- Payment confirmations
- Maintenance request updates
- Lease expiration alerts
- System announcements

## 🧪 Testing

```bash
# Run frontend tests
cd frontend
npm test

# Run backend tests
cd backend
npm test
```

## 📦 Deployment

### Frontend (Vercel)
```bash
cd frontend
npm run build
# Deploy to Vercel
vercel deploy --prod
```

### Backend (Render/Heroku)
```bash
cd backend
# Deploy according to platform instructions
```

### Firebase (Production Database)
1. Set up Firebase project
2. Configure Firestore database
3. Deploy Cloud Functions
4. Update environment variables

## 🗄️ Database Schema

### Main Tables
- **users** - User accounts (landlords and tenants)
- **properties** - Property listings
- **leases** - Rental agreements
- **payments** - Rent and utility payments
- **maintenance_requests** - Maintenance tickets
- **notifications** - User notifications

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.


## 🙏 Acknowledgments

- Firebase Documentation
- Stripe API Documentation
- Next.js Documentation
- Material-UI Component Library
- Vercel Deployment Platform

## 📚 References

1. [Firebase Firestore Documentation](https://firebase.google.com/docs/firestore)
2. [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
3. [Firebase Authentication](https://firebase.google.com/docs/auth)
4. [Vercel Documentation](https://vercel.com/docs)
5. [Render Cloud Hosting](https://render.com/docs)
6. [Stripe API Reference](https://stripe.com/docs/api)

---

## Contact Details
| Name | Email | 
|------|-------|
| Zeeshan Imran | eng.zeeshanimran@gmail.com | 
| Miguel Mbabazi | miguelmbabatunga31@gmail.com | 
| Mahlet Bekele | mahlet.bizwoin@gmail.com |



**Built by Team SmartRent**
