/*
  # Password Manager Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - Auto-generated user ID
      - `email` (text, unique) - User email address
      - `name` (text) - User full name
      - `role` (text) - User role: 'admin', 'team_lead', or 'employee'
      - `created_at` (timestamptz) - Account creation timestamp
      - `created_by` (uuid, nullable) - Reference to admin/team_lead who created the user
    
    - `password_entries`
      - `id` (uuid, primary key) - Auto-generated entry ID
      - `website_name` (text) - Name of the website/service
      - `website_url` (text) - URL of the website
      - `username` (text) - Email or username for the service
      - `password` (text) - Encrypted password
      - `notes` (text, nullable) - Additional notes
      - `otp_required` (boolean) - Whether OTP is required to access this entry
      - `created_by` (uuid) - Reference to admin/team_lead who created the entry
      - `created_at` (timestamptz) - Entry creation timestamp
      - `updated_at` (timestamptz) - Entry last update timestamp
    
    - `password_assignments`
      - `id` (uuid, primary key) - Auto-generated assignment ID
      - `password_entry_id` (uuid) - Reference to password_entries
      - `assigned_to` (uuid) - Reference to user who receives access
      - `assigned_by` (uuid) - Reference to admin/team_lead who assigned
      - `assigned_at` (timestamptz) - Assignment timestamp
      - `notification_sent` (boolean) - Whether notification email was sent
    
    - `otp_requests`
      - `id` (uuid, primary key) - Auto-generated request ID
      - `password_entry_id` (uuid) - Reference to password_entries
      - `requested_by` (uuid) - Reference to employee requesting OTP
      - `otp_code` (text) - Generated OTP code
      - `expires_at` (timestamptz) - OTP expiration time
      - `is_used` (boolean) - Whether OTP has been used
      - `created_at` (timestamptz) - Request creation timestamp

  2. Security
    - Enable RLS on all tables
    - Admin policies: Full access to all records
    - Team Lead policies: Can create entries, view own entries and assignments
    - Employee policies: Can only view entries assigned to them
    - OTP policies: Users can only see their own requests

  3. Important Notes
    - All tables use UUID primary keys with auto-generation
    - Timestamps use `timestamptz` for proper timezone handling
    - Foreign key constraints ensure referential integrity
    - Default values provided for boolean and timestamp fields
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'team_lead', 'employee')),
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id)
);

-- Create password_entries table
CREATE TABLE IF NOT EXISTS password_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  website_name text NOT NULL,
  website_url text NOT NULL,
  username text NOT NULL,
  password text NOT NULL,
  notes text DEFAULT '',
  otp_required boolean DEFAULT false,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create password_assignments table
CREATE TABLE IF NOT EXISTS password_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  password_entry_id uuid NOT NULL REFERENCES password_entries(id) ON DELETE CASCADE,
  assigned_to uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_by uuid NOT NULL REFERENCES users(id),
  assigned_at timestamptz DEFAULT now(),
  notification_sent boolean DEFAULT false,
  UNIQUE(password_entry_id, assigned_to)
);

-- Create otp_requests table
CREATE TABLE IF NOT EXISTS otp_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  password_entry_id uuid NOT NULL REFERENCES password_entries(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  otp_code text NOT NULL,
  expires_at timestamptz NOT NULL,
  is_used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_requests ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
    OR auth.uid() = id
  );

CREATE POLICY "Admins can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Password entries policies
CREATE POLICY "Admins can view all password entries"
  ON password_entries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "Team leads can view their own entries"
  ON password_entries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role = 'team_lead' AND created_by = auth.uid()
    )
  );

CREATE POLICY "Employees can view assigned entries"
  ON password_entries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM password_assignments pa
      WHERE pa.password_entry_id = id AND pa.assigned_to = auth.uid()
    )
  );

CREATE POLICY "Admins can insert password entries"
  ON password_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'team_lead')
    )
  );

CREATE POLICY "Admins and team leads can update their entries"
  ON password_entries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND (u.role = 'admin' OR (u.role = 'team_lead' AND created_by = auth.uid()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND (u.role = 'admin' OR (u.role = 'team_lead' AND created_by = auth.uid()))
    )
  );

CREATE POLICY "Admins and team leads can delete their entries"
  ON password_entries FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND (u.role = 'admin' OR (u.role = 'team_lead' AND created_by = auth.uid()))
    )
  );

-- Password assignments policies
CREATE POLICY "Users can view assignments related to them"
  ON password_assignments FOR SELECT
  TO authenticated
  USING (
    assigned_to = auth.uid()
    OR assigned_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "Admins and team leads can create assignments"
  ON password_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'team_lead')
    )
  );

CREATE POLICY "Admins and team leads can delete assignments"
  ON password_assignments FOR DELETE
  TO authenticated
  USING (
    assigned_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- OTP requests policies
CREATE POLICY "Users can view their own OTP requests"
  ON otp_requests FOR SELECT
  TO authenticated
  USING (requested_by = auth.uid());

CREATE POLICY "Employees can create OTP requests"
  ON otp_requests FOR INSERT
  TO authenticated
  WITH CHECK (requested_by = auth.uid());

CREATE POLICY "Users can update their own OTP requests"
  ON otp_requests FOR UPDATE
  TO authenticated
  USING (requested_by = auth.uid())
  WITH CHECK (requested_by = auth.uid());

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_password_entries_created_by ON password_entries(created_by);
CREATE INDEX IF NOT EXISTS idx_password_assignments_assigned_to ON password_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_password_assignments_password_entry_id ON password_assignments(password_entry_id);
CREATE INDEX IF NOT EXISTS idx_otp_requests_expires_at ON otp_requests(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_requests_requested_by ON otp_requests(requested_by);