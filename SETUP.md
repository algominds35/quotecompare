# VendorFlow MVP - Setup Instructions

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Database

### Create Database

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE vendorflow;

# Exit
\q
```

### Run Database Schema

```bash
psql -U postgres -d vendorflow -f database.sql
```

**OR** if you have a specific user:

```bash
psql -U your_username -d vendorflow -f database.sql
```

## Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env` (if .env doesn't exist)
2. Update the `.env` file with your database connection:

```env
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/vendorflow
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
PORT=3000
```

## Step 4: Start the Server

### Development (with auto-reload)

```bash
npm run dev
```

### Production

```bash
npm start
```

## Step 5: Access the Application

- **Vendor Form**: http://localhost:3000/vendor-form.html
- **Admin Dashboard**: http://localhost:3000/admin
  - Username: `admin` (or what you set in .env)
  - Password: `vendorflow123` (or what you set in .env)

## File Uploads

Uploaded files (W-9s and insurance certificates) are stored in the `uploads/` directory.

## Testing

### Submit a Test Vendor

1. Go to http://localhost:3000/vendor-form.html
2. Fill out the form
3. Submit

### View in Admin Dashboard

1. Go to http://localhost:3000/admin
2. Enter admin credentials
3. View vendor submissions
4. Click "View" to see details
5. Click "Approve" to approve vendor
6. Click "Export to CSV" to download all vendors

## Troubleshooting

### Database Connection Error

If you see "Database connection failed", check:
1. PostgreSQL is running
2. Database credentials in `.env` are correct
3. Database `vendorflow` exists

### Port Already in Use

If port 3000 is already in use, change `PORT=3000` to a different port in `.env`

### File Upload Error

Make sure the `uploads/` directory exists and has write permissions.

## Next Steps

1. **Deploy to Vercel/Railway/Render**
2. **Add email notifications** (Resend/SendGrid)
3. **Add Stripe payments** for subscriptions
4. **Customize form fields** based on user feedback

## Security Notes

- Change `ADMIN_PASSWORD` in production
- Use environment variables for sensitive data
- Add HTTPS in production
- Consider adding proper authentication (JWT) for production use
