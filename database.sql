-- VendorFlow Database Schema

CREATE TABLE IF NOT EXISTS vendors (
    id SERIAL PRIMARY KEY,
    
    -- Company Info
    company_name VARCHAR(255) NOT NULL,
    dba VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip VARCHAR(20),
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    business_type VARCHAR(100),
    
    -- Tax Info
    ein VARCHAR(20),
    tax_classification VARCHAR(100),
    w9_filename VARCHAR(255),
    w9_filepath TEXT,
    
    -- Banking Info
    bank_name VARCHAR(255),
    account_holder VARCHAR(255),
    routing_number VARCHAR(20),
    account_number VARCHAR(100),
    account_type VARCHAR(50),
    
    -- Insurance Info
    insurance_policy_number VARCHAR(100),
    insurance_expiration DATE,
    insurance_certificate_filename VARCHAR(255),
    insurance_certificate_filepath TEXT,
    insurance_coverage_amount DECIMAL(12, 2),
    
    -- Contact Info
    primary_contact_name VARCHAR(255),
    primary_contact_email VARCHAR(255),
    primary_contact_phone VARCHAR(50),
    ap_contact_name VARCHAR(255),
    ap_contact_email VARCHAR(255),
    ap_contact_phone VARCHAR(50),
    
    -- Status & Metadata
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP,
    approved_at TIMESTAMP,
    approved_by VARCHAR(255)
);

-- Create index for faster queries
CREATE INDEX idx_vendors_status ON vendors(status);
CREATE INDEX idx_vendors_created_at ON vendors(created_at DESC);
