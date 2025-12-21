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

**Built with ❤️ by Team SmartRent**
