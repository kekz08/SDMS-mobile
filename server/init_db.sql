-- Set the default collation
SET NAMES utf8mb4;
SET collation_connection = utf8mb4_unicode_ci;

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS scholarships;
DROP TABLE IF EXISTS users;

-- Create users table first since it's referenced by applications
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  firstName VARCHAR(50) NOT NULL,
  lastName VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  studentId VARCHAR(20) NOT NULL UNIQUE,
  college VARCHAR(50) NOT NULL,
  course VARCHAR(50) NOT NULL,
  contactNumber VARCHAR(20),
  address TEXT,
  profileImage VARCHAR(255),
  role ENUM('user', 'admin') DEFAULT 'user',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create scholarships table since it's referenced by applications
CREATE TABLE scholarships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  deadline DATE NOT NULL,
  slots INT NOT NULL,
  requirements TEXT NOT NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  amount DECIMAL(10,2) NOT NULL,
  criteria TEXT,
  documents TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create applications table last since it references both users and scholarships
CREATE TABLE applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  scholarshipId INT NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  documents JSON,
  remarks TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (scholarshipId) REFERENCES scholarships(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci; 