ALTER TABLE scholarships 
ADD COLUMN deadline DATE NOT NULL,
ADD COLUMN slots INT NOT NULL,
ADD COLUMN requirements TEXT NOT NULL,
ADD COLUMN status ENUM('active', 'inactive') DEFAULT 'active',
ADD COLUMN amount DECIMAL(10,2) NOT NULL,
ADD COLUMN criteria TEXT,
ADD COLUMN documents TEXT; 