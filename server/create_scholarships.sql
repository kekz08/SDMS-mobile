DROP TABLE IF EXISTS scholarships;
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 