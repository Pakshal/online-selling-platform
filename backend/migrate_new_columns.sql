-- Migration: Add new columns for v2 features
-- Run this against your Railway PostgreSQL database when upgrading an existing deployment

-- Add phone_number to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

-- Add must_change_password to users table  
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;

-- Add customer_id FK to orders table (links a registered customer to their order)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES users(id) ON DELETE SET NULL;
