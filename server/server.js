const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/profile-pictures';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Use userId in filename to ensure uniqueness and easy cleanup
    const uniqueSuffix = `${req.user.userId}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueSuffix);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

// Enable CORS for all routes with more specific options
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Increase payload size limit for base64 images
app.use(express.json({ 
  limit: '50mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({ message: 'Invalid JSON' });
      throw new Error('Invalid JSON');
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Add request logging middleware
app.use((req, res, next) => {
  console.log('=== Incoming Request ===');
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', typeof req.body === 'object' ? JSON.stringify(req.body, null, 2) : 'Stream/Buffer');
  next();
});

// Debug middleware to log all registered routes
app.use((req, res, next) => {
  const routes = app._router.stack
    .filter(r => r.route)
    .map(r => ({
      path: r.route.path,
      methods: Object.keys(r.route.methods)
    }));
  console.log('=== Registered Routes ===');
  console.log(JSON.stringify(routes, null, 2));
  next();
});

// Handle OPTIONS requests
app.options('*', cors());

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  next();
};

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    console.log('=== Login Request ===');
    const { email, password } = req.body;
    console.log('Email:', email);

    // Get user data with explicit field selection and debug logging
    const query = `
      SELECT 
        id, 
        firstName, 
        lastName, 
        email, 
        role, 
        studentId, 
        college, 
        course,
        contactNumber,
        address,
        profileImage, 
        password
      FROM users 
      WHERE email = ?
    `;
    console.log('Executing query:', query.replace(/\s+/g, ' '));
    console.log('Query parameters:', [email]);
    
    const [users] = await db.execute(query, [email]);
    
    if (users.length === 0) {
      console.log('No user found with email:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];
    console.log('Raw database result:', {
      ...user,
      password: '[HIDDEN]',
      contactNumber: user.contactNumber === null ? 'NULL' : `'${user.contactNumber}'`,
      address: user.address === null ? 'NULL' : `'${user.address}'`
    });

    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '24h' }
    );

    // Convert file path to full URL if profileImage exists
    let profileImageUrl = user.profileImage;
    if (profileImageUrl) {
      const baseUrl = `http://${process.env.HOST || '192.168.254.101'}:${process.env.PORT || 3000}`;
      profileImageUrl = profileImageUrl.startsWith('http') 
        ? profileImageUrl 
        : `${baseUrl}/${profileImageUrl}`;
    }

    // Prepare response data with explicit field handling
    const responseData = {
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        studentId: user.studentId || '',
        college: user.college || '',
        course: user.course || '',
        contactNumber: user.contactNumber || '',
        address: user.address || '',
        profileImage: profileImageUrl || ''
      }
    };

    // Log the exact data being sent
    console.log('Response data being sent:', {
      token: '[HIDDEN]',
      user: {
        ...responseData.user,
        contactNumber: `'${responseData.user.contactNumber}'`,
        address: `'${responseData.user.address}'`
      }
    });

    // Double check the JSON stringification
    const jsonString = JSON.stringify(responseData);
    console.log('Stringified response length:', jsonString.length);
    console.log('Sample of stringified response:', jsonString.substring(0, 100) + '...');
    
    res.json(responseData);
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Registration endpoint
app.post('/api/register', async (req, res) => {
  console.log('=== Registration Request Received ===');
  console.log('Request Body:', {
    ...req.body,
    password: '[HIDDEN]',
    contactNumber: `'${req.body.contactNumber || ''}'`,
    address: `'${req.body.address || ''}'`
  });
  
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      contactNumber,
      password,
      studentId,
      college,
      course,
      address 
    } = req.body;
    
    // Log the extracted data
    console.log('Extracted Data:', {
      firstName,
      lastName,
      email,
      contactNumber: `'${contactNumber || ''}'`,
      studentId,
      college,
      course,
      address: `'${address || ''}'`
    });

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !studentId || !college || !course) {
      console.log('Validation Error: Missing required fields');
      return res.status(400).json({ 
        message: 'Please fill in all required fields',
        missingFields: {
          firstName: !firstName,
          lastName: !lastName,
          email: !email,
          password: !password,
          studentId: !studentId,
          college: !college,
          course: !course
        }
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Validation Error: Invalid email format');
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    console.log('Checking for existing user...');
    // Check if user already exists
    const [existingUsers] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      console.log('Error: User already exists with email:', email);
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    console.log('Checking for existing student ID...');
    // Check if student ID already exists
    const [existingStudentId] = await db.execute('SELECT * FROM users WHERE studentId = ?', [studentId]);
    if (existingStudentId.length > 0) {
      console.log('Error: Student ID already registered:', studentId);
      return res.status(400).json({ message: 'Student ID is already registered' });
    }

    console.log('Hashing password...');
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Prepare query with proper empty string handling
    const query = `
      INSERT INTO users (
        firstName, 
        lastName, 
        email, 
        contactNumber, 
        password, 
        studentId, 
        college, 
        course, 
        address,
        role
      ) VALUES (
        ?, ?, ?, 
        CASE WHEN ? IS NULL OR ? = '' THEN '' ELSE ? END,
        ?,
        ?, ?, ?,
        CASE WHEN ? IS NULL OR ? = '' THEN '' ELSE ? END,
        'user'
      )
    `;

    // Prepare values with explicit empty string handling
    const values = [
      firstName,
      lastName,
      email,
      contactNumber, contactNumber, contactNumber,
      hashedPassword,
      studentId,
      college,
      course,
      address, address, address
    ];

    console.log('Executing SQL query with values:', {
      query: query.replace(/\s+/g, ' '),
      values: values.map((v, i) => i === 6 ? '[HIDDEN]' : v)
    });

    // Execute the query
    const [result] = await db.execute(query, values);

    console.log('Registration successful! User ID:', result.insertId);
    res.status(201).json({
      message: 'User registered successfully',
      email: email
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ 
      message: 'Registration failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Protected route - Dashboard
app.get('/api/dashboard', authenticateToken, async (req, res) => {
  try {
    // Get dashboard data
    const [totalApplicants] = await db.execute('SELECT COUNT(*) as total FROM applications');
    const [approvedApplications] = await db.execute('SELECT COUNT(*) as approved FROM applications WHERE status = "approved"');
    const [pendingApplications] = await db.execute('SELECT COUNT(*) as pending FROM applications WHERE status = "pending"');

    res.json({
      totalApplicants: totalApplicants[0].total,
      approvedApplications: approvedApplications[0].approved,
      pendingApplications: pendingApplications[0].pending
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin route - Get all users
app.get('/api/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [users] = await db.execute('SELECT id, firstName, lastName, email, studentId, college, course, role, created_at FROM users');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin route - Update user role
app.patch('/api/users/:id/role', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    await db.execute('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add request timeout middleware
app.use((req, res, next) => {
  // Set timeout to 2 minutes for large uploads
  req.setTimeout(120000);
  res.setTimeout(120000);
  next();
});

// Profile picture upload endpoint
app.post('/api/users/profile-picture', authenticateToken, upload.single('profileImage'), async (req, res) => {
  try {
    console.log('=== Profile Picture Upload ===');
    console.log('User ID:', req.user.userId);
    
    if (!req.file) {
      console.log('Error: No image provided');
      return res.status(400).json({ message: 'No image provided' });
    }

    // Delete old profile picture if it exists
    const [oldUser] = await db.execute('SELECT profileImage FROM users WHERE id = ?', [req.user.userId]);
    if (oldUser[0].profileImage) {
      const oldPath = path.join(__dirname, oldUser[0].profileImage);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Save file path to database (relative to server root)
    const relativeFilePath = req.file.path.replace(/\\/g, '/'); // Convert Windows paths to forward slashes
    console.log('Updating profile picture path in database:', relativeFilePath);
    
    await db.execute(
      'UPDATE users SET profileImage = ? WHERE id = ?',
      [relativeFilePath, req.user.userId]
    );

    // Get updated user data
    console.log('Fetching updated user data...');
    const [updatedUser] = await db.execute(
      'SELECT id, firstName, lastName, email, studentId, college, course, contactNumber, address, profileImage, role FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (!updatedUser.length) {
      throw new Error('Failed to fetch updated user data');
    }

    // Convert file path to full URL
    const baseUrl = `http://${process.env.HOST || '192.168.254.101'}:${process.env.PORT || 3000}`;
    const user = {
      ...updatedUser[0],
      profileImage: `${baseUrl}/${updatedUser[0].profileImage}`
    };

    console.log('Profile picture update successful');
    res.json({ 
      message: 'Profile picture updated successfully',
      user: user
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ 
      message: 'Failed to upload profile picture',
      error: error.message
    });
  }
});

// Test endpoint to verify server is running
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', routes: app._router.stack.filter(r => r.route).map(r => r.route.path) });
});

// Update user profile endpoint
app.put(['/api/users/profile', '/api/users/profile/'], authenticateToken, async (req, res) => {
  try {
    console.log('=== Profile Update Request ===');
    console.log('User ID:', req.user.userId);
    console.log('Update data:', {
      ...req.body,
      contactNumber: `'${req.body.contactNumber || ''}'`,
      address: `'${req.body.address || ''}'`
    });

    const {
      firstName,
      lastName,
      email,
      contactNumber,
      address
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      console.log('Validation failed: Missing required fields');
      return res.status(400).json({ 
        message: 'First name, last name, and email are required',
        missing: {
          firstName: !firstName,
          lastName: !lastName,
          email: !email
        }
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Validation failed: Invalid email format');
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check if email is already taken by another user
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, req.user.userId]
    );

    if (existingUsers.length > 0) {
      console.log('Validation failed: Email already taken');
      return res.status(400).json({ message: 'Email is already taken' });
    }

    // Update user profile with proper empty string handling
    const updateQuery = `
      UPDATE users SET 
        firstName = ?,
        lastName = ?,
        email = ?,
        contactNumber = CASE 
          WHEN ? IS NULL OR ? = '' THEN ''
          ELSE ?
        END,
        address = CASE 
          WHEN ? IS NULL OR ? = '' THEN ''
          ELSE ?
        END
      WHERE id = ?
    `;

    const updateValues = [
      firstName,
      lastName,
      email,
      contactNumber, contactNumber, contactNumber,
      address, address, address,
      req.user.userId
    ];

    console.log('Executing update query:', {
      query: updateQuery.replace(/\s+/g, ' '),
      values: updateValues
    });

    await db.execute(updateQuery, updateValues);

    // Get updated user data with explicit handling of empty values
    const selectQuery = `
      SELECT 
        id, firstName, lastName, email, studentId, 
        college, course,
        CASE 
          WHEN contactNumber IS NULL OR contactNumber = '' THEN ''
          ELSE contactNumber 
        END as contactNumber,
        CASE 
          WHEN address IS NULL OR address = '' THEN ''
          ELSE address 
        END as address,
        profileImage, role 
      FROM users 
      WHERE id = ?
    `;

    const [updatedUser] = await db.execute(selectQuery, [req.user.userId]);

    if (!updatedUser.length) {
      throw new Error('Failed to fetch updated user data');
    }

    // Convert file path to full URL if profileImage exists
    let profileImageUrl = updatedUser[0].profileImage;
    if (profileImageUrl) {
      const baseUrl = `http://${process.env.HOST || '192.168.254.101'}:${process.env.PORT || 3000}`;
      profileImageUrl = profileImageUrl.startsWith('http') 
        ? profileImageUrl 
        : `${baseUrl}/${profileImageUrl}`;
    }

    const responseData = {
      ...updatedUser[0],
      profileImage: profileImageUrl,
      contactNumber: updatedUser[0].contactNumber || '',
      address: updatedUser[0].address || ''
    };

    console.log('Profile update successful. Updated data:', {
      ...responseData,
      contactNumber: `'${responseData.contactNumber}'`,
      address: `'${responseData.address}'`
    });
    
    res.json(responseData);
  } catch (error) {
    console.error('Server error updating profile:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ 
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Change password endpoint
app.post('/api/users/change-password', authenticateToken, async (req, res) => {
  try {
    console.log('Password change request received');
    console.log('User ID:', req.user.userId);
    
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      console.log('Missing required fields');
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    // Get user's current password from database
    console.log('Fetching user data...');
    const [users] = await db.execute('SELECT password FROM users WHERE id = ?', [req.user.userId]);
    
    if (users.length === 0) {
      console.log('User not found:', req.user.userId);
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    console.log('Verifying current password...');
    const isValidPassword = await bcrypt.compare(currentPassword, users[0].password);
    if (!isValidPassword) {
      console.log('Invalid current password');
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    console.log('Hashing new password...');
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    console.log('Updating password in database...');
    await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, req.user.userId]);

    console.log('Password updated successfully');
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ 
      message: 'Failed to change password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Serve uploaded files
app.use('/uploads', (req, res, next) => {
  console.log('Serving static file:', req.url);
  next();
}, express.static('uploads'));

// Add a specific route to check if a file exists
app.get('/uploads/*', (req, res, next) => {
  const filePath = path.join(__dirname, req.url);
  console.log('Checking file existence:', filePath);
  if (fs.existsSync(filePath)) {
    console.log('File exists');
    next();
  } else {
    console.log('File not found');
    res.status(404).send('File not found');
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3000;
const HOST = '192.168.254.101'; // Use your local IP address

app.listen(PORT, HOST, () => {
  console.log(`\n=== Server Started ===`);
  console.log(`Server running on port ${PORT}`);
  console.log(`Server bound to ${HOST}`);
  console.log(`API URL: http://${HOST}:${PORT}/api`);
  console.log('\nRegistered Routes:');
  console.log(app._router.stack
    .filter(r => r.route)
    .map(r => `${Object.keys(r.route.methods).join(',')} ${r.route.path}`)
    .join('\n')
  );
}); 