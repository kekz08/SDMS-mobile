const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken, isAdmin } = require('./middleware/auth');
require('dotenv').config();

// Import config
const config = require('../config').default;

const app = express();

// Configure multer for profile pictures
const profileStorage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const dir = path.join(__dirname, 'uploads', 'profiles');
    try {
      await fs.promises.mkdir(dir, { recursive: true });
      cb(null, dir);
    } catch (err) {
      cb(err);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure multer for scholarship documents
const documentStorage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const dir = path.join(__dirname, 'uploads', 'documents');
    try {
      await fs.promises.mkdir(dir, { recursive: true });
      cb(null, dir);
    } catch (err) {
      cb(err);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'doc-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadProfile = multer({ 
  storage: profileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

const uploadDocuments = multer({ 
  storage: documentStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
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
    if (buf.length === 0) {
      return; // Skip JSON parsing for empty bodies
    }
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
        password,
        isVerified
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
      role: user.role,
      contactNumber: user.contactNumber === null ? 'NULL' : `'${user.contactNumber}'`,
      address: user.address === null ? 'NULL' : `'${user.address}'`
    });

    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Include role in token payload
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role // Ensure role is included
      },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '24h' }
    );

    // Convert file path to full URL if profileImage exists
    let profileImageUrl = user.profileImage;
    if (profileImageUrl && !profileImageUrl.startsWith('http')) {
      profileImageUrl = `${config.BASE_URL}/${profileImageUrl}`;
    }

    // Send response with user data
    res.json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        college: user.college,
        course: user.course,
        contactNumber: user.contactNumber,
        address: user.address,
        profileImage: profileImageUrl,
        isVerified: user.isVerified
      }
    });
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
        role,
        isVerified
      ) VALUES (
        ?, ?, ?, 
        CASE WHEN ? IS NULL OR ? = '' THEN '' ELSE ? END,
        ?,
        ?, ?, ?,
        CASE WHEN ? IS NULL OR ? = '' THEN '' ELSE ? END,
        'user',
        FALSE
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
app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    console.log('=== Fetching All Users ===');
    console.log('Admin ID:', req.user.userId);

    const [users] = await db.execute(`
      SELECT 
        id, 
        firstName, 
        lastName, 
        email, 
        studentId, 
        college, 
        course, 
        role, 
        contactNumber,
        address,
        profileImage,
        isVerified,
        createdAt,
        updatedAt
      FROM users
      ORDER BY createdAt DESC
    `);

    // Convert file paths to full URLs for profile images
    const usersWithFullUrls = users.map(user => ({
      ...user,
      profileImage: user.profileImage 
        ? (user.profileImage.startsWith('http') 
          ? user.profileImage 
          : `${config.BASE_URL}/${user.profileImage}`)
        : null
    }));

    console.log(`Found ${users.length} users`);
    res.json(usersWithFullUrls);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      message: 'Failed to fetch users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Admin route - Update user role
app.patch('/api/admin/users/:id/role', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    await db.execute('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Failed to update user role' });
  }
});

