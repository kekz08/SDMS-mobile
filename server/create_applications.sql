DROP TABLE IF EXISTS applications;
CREATE TABLE applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  scholarshipId INT NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  documents JSON,
  remarks TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_scholarship (userId, scholarshipId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE applications
ADD CONSTRAINT fk_user
FOREIGN KEY (userId) REFERENCES users(id)
ON DELETE CASCADE;

ALTER TABLE applications
ADD CONSTRAINT fk_scholarship
FOREIGN KEY (scholarshipId) REFERENCES scholarships(id)
ON DELETE CASCADE; 