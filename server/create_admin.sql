-- Check if admin exists first
SET @admin_email = 'admin@sdms.edu.ph';
SET @admin_password = '$2a$10$YourHashedPasswordHere'; -- This will be replaced by the setup script

INSERT INTO users (
  firstName,
  lastName,
  email,
  password,
  studentId,
  college,
  course,
  contactNumber,
  role
)
SELECT 
  'System',
  'Administrator',
  @admin_email,
  @admin_password,
  'ADMIN-001',
  'Administration',
  'System Administration',
  '09123456789',
  'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = @admin_email
); 