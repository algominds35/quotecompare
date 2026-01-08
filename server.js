require('dotenv').config();
const express = require('express');
const cors = require('cors');
const basicAuth = require('express-basic-auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Database connection failed:', err);
    } else {
        console.log('✅ Database connected successfully');
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// File upload configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: function (req, file, cb) {
        // Accept PDFs, images, and common document formats
        const allowedTypes = /pdf|jpeg|jpg|png|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only PDF, JPEG, PNG, DOC, DOCX files are allowed'));
        }
    }
});

// Basic auth middleware for admin
const adminAuth = basicAuth({
    users: { 
        [process.env.ADMIN_USERNAME]: process.env.ADMIN_PASSWORD 
    },
    challenge: true,
    realm: 'VendorFlow Admin'
});

// ============================================
// API ROUTES
// ============================================

// Submit vendor form
app.post('/api/vendors', upload.fields([
    { name: 'w9_file', maxCount: 1 },
    { name: 'insurance_certificate', maxCount: 1 }
]), async (req, res) => {
    try {
        const {
            company_name,
            dba,
            address,
            city,
            state,
            zip,
            phone,
            email,
            website,
            business_type,
            ein,
            tax_classification,
            bank_name,
            account_holder,
            routing_number,
            account_number,
            account_type,
            insurance_policy_number,
            insurance_expiration,
            insurance_coverage_amount,
            primary_contact_name,
            primary_contact_email,
            primary_contact_phone,
            ap_contact_name,
            ap_contact_email,
            ap_contact_phone
        } = req.body;

        // Get uploaded file info
        const w9File = req.files?.w9_file?.[0];
        const insuranceFile = req.files?.insurance_certificate?.[0];

        const query = `
            INSERT INTO vendors (
                company_name, dba, address, city, state, zip, phone, email, website, business_type,
                ein, tax_classification, w9_filename, w9_filepath,
                bank_name, account_holder, routing_number, account_number, account_type,
                insurance_policy_number, insurance_expiration, insurance_certificate_filename, 
                insurance_certificate_filepath, insurance_coverage_amount,
                primary_contact_name, primary_contact_email, primary_contact_phone,
                ap_contact_name, ap_contact_email, ap_contact_phone,
                status, submitted_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14,
                $15, $16, $17, $18, $19,
                $20, $21, $22, $23, $24,
                $25, $26, $27,
                $28, $29, $30,
                'pending', NOW()
            ) RETURNING id
        `;

        const values = [
            company_name, dba, address, city, state, zip, phone, email, website, business_type,
            ein, tax_classification, w9File?.filename, w9File?.path,
            bank_name, account_holder, routing_number, account_number, account_type,
            insurance_policy_number, insurance_expiration, insuranceFile?.filename, insuranceFile?.path, insurance_coverage_amount,
            primary_contact_name, primary_contact_email, primary_contact_phone,
            ap_contact_name, ap_contact_email, ap_contact_phone
        ];

        const result = await pool.query(query, values);

        res.json({
            success: true,
            message: 'Vendor submitted successfully',
            vendor_id: result.rows[0].id
        });

    } catch (error) {
        console.error('Error submitting vendor:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting vendor',
            error: error.message
        });
    }
});

// Get all vendors (admin only)
app.get('/api/admin/vendors', adminAuth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM vendors ORDER BY created_at DESC'
        );
        res.json({
            success: true,
            vendors: result.rows
        });
    } catch (error) {
        console.error('Error fetching vendors:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching vendors',
            error: error.message
        });
    }
});

// Get single vendor (admin only)
app.get('/api/admin/vendors/:id', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM vendors WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }

        res.json({
            success: true,
            vendor: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching vendor:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching vendor',
            error: error.message
        });
    }
});

// Approve vendor (admin only)
app.post('/api/admin/vendors/:id/approve', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'UPDATE vendors SET status = $1, approved_at = NOW(), approved_by = $2 WHERE id = $3 RETURNING *',
            ['approved', req.auth.user, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }

        res.json({
            success: true,
            message: 'Vendor approved',
            vendor: result.rows[0]
        });
    } catch (error) {
        console.error('Error approving vendor:', error);
        res.status(500).json({
            success: false,
            message: 'Error approving vendor',
            error: error.message
        });
    }
});

// Export to CSV (admin only)
app.get('/api/admin/export/csv', adminAuth, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM vendors ORDER BY created_at DESC');
        
        // Create CSV headers
        const headers = [
            'ID', 'Status', 'Company Name', 'DBA', 'Email', 'Phone', 'Address', 'City', 'State', 'Zip',
            'EIN', 'Bank Name', 'Routing Number', 'Account Number', 'Account Type',
            'Primary Contact', 'Primary Email', 'Primary Phone',
            'AP Contact', 'AP Email', 'AP Phone',
            'Insurance Policy', 'Insurance Expiration', 'Coverage Amount',
            'Submitted At', 'Approved At'
        ];

        // Create CSV rows
        const rows = result.rows.map(vendor => [
            vendor.id,
            vendor.status,
            vendor.company_name,
            vendor.dba || '',
            vendor.email || '',
            vendor.phone || '',
            vendor.address || '',
            vendor.city || '',
            vendor.state || '',
            vendor.zip || '',
            vendor.ein || '',
            vendor.bank_name || '',
            vendor.routing_number || '',
            vendor.account_number || '',
            vendor.account_type || '',
            vendor.primary_contact_name || '',
            vendor.primary_contact_email || '',
            vendor.primary_contact_phone || '',
            vendor.ap_contact_name || '',
            vendor.ap_contact_email || '',
            vendor.ap_contact_phone || '',
            vendor.insurance_policy_number || '',
            vendor.insurance_expiration || '',
            vendor.insurance_coverage_amount || '',
            vendor.submitted_at || '',
            vendor.approved_at || ''
        ]);

        // Combine headers and rows
        const csv = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=vendors-${Date.now()}.csv`);
        res.send(csv);

    } catch (error) {
        console.error('Error exporting CSV:', error);
        res.status(500).json({
            success: false,
            message: 'Error exporting CSV',
            error: error.message
        });
    }
});

// ============================================
// ADMIN DASHBOARD (password protected)
// ============================================

app.get('/admin', adminAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log(`🚀 VendorFlow server running on http://localhost:${PORT}`);
    console.log(`📊 Admin dashboard: http://localhost:${PORT}/admin`);
    console.log(`📝 Vendor form: http://localhost:${PORT}/vendor-form.html`);
});
