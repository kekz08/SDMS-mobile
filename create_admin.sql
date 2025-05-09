-- Create admin user with password 'admin123'
INSERT INTO users (
  firstName,
  lastName,
  email,
  password,
  role,
  studentId,
  college,
  course
) VALUES (
  'Admin',
  'User',
  'admin@sdms.com',
  '$2b$10$guWNdcBubZ3HGFsUcDhDlO1pm7S/B.n6huGumSSUzETVRmTs4SQOy',
  'admin',
  'ADMIN001',
  'Administration',
  'System Administration'
); 