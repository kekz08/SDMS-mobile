DROP TABLE IF EXISTS concerns;
CREATE TABLE concerns (
    id INT PRIMARY KEY AUTO_INCREMENT,
    userId INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    category ENUM('scholarship', 'application', 'technical', 'other') NOT NULL,
    status ENUM('pending', 'in_progress', 'resolved') NOT NULL DEFAULT 'pending',
    adminResponse TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 