// Admin route - Verify user
app.patch('/api/admin/users/:id/verify', authenticateToken, isAdmin, async (req, res) => {
  try {
    console.log('=== Verifying User ===');
    const { id } = req.params;
    console.log('User ID:', id);

    // Check if user exists
    const [user] = await db.execute('SELECT id, firstName, lastName, isVerified FROM users WHERE id = ?', [id]);
    console.log('User data:', user[0]);
    
    if (user.length === 0) {
      console.log('User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is already verified
    if (user[0].isVerified === true) {
      console.log('User already verified');
      return res.status(400).json({ message: 'User is already verified' });
    }

    // Update user verification status
    console.log('Updating user verification status');
    await db.execute('UPDATE users SET isVerified = TRUE WHERE id = ?', [id]);

    // Create a detailed notification for the user
    const notificationTitle = 'Account Verified Successfully';
    const notificationMessage = `Dear ${user[0].firstName} ${user[0].lastName},\n\nYour account has been verified by an administrator. You now have full access to all features of the Scholarship Management System, including:\n\n• Educational Aids\n• Application Status\n• Announcements\n• Concerns\n• Profile Management\n\nWelcome to the platform!`;

    console.log('Creating notification');
    await db.execute(
      'INSERT INTO notifications (userId, title, message, type) VALUES (?, ?, ?, ?)',
      [
        id,
        notificationTitle,
        notificationMessage,
        'success'
      ]
    );

    console.log('Sending success response');
    return res.status(200).json({ 
      success: true,
      message: 'User verified successfully',
      notification: {
        title: notificationTitle,
        message: notificationMessage
      }
    });
  } catch (error) {
    console.error('Error in verify user endpoint:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to verify user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Admin route - Delete user
app.delete('/api/admin/users/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const [user] = await db.execute('SELECT id, profileImage FROM users WHERE id = ?', [id]);
    if (user.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user's profile image if it exists
    if (user[0].profileImage) {
      const imagePath = path.join(__dirname, user[0].profileImage);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete user's applications and related documents
    const [applications] = await db.execute(
      'SELECT documents FROM applications WHERE userId = ?',
      [id]
    );

    // Delete application documents
    for (const app of applications) {
      if (app.documents) {
        const docs = JSON.parse(app.documents);
        for (const path of Object.values(docs)) {
          const docPath = path.join(__dirname, path);
          if (fs.existsSync(docPath)) {
            fs.unlinkSync(docPath);
          }
        }
      }
    }

    // Delete user's applications
    await db.execute('DELETE FROM applications WHERE userId = ?', [id]);

    // Delete user's notifications
    await db.execute('DELETE FROM notifications WHERE userId = ?', [id]);

    // Finally, delete the user
    await db.execute('DELETE FROM users WHERE id = ?', [id]);

    res.json({ message: 'User and all related data deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
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
app.post('/api/users/profile-picture', authenticateToken, uploadProfile.single('profileImage'), async (req, res) => {
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
    const profileImageUrl = updatedUser[0].profileImage.startsWith('http') 
      ? updatedUser[0].profileImage 
      : `${config.BASE_URL}/${updatedUser[0].profileImage}`;

    const responseData = {
      ...updatedUser[0],
      profileImage: profileImageUrl,
      contactNumber: updatedUser[0].contactNumber || '',
      address: updatedUser[0].address || ''
    };

    console.log('Profile picture update successful');
    res.json({ 
      message: 'Profile picture updated successfully',
      user: responseData
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
      profileImageUrl = profileImageUrl.startsWith('http') 
        ? profileImageUrl 
        : `${config.BASE_URL}/${profileImageUrl}`;
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

// Serve uploaded files from both directories
app.use('/uploads/profiles', express.static(path.join(__dirname, 'uploads', 'profiles')));
app.use('/uploads/documents', express.static(path.join(__dirname, 'uploads', 'documents')));

// Add specific routes to check if files exist
app.get('/uploads/profiles/*', (req, res, next) => {
  const profilePath = path.join(__dirname, req.url);
  console.log('Checking profile file existence:', profilePath);
  if (fs.existsSync(profilePath)) {
    console.log('Profile file exists');
    next();
  } else {
    console.log('Profile file not found');
    res.status(404).send('File not found');
  }
});

app.get('/uploads/documents/*', (req, res, next) => {
  const documentPath = path.join(__dirname, req.url);
  console.log('Checking document file existence:', documentPath);
  if (fs.existsSync(documentPath)) {
    console.log('Document file exists');
    next();
  } else {
    console.log('Document file not found');
    res.status(404).send('File not found');
  }
});

// Add a route to serve files directly
app.get('/uploads/:type/:filename', (req, res) => {
  const { type, filename } = req.params;
  const uploadPath = path.join(__dirname, 'uploads', type, filename);
  
  console.log('Attempting to serve file:', uploadPath);
  
  if (fs.existsSync(uploadPath)) {
    res.sendFile(uploadPath);
  } else {
    console.log('File not found:', uploadPath);
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

// Admin route - Get dashboard statistics
app.get('/api/admin/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [totalUsers] = await db.execute('SELECT COUNT(*) as total FROM users');
    const [totalScholarships] = await db.execute('SELECT COUNT(*) as total FROM scholarships WHERE status = "active"');
    const [pendingApplications] = await db.execute('SELECT COUNT(*) as total FROM applications WHERE status = "pending"');
    const [approvedApplications] = await db.execute('SELECT COUNT(*) as total FROM applications WHERE status = "approved"');
    const [pendingVerifications] = await db.execute('SELECT COUNT(*) as total FROM users WHERE isVerified = FALSE AND role != "admin"');

    res.json({
      totalUsers: totalUsers[0].total,
      activeScholarships: totalScholarships[0].total,
      pendingApplications: pendingApplications[0].total,
      approvedApplications: approvedApplications[0].total,
      pendingVerifications: pendingVerifications[0].total
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Failed to fetch admin statistics' });
  }
});

// Get all scholarships endpoint
app.get('/api/scholarships', async (req, res) => {
  try {
    console.log('=== Fetching Scholarships ===');
    
    const query = `
      SELECT 
        id,
        name,
        description,
        deadline,
        slots,
        requirements,
        status,
        amount,
        criteria,
        documents,
        createdAt,
        updatedAt
      FROM scholarships
      ORDER BY createdAt DESC
    `;
    
    const [scholarships] = await db.execute(query);
    
    // Format the response data
    const formattedScholarships = scholarships.map(scholarship => ({
      id: scholarship.id,
      name: scholarship.name,
      description: scholarship.description,
      deadline: scholarship.deadline,
      slots: scholarship.slots,
      requirements: scholarship.requirements,
      status: scholarship.status,
      amount: parseFloat(scholarship.amount),
      criteria: scholarship.criteria,
      documents: scholarship.documents,
      createdAt: scholarship.createdAt,
      updatedAt: scholarship.updatedAt
    }));

    console.log(`Found ${formattedScholarships.length} scholarships`);
    res.json(formattedScholarships);
  } catch (error) {
    console.error('Error fetching scholarships:', error);
    res.status(500).json({ 
      message: 'Failed to fetch scholarships',
      error: error.message 
    });
  }
});

// Get single scholarship (public)
app.get('/api/scholarships/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [scholarships] = await db.execute(`
      SELECT 
        id, name, description, deadline, slots, 
        requirements, status, amount, criteria, 
        documents, createdAt, updatedAt,
        (SELECT COUNT(*) FROM applications WHERE scholarshipId = scholarships.id) as applicants
      FROM scholarships 
      WHERE id = ?
    `, [id]);

    if (scholarships.length === 0) {
      return res.status(404).json({ message: 'Scholarship not found' });
    }

    res.json(scholarships[0]);
  } catch (error) {
    console.error('Error fetching scholarship:', error);
    res.status(500).json({ message: 'Failed to fetch scholarship' });
  }
});

// Admin route - Get all scholarships (including inactive)
app.get('/api/admin/scholarships', authenticateToken, isAdmin, async (req, res) => {
  try {
    console.log('=== Fetching Admin Scholarships ===');
    console.log('User:', req.user);

    // First, check if applications table exists
    const [tables] = await db.execute("SHOW TABLES LIKE 'applications'");
    const applicationsExist = tables.length > 0;

    const query = applicationsExist ? `
      SELECT 
        id, name, description, deadline, slots, 
        requirements, status, amount, criteria, 
        documents, createdAt, updatedAt,
        (SELECT COUNT(*) FROM applications WHERE scholarshipId = scholarships.id) as applicants
      FROM scholarships
      ORDER BY createdAt DESC
    ` : `
      SELECT 
        id, name, description, deadline, slots, 
        requirements, status, amount, criteria, 
        documents, createdAt, updatedAt,
        0 as applicants
      FROM scholarships
      ORDER BY createdAt DESC
    `;

    console.log('Executing query:', query);

    const [scholarships] = await db.execute(query).catch(err => {
      console.error('Database error:', err);
      console.error('SQL State:', err.sqlState);
      console.error('Error Code:', err.code);
      console.error('Error Message:', err.message);
      throw err;
    });

    console.log('Successfully fetched scholarships:', scholarships);
    res.json(scholarships);
  } catch (error) {
    console.error('Error fetching scholarships:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Failed to fetch scholarships',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Admin route - Create scholarship
app.post('/api/admin/scholarships', authenticateToken, isAdmin, async (req, res) => {
  try {
    console.log('=== Create Scholarship Request ===');
    console.log('User:', req.user);
    console.log('Request body:', req.body);
    
    const { 
      name, description, deadline, slots, 
      requirements, amount, criteria, documents 
    } = req.body;

    // Validate required fields
    if (!name || !description || !deadline || !slots || !requirements || !amount) {
      console.log('Validation failed - Missing fields:', {
        name: !name,
        description: !description,
        deadline: !deadline,
        slots: !slots,
        requirements: !requirements,
        amount: !amount
      });
      return res.status(400).json({ 
        message: 'Required fields missing',
        required: {
          name: !name,
          description: !description,
          deadline: !deadline,
          slots: !slots,
          requirements: !requirements,
          amount: !amount
        }
      });
    }

    // Validate numeric fields
    if (isNaN(slots) || slots <= 0) {
      console.log('Validation failed - Invalid slots:', slots);
      return res.status(400).json({ message: 'Invalid number of slots' });
    }
    if (isNaN(amount) || amount <= 0) {
      console.log('Validation failed - Invalid amount:', amount);
      return res.status(400).json({ message: 'Invalid scholarship amount' });
    }

    // Parse deadline to MySQL date format
    const parsedDeadline = new Date(deadline).toISOString().split('T')[0];
    console.log('Parsed deadline:', parsedDeadline);

    console.log('Inserting scholarship into database with values:', {
      name, description, deadline: parsedDeadline, slots, requirements, amount,
      criteria: criteria || null,
      documents: documents || null
    });

    const [result] = await db.execute(
      `INSERT INTO scholarships (
        name, description, deadline, slots, 
        requirements, amount, criteria, documents
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, description, parsedDeadline, slots, requirements, amount, criteria || null, documents || null]
    ).catch(err => {
      console.error('Database error:', err);
      console.error('SQL State:', err.sqlState);
      console.error('Error Code:', err.code);
      console.error('Error Message:', err.message);
      throw err;
    });

    console.log('Scholarship created successfully:', {
      scholarshipId: result.insertId
    });

    res.status(201).json({
      message: 'Scholarship created successfully',
      scholarshipId: result.insertId
    });
  } catch (error) {
    console.error('Error creating scholarship:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Failed to create scholarship',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Admin route - Update scholarship
app.put('/api/admin/scholarships/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    console.log('=== Update Scholarship Request ===');
    console.log('User:', req.user);
    console.log('Scholarship ID:', req.params.id);
    console.log('Request body:', req.body);

    const { id } = req.params;
    const { 
      name, description, deadline, slots, 
      requirements, status, amount, criteria, documents 
    } = req.body;

    // Validate required fields
    if (!name || !description || !deadline || !slots || !requirements || !status || !amount) {
      console.log('Validation failed - Missing fields:', {
        name: !name,
        description: !description,
        deadline: !deadline,
        slots: !slots,
        requirements: !requirements,
        status: !status,
        amount: !amount
      });
      return res.status(400).json({ 
        message: 'Required fields missing',
        required: {
          name: !name,
          description: !description,
          deadline: !deadline,
          slots: !slots,
          requirements: !requirements,
          status: !status,
          amount: !amount
        }
      });
    }

    // Validate numeric fields
    if (isNaN(slots) || slots <= 0) {
      console.log('Validation failed - Invalid slots:', slots);
      return res.status(400).json({ message: 'Invalid number of slots' });
    }
    if (isNaN(amount) || amount <= 0) {
      console.log('Validation failed - Invalid amount:', amount);
      return res.status(400).json({ message: 'Invalid scholarship amount' });
    }

    // Validate status
    if (!['active', 'inactive'].includes(status)) {
      console.log('Validation failed - Invalid status:', status);
      return res.status(400).json({ message: 'Invalid status value' });
    }

    // Parse deadline to MySQL date format
    const parsedDeadline = new Date(deadline).toISOString().split('T')[0];
    console.log('Parsed deadline:', parsedDeadline);

    // Check if scholarship exists
    console.log('Checking if scholarship exists...');
    const [existing] = await db.execute('SELECT id FROM scholarships WHERE id = ?', [id])
      .catch(err => {
        console.error('Database error checking scholarship:', err);
        throw err;
      });

    if (existing.length === 0) {
      console.log('Scholarship not found:', id);
      return res.status(404).json({ message: 'Scholarship not found' });
    }

    console.log('Updating scholarship with values:', {
      name, description, deadline: parsedDeadline, slots,
      requirements, status, amount,
      criteria: criteria || null,
      documents: documents || null
    });

    await db.execute(
      `UPDATE scholarships SET 
        name = ?, description = ?, deadline = ?, 
        slots = ?, requirements = ?, status = ?,
        amount = ?, criteria = ?, documents = ?
      WHERE id = ?`,
      [name, description, parsedDeadline, slots, requirements, status, amount, criteria || null, documents || null, id]
    ).catch(err => {
      console.error('Database error updating scholarship:', err);
      console.error('SQL State:', err.sqlState);
      console.error('Error Code:', err.code);
      console.error('Error Message:', err.message);
      throw err;
    });

    console.log('Scholarship updated successfully');
    res.json({ message: 'Scholarship updated successfully' });
  } catch (error) {
    console.error('Error updating scholarship:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Failed to update scholarship',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Admin route - Delete scholarship
app.delete('/api/admin/scholarships/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if scholarship exists
    const [existing] = await db.execute('SELECT id FROM scholarships WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Scholarship not found' });
    }

    // Check if there are any applications for this scholarship
    const [applications] = await db.execute(
      'SELECT COUNT(*) as count FROM applications WHERE scholarshipId = ?', 
      [id]
    );

    if (applications[0].count > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete scholarship with existing applications. Consider marking it as inactive instead.' 
      });
    }

    await db.execute('DELETE FROM scholarships WHERE id = ?', [id]);
    res.json({ message: 'Scholarship deleted successfully' });
  } catch (error) {
    console.error('Error deleting scholarship:', error);
    res.status(500).json({ message: 'Failed to delete scholarship' });
  }
});

// Admin route - Get all applications
app.get('/api/admin/applications', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [applications] = await db.execute(`
      SELECT a.*, 
             u.firstName, u.lastName, u.email, u.studentId, u.contactNumber,
             u.college, u.course,
             s.name as scholarshipName
      FROM applications a
      JOIN users u ON a.userId = u.id
      JOIN scholarships s ON a.scholarshipId = s.id
      ORDER BY a.createdAt DESC
    `);

    // Parse the documents JSON for each application
    const applicationsWithDocs = applications.map(app => {
      let documents = {};
      if (app.documents) {
        if (typeof app.documents === 'string') {
          try {
            documents = JSON.parse(app.documents);
          } catch (err) {
            console.error(`Error parsing documents JSON for application ${app.id}:`, err);
            documents = {};
          }
        } else if (typeof app.documents === 'object') {
          documents = app.documents;
        }
      }
      return {
        ...app,
        documents: documents
      };
    });

    res.json(applicationsWithDocs);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Failed to fetch applications' });
  }
});

// Admin route - Update application status
app.patch('/api/admin/applications/:id/status', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    await db.execute(
      'UPDATE applications SET status = ?, remarks = ? WHERE id = ?',
      [status, remarks || null, id]
    );

    res.json({ message: 'Application status updated successfully' });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ message: 'Failed to update application status' });
  }
});

// Get all announcements (public)
app.get('/api/announcements', async (req, res) => {
  try {
    const [announcements] = await db.execute(`
      SELECT id, title, content, priority, status, createdAt, updatedAt
      FROM announcements
      WHERE status = 'active'
      ORDER BY 
        CASE priority
          WHEN 'high' THEN 1
          WHEN 'normal' THEN 2
          WHEN 'low' THEN 3
        END,
        createdAt DESC
    `);
    res.json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ message: 'Failed to fetch announcements' });
  }
});

// Admin route - Get all announcements (including inactive)
app.get('/api/admin/announcements', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [announcements] = await db.execute(`
      SELECT 
        a.*,
        u.firstName,
        u.lastName
      FROM announcements a
      LEFT JOIN users u ON a.createdBy = u.id
      ORDER BY a.createdAt DESC
    `);

    res.json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ message: 'Failed to fetch announcements' });
  }
});

// Admin route - Create announcement
app.post('/api/admin/announcements', authenticateToken, isAdmin, async (req, res) => {
  try {
    console.log('=== Create Announcement Request ===');
    console.log('Request body:', req.body);
    console.log('User:', req.user);
    
    const { title, content, priority = 'normal', status = 'active', createdBy } = req.body;

    // Validate required fields with detailed logging
    console.log('Validating fields:', { title, content, createdBy });
    if (!title || !content || !createdBy) {
      console.log('Missing required fields:', { title: !title, content: !content, createdBy: !createdBy });
      return res.status(400).json({ 
        message: 'Required fields missing',
        required: {
          title: !title,
          content: !content,
          createdBy: !createdBy
        }
      });
    }

    // Validate priority with logging
    console.log('Validating priority:', priority);
    if (!['high', 'normal', 'low'].includes(priority)) {
      console.log('Invalid priority:', priority);
      return res.status(400).json({ message: 'Invalid priority value' });
    }

    // Validate status with logging
    console.log('Validating status:', status);
    if (!['active', 'inactive'].includes(status)) {
      console.log('Invalid status:', status);
      return res.status(400).json({ message: 'Invalid status value' });
    }

    console.log('Creating announcement with values:', {
      title, content, priority, status, createdBy
    });

    // Log the exact SQL query
    const query = 'INSERT INTO announcements (title, content, priority, status, createdBy) VALUES (?, ?, ?, ?, ?)';
    const values = [title, content, priority, status, createdBy];
    console.log('SQL Query:', query);
    console.log('SQL Values:', values);

    const [result] = await db.execute(query, values);

    console.log('Announcement created successfully:', {
      announcementId: result.insertId
    });

    // Create notifications for all users except admins
    console.log('Creating notifications for users...');
    const [users] = await db.execute('SELECT id FROM users WHERE role = ?', ['user']);
    
    if (users.length > 0) {
      console.log(`Found ${users.length} users to notify`);
      // Escape the title to prevent SQL injection
      const escapedTitle = title.replace(/'/g, "''");
      const notificationValues = users.map(user => 
        `(${user.id}, 'New Announcement: ${escapedTitle}', '${escapedTitle}', 'info')`
      ).join(',');

      const notificationQuery = `
        INSERT INTO notifications (userId, title, message, type)
        VALUES ${notificationValues}
      `;
      console.log('Creating notifications with query:', notificationQuery);
      await db.execute(notificationQuery);
      console.log('Notifications created successfully');
    }

    res.status(201).json({
      message: 'Announcement created successfully',
      announcementId: result.insertId
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      stack: error.stack
    });
    res.status(500).json({ 
      message: 'Failed to create announcement',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Admin route - Update announcement
app.put('/api/admin/announcements/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, priority, status } = req.body;

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({ 
        message: 'Required fields missing',
        required: {
          title: !title,
          content: !content
        }
      });
    }

    // Validate priority
    if (!['high', 'normal', 'low'].includes(priority)) {
      return res.status(400).json({ message: 'Invalid priority value' });
    }

    // Validate status
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const [result] = await db.execute(
      'UPDATE announcements SET title = ?, content = ?, priority = ?, status = ? WHERE id = ?',
      [title, content, priority, status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    res.json({ message: 'Announcement updated successfully' });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ message: 'Failed to update announcement' });
  }
});

// Admin route - Delete announcement
app.delete('/api/admin/announcements/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if announcement exists
    const [existing] = await db.execute('SELECT id FROM announcements WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    await db.execute('DELETE FROM announcements WHERE id = ?', [id]);
    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ message: 'Failed to delete announcement' });
  }
});

// Submit scholarship application
app.post('/api/applications', authenticateToken, uploadDocuments.fields([
  { name: 'reportCard', maxCount: 1 },
  { name: 'brgyClearance', maxCount: 1 },
  { name: 'incomeCertificate', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('=== Submit Application Request ===');
    console.log('User:', req.user);
    console.log('Request body:', req.body);
    console.log('Files:', req.files);

    const { scholarshipId, userId } = req.body;
    const remarks = req.body.remarks || '';

    // Validate required fields
    if (!scholarshipId || !userId || !req.files) {
      console.log('Missing required fields:', {
        scholarshipId: !scholarshipId,
        userId: !userId,
        files: !req.files
      });
      return res.status(400).json({ 
        message: 'Required fields missing',
        required: {
          scholarshipId: !scholarshipId,
          userId: !userId,
          files: !req.files
        }
      });
    }

    // Check if all required files are present
    if (!req.files.reportCard?.[0] || !req.files.brgyClearance?.[0] || !req.files.incomeCertificate?.[0]) {
      console.log('Missing required files:', {
        reportCard: !req.files.reportCard?.[0],
        brgyClearance: !req.files.brgyClearance?.[0],
        incomeCertificate: !req.files.incomeCertificate?.[0]
      });
      return res.status(400).json({ 
        message: 'All required documents must be uploaded',
        missing: {
          reportCard: !req.files.reportCard?.[0],
          brgyClearance: !req.files.brgyClearance?.[0],
          incomeCertificate: !req.files.incomeCertificate?.[0]
        }
      });
    }

    // Check if scholarship exists and is active
    const [scholarships] = await db.execute(
      'SELECT * FROM scholarships WHERE id = ? AND status = "active"',
      [scholarshipId]
    );

    if (scholarships.length === 0) {
      console.log('Scholarship not found or inactive:', scholarshipId);
      return res.status(404).json({ message: 'Scholarship not found or inactive' });
    }

    // Check if user has already applied
    const [existingApplications] = await db.execute(
      'SELECT * FROM applications WHERE userId = ? AND scholarshipId = ?',
      [userId, scholarshipId]
    );

    if (existingApplications.length > 0) {
      console.log('User already applied:', { userId, scholarshipId });
      return res.status(400).json({ message: 'You have already applied for this scholarship' });
    }

    // Prepare documents object with file paths
    const makeRelative = (absPath) => {
      const idx = absPath.replace(/\\/g, '/').indexOf('uploads/');
      return idx !== -1 ? absPath.replace(/\\/g, '/').substring(idx) : absPath.replace(/\\/g, '/');
    };

    const documents = {
      reportCard: req.files.reportCard?.[0] ? makeRelative(req.files.reportCard[0].path) : null,
      brgyClearance: req.files.brgyClearance?.[0] ? makeRelative(req.files.brgyClearance[0].path) : null,
      incomeCertificate: req.files.incomeCertificate?.[0] ? makeRelative(req.files.incomeCertificate[0].path) : null
    };
    console.log('Will save documents as:', documents);

    // Insert application
    const [result] = await db.execute(
      `INSERT INTO applications (
        userId, scholarshipId, status, remarks, documents
      ) VALUES (?, ?, 'pending', ?, ?)`,
      [userId, scholarshipId, remarks, JSON.stringify(documents)]
    );

    console.log('Application submitted successfully:', {
      applicationId: result.insertId,
      documents: documents
    });

    res.status(201).json({
      message: 'Application submitted successfully',
      applicationId: result.insertId,
      documents: documents
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({ 
      message: 'Failed to submit application',
      error: error.message 
    });
  }
});

// Get user's applications
app.get('/api/user/applications', authenticateToken, async (req, res) => {
  try {
    console.log('=== Fetching User Applications ===');
    console.log('User ID:', req.user.userId);

    // First check if the applications table exists
    const [tables] = await db.execute("SHOW TABLES LIKE 'applications'");
    if (tables.length === 0) {
      console.log('Applications table does not exist');
      return res.json({
        statusCounts: { approved: 0, pending: 0, rejected: 0 },
        applications: []
      });
    }

    // Get application counts by status
    console.log('Fetching status counts...');
    const [statusCounts] = await db.execute(`
      SELECT 
        IFNULL(status, 'pending') as status,
        COUNT(*) as count
      FROM applications
      WHERE userId = ?
      GROUP BY status
    `, [req.user.userId]);

    console.log('Status counts:', statusCounts);

    // Get detailed application information
    console.log('Fetching application details...');
    const [applications] = await db.execute(`
      SELECT 
        a.*,
        s.name as scholarshipName,
        s.amount as scholarshipAmount
      FROM applications a
      JOIN scholarships s ON a.scholarshipId = s.id
      WHERE a.userId = ?
      ORDER BY a.createdAt DESC
    `, [req.user.userId]);

    console.log('Applications found:', applications.length);

    // Format the response
    const counts = {
      approved: 0,
      pending: 0,
      rejected: 0
    };

    statusCounts.forEach(({ status, count }) => {
      counts[status.toLowerCase()] = count;
    });

    console.log('Final counts:', counts);
    console.log('Sending response...');

    // Parse the documents JSON for each application
    const applicationsWithDocs = applications.map(app => {
      let documents = {};
      if (app.documents) {
        if (typeof app.documents === 'string') {
          try {
            documents = JSON.parse(app.documents);
          } catch (err) {
            console.error(`Error parsing documents JSON for application ${app.id}:`, err);
            documents = {};
          }
        } else if (typeof app.documents === 'object') {
          documents = app.documents;
        }
      }
      return {
        ...app,
        documents: documents
      };
    });

    res.json({
      statusCounts: counts,
      applications: applicationsWithDocs
    });
  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    res.status(500).json({ 
      message: 'Failed to fetch applications',
      error: error.message
    });
  }
});

// Create a notification
app.post('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const { userId, title, message, type = 'info' } = req.body;

    // Validate required fields
    if (!userId || !title || !message) {
      return res.status(400).json({ 
        message: 'Required fields missing',
        required: {
          userId: !userId,
          title: !title,
          message: !message
        }
      });
    }

    // Validate type
    if (!['success', 'error', 'info'].includes(type)) {
      return res.status(400).json({ message: 'Invalid notification type' });
    }

    const [result] = await db.execute(
      'INSERT INTO notifications (userId, title, message, type) VALUES (?, ?, ?, ?)',
      [userId, title, message, type]
    );

    res.status(201).json({
      message: 'Notification created successfully',
      notificationId: result.insertId
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ message: 'Failed to create notification' });
  }
});

// Get user notifications
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [notifications] = await db.execute(
      'SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC',
      [userId]
    );

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
app.patch('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.userId;

    // First check if the notification belongs to the user
    const [notification] = await db.execute(
      'SELECT userId FROM notifications WHERE id = ?',
      [notificationId]
    );

    if (notification.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification[0].userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this notification' });
    }

    await db.execute(
      'UPDATE notifications SET isRead = TRUE WHERE id = ?',
      [notificationId]
    );

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

// Get unread notification count
app.get('/api/notifications/unread/count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [result] = await db.execute(
      'SELECT COUNT(*) as count FROM notifications WHERE userId = ? AND isRead = FALSE',
      [userId]
    );

    res.json({ count: result[0].count });
  } catch (error) {
    console.error('Error fetching unread notification count:', error);
    res.status(500).json({ message: 'Failed to fetch unread notification count' });
  }
});

// Admin route - Get reports and analytics
app.get('/api/admin/reports', authenticateToken, isAdmin, async (req, res) => {
  try {
    console.log('=== Fetching Admin Reports ===');
    console.log('User ID:', req.user.userId);

    // Get total users
    const [totalUsers] = await db.execute('SELECT COUNT(*) as count FROM users');

    // Get total scholarships
    const [totalScholarships] = await db.execute('SELECT COUNT(*) as count FROM scholarships');

    // Get total applications and approval rate
    const [applications] = await db.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved
      FROM applications
    `);

    // Calculate approval rate
    const approvalRate = applications[0].total > 0 
      ? Math.round((applications[0].approved / applications[0].total) * 100) 
      : 0;

    // Get monthly applications for the last 6 months
    const [monthlyApplications] = await db.execute(`
      SELECT 
        DATE_FORMAT(createdAt, '%b') as month,
        COUNT(*) as count
      FROM applications
      WHERE createdAt >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
      ORDER BY createdAt ASC
    `);

    // Get scholarship distribution
    const [scholarshipDistribution] = await db.execute(`
      SELECT 
        s.name,
        COUNT(a.id) as count
      FROM scholarships s
      LEFT JOIN applications a ON s.id = a.scholarshipId
      GROUP BY s.id, s.name
      ORDER BY count DESC
      LIMIT 5
    `);

    // Get status distribution
    const [statusDistribution] = await db.execute(`
      SELECT 
        status,
        COUNT(*) as count
      FROM applications
      GROUP BY status
    `);

    const reportData = {
      totalUsers: totalUsers[0].count,
      totalScholarships: totalScholarships[0].count,
      totalApplications: applications[0].total,
      approvalRate: approvalRate,
      monthlyApplications: monthlyApplications,
      scholarshipDistribution: scholarshipDistribution,
      statusDistribution: statusDistribution
    };

    console.log('Report data:', reportData);
    res.json(reportData);
  } catch (error) {
    console.error('Error generating reports:', error);
    res.status(500).json({ 
      message: 'Failed to generate reports',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Concerns API endpoints
app.get('/api/concerns', authenticateToken, async (req, res) => {
  try {
    console.log('=== Fetching User Concerns ===');
    console.log('User:', req.user);
    
    const userId = req.user.userId;
    const [concerns] = await db.execute(
      'SELECT * FROM concerns WHERE userId = ? ORDER BY createdAt DESC',
      [userId]
    );

    console.log('Found concerns:', concerns.length);
    res.json(concerns); // Send the array directly, not wrapped in an object
  } catch (error) {
    console.error('Error fetching concerns:', error);
    res.status(500).json({ message: 'Failed to fetch concerns' });
  }
});

app.post('/api/concerns', authenticateToken, async (req, res) => {
  let connection;
  try {
    console.log('=== Creating New Concern ===');
    console.log('Request body:', req.body);
    console.log('User:', req.user);

    const { title, message, category } = req.body;
    const userId = req.user.userId;

    // Validate required fields
    if (!title || !message || !category) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: {
          title: !title,
          message: !message,
          category: !category
        }
      });
    }

    // Validate category
    const validCategories = ['scholarship', 'application', 'technical', 'other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ 
        message: 'Invalid category',
        validCategories
      });
    }

    // Get a connection and start transaction
    connection = await db.getConnection();
    await connection.beginTransaction();
    console.log('Transaction started');

    // Insert the concern
    const [result] = await connection.execute(
      'INSERT INTO concerns (title, message, category, userId) VALUES (?, ?, ?, ?)',
      [title, message, category, userId]
    );
    console.log('Concern created with ID:', result.insertId);

    // Get the created concern
    const [concerns] = await connection.execute(
      'SELECT * FROM concerns WHERE id = ?',
      [result.insertId]
    );

    if (!concerns.length) {
      throw new Error('Failed to retrieve created concern');
    }

    const createdConcern = concerns[0];
    console.log('Created concern:', createdConcern);

    // Find admin users
    console.log('Finding admin users...');
    const [adminUsers] = await connection.execute(
      'SELECT id, email FROM users WHERE role = ?',
      ['admin']
    );
    console.log('Found admin users:', adminUsers);

    if (adminUsers.length > 0) {
      // Create notifications for each admin
      for (const admin of adminUsers) {
        console.log('Creating notification for admin:', admin);
        await connection.execute(
          'INSERT INTO notifications (userId, title, message, type) VALUES (?, ?, ?, ?)',
          [
            admin.id,
            'New Concern Submitted',
            `A new concern "${title}" has been submitted by a user and requires your attention.`,
            'info'
          ]
        );
      }
      console.log('Admin notifications created successfully');
    } else {
      console.log('No admin users found to notify');
    }

    // Commit the transaction
    await connection.commit();
    console.log('Transaction committed');

    res.status(201).json(createdConcern);
  } catch (error) {
    console.error('Error in concern creation:', error);
    
    if (connection) {
      try {
        await connection.rollback();
        console.log('Transaction rolled back');
      } catch (rollbackError) {
        console.error('Error rolling back:', rollbackError);
      }
    }

    res.status(500).json({ 
      message: 'Failed to create concern',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (connection) {
      try {
        connection.release();
        console.log('Connection released');
      } catch (releaseError) {
        console.error('Error releasing connection:', releaseError);
      }
    }
  }
});

app.put('/api/concerns/:id', authenticateToken, isAdmin, async (req, res) => {
  let connection;
  try {
    console.log('\n=== Update Concern Request ===');
    const { id } = req.params;
    const { status, adminResponse } = req.body;
    
    console.log('1. Request data:', {
      concernId: id,
      status,
      adminResponse,
      userId: req.user.userId,
      userRole: req.user.role
    });

    // Validate admin role again
    if (req.user.role !== 'admin') {
      console.log('User is not admin:', req.user);
      return res.status(403).json({ message: 'Not authorized to update concerns' });
    }

    // Validate status value
    const validStatuses = ['pending', 'in_progress', 'resolved'];
    if (status && !validStatuses.includes(status)) {
      console.log('Invalid status value:', status);
      return res.status(400).json({ 
        message: 'Invalid status value. Must be one of: pending, in_progress, resolved',
        validStatuses
      });
    }

    // Get a connection from the pool
    console.log('2. Getting database connection...');
    connection = await db.getConnection();
    console.log('3. Database connection acquired');
    
    // Start transaction
    console.log('4. Starting transaction...');
    await connection.beginTransaction();
    console.log('5. Transaction started');

    // Get current concern data
    console.log('6. Fetching current concern data...');
    const [currentConcern] = await connection.execute(
      'SELECT * FROM concerns WHERE id = ?',
      [id]
    );

    console.log('7. Current concern data:', currentConcern[0] || 'Not found');

    if (currentConcern.length === 0) {
      console.log('Concern not found, rolling back...');
      await connection.rollback();
      return res.status(404).json({ message: 'Concern not found' });
    }

    // Use existing values if not provided
    const updatedStatus = status || currentConcern[0].status;
    const updatedResponse = adminResponse !== undefined ? adminResponse : currentConcern[0].adminResponse;

    console.log('8. Update values prepared:', {
      status: updatedStatus,
      adminResponse: updatedResponse
    });

    // Update the concern
    console.log('9. Executing update query...');
    const updateResult = await connection.execute(
      'UPDATE concerns SET status = ?, adminResponse = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [updatedStatus, updatedResponse, id]
    );
    console.log('10. Update query result:', updateResult[0]);

    // Verify the update
    console.log('11. Verifying update...');
    const [updatedConcern] = await connection.execute(
      'SELECT c.*, u.firstName, u.lastName FROM concerns c JOIN users u ON c.userId = u.id WHERE c.id = ?',
      [id]
    );
    console.log('12. Updated concern:', updatedConcern[0] || 'Not found');

    if (updatedConcern.length === 0) {
      console.log('Failed to verify update, rolling back...');
      await connection.rollback();
      throw new Error('Failed to verify concern update');
    }

    // Create notification
    console.log('13. Creating notification...');
    const notificationMessage = `Your concern "${updatedConcern[0].title}" has been ${updatedStatus}${updatedResponse ? `. Admin response: ${updatedResponse}` : ''}`;
    
    // Determine notification type based on status
    let notificationType;
    switch (updatedStatus) {
      case 'resolved':
        notificationType = 'success';
        break;
      case 'in_progress':
      case 'pending':
        notificationType = 'info';
        break;
      default:
        notificationType = 'info';
    }
    
    try {
      const [notificationResult] = await connection.execute(
        'INSERT INTO notifications (userId, title, message, type) VALUES (?, ?, ?, ?)',
        [
          updatedConcern[0].userId,
          'Concern Status Updated',
          notificationMessage,
          notificationType
        ]
      );
      console.log('14. Notification created:', notificationResult);
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      await connection.rollback();
      throw new Error('Failed to create notification: ' + notificationError.message);
    }

    // Commit the transaction
    console.log('15. Committing transaction...');
    await connection.commit();
    console.log('16. Transaction committed successfully');
    
    console.log('17. Sending success response');
    res.json(updatedConcern[0]);

  } catch (error) {
    console.error('\n=== Error in concern update transaction ===');
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });

    if (connection) {
      try {
        console.log('Rolling back transaction...');
        await connection.rollback();
        console.log('Transaction rolled back successfully');
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }

    res.status(500).json({ 
      message: 'Failed to update concern',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      details: process.env.NODE_ENV === 'development' ? {
        code: error.code,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage
      } : undefined
    });
  } finally {
    if (connection) {
      try {
        console.log('Releasing database connection...');
        connection.release();
        console.log('Database connection released');
      } catch (releaseError) {
        console.error('Error releasing connection:', releaseError);
      }
    }
  }
});

app.get('/api/admin/concerns', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [concerns] = await db.execute(
      'SELECT c.*, u.firstName, u.lastName FROM concerns c JOIN users u ON c.userId = u.id ORDER BY c.createdAt DESC'
    );
    res.json({ concerns });
  } catch (error) {
    console.error('Error fetching concerns:', error);
    res.status(500).json({ message: 'Failed to fetch concerns' });
  }
});

const PORT = config.PORT || 3000;
const HOST = '0.0.0.0';  // Force binding to all interfaces

console.log('\n=== Server Configuration ===');
console.log('Port:', PORT);
console.log('Host:', HOST);
console.log('API URL:', config.API_URL);

app.listen(PORT, HOST, () => {
  console.log(`\n=== Server Started ===`);
  console.log(`Server running on port ${PORT}`);
  console.log(`Server bound to ${HOST}`);
  console.log(`API URL: ${config.API_URL}`);
  console.log('\nRegistered Routes:');
  const routes = app._router.stack
    .filter(r => r.route)
    .map(r => `${Object.keys(r.route.methods).join(',')} ${r.route.path}`);
  console.log(routes.join('\n'));
}); 