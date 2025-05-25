const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Get all ratings
router.get('/', async (req, res) => {
    try {
        console.log('Attempting to fetch ratings...');
        const [ratings] = await db.query(`
            SELECT r.*, u.profileImage 
            FROM ratings r
            LEFT JOIN users u ON r.user_id = u.id
            ORDER BY r.created_at DESC
        `);
        
        console.log('Raw ratings from database:', ratings);
        
        // Process the ratings to include full image URLs
        const processedRatings = ratings.map(rating => {
            console.log('Processing rating:', rating);
            console.log('Original profile image:', rating.profileImage);
            
            let profileImageUrl = null;
            if (rating.profileImage) {
                // Convert Windows path to forward slashes and extract the relative path
                const normalizedPath = rating.profileImage.replace(/\\/g, '/');
                const uploadsIndex = normalizedPath.indexOf('uploads/');
                
                if (uploadsIndex !== -1) {
                    // Extract the relative path starting from 'uploads/'
                    const relativePath = normalizedPath.substring(uploadsIndex);
                    profileImageUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/${relativePath}`;
                } else if (rating.profileImage.startsWith('http')) {
                    profileImageUrl = rating.profileImage;
                }
            }
            
            console.log('Processed profile image URL:', profileImageUrl);
            
            return {
                ...rating,
                profileImage: profileImageUrl
            };
        });
        
        console.log('Successfully processed ratings:', processedRatings);
        res.json(processedRatings);
    } catch (error) {
        console.error('Detailed error in fetch ratings:', {
            message: error.message,
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState,
            sqlMessage: error.sqlMessage
        });
        res.status(500).json({ 
            message: 'Error fetching ratings',
            error: error.message 
        });
    }
});

// Create a new rating
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { rating, comment, userId, userName, userRole } = req.body;

        // Validate required fields
        if (!rating || !userId || !userName || !userRole) {
            return res.status(400).json({ 
                message: 'Missing required fields' 
            });
        }

        // Validate rating value
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ 
                message: 'Rating must be between 1 and 5' 
            });
        }

        // Check if user has already submitted a rating
        const [existingRating] = await db.query(
            'SELECT id FROM ratings WHERE user_id = ?',
            [userId]
        );

        if (existingRating.length > 0) {
            return res.status(400).json({ 
                message: 'You have already submitted a rating' 
            });
        }

        // Insert new rating
        const [result] = await db.query(
            `INSERT INTO ratings (user_id, rating, comment, user_name, user_role)
             VALUES (?, ?, ?, ?, ?)`,
            [userId, rating, comment, userName, userRole]
        );

        res.status(201).json({
            message: 'Rating submitted successfully',
            ratingId: result.insertId
        });
    } catch (error) {
        console.error('Error creating rating:', error);
        res.status(500).json({ message: 'Error submitting rating' });
    }
});

// Get average rating
router.get('/average', async (req, res) => {
    try {
        const [result] = await db.query(`
            SELECT 
                AVG(rating) as average_rating,
                COUNT(*) as total_ratings
            FROM ratings
        `);
        
        res.json(result[0]);
    } catch (error) {
        console.error('Error calculating average rating:', error);
        res.status(500).json({ message: 'Error calculating average rating' });
    }
});

// Get user's rating
router.get('/user/:userId', authenticateToken, async (req, res) => {
    try {
        const userId = req.params.userId;
        
        const [rating] = await db.query(
            'SELECT * FROM ratings WHERE user_id = ?',
            [userId]
        );
        
        if (rating.length === 0) {
            return res.status(404).json({ message: 'No rating found for this user' });
        }
        
        res.json(rating[0]);
    } catch (error) {
        console.error('Error fetching user rating:', error);
        res.status(500).json({ message: 'Error fetching user rating' });
    }
});

// Update an existing rating
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const ratingId = req.params.id;
        const { rating, comment } = req.body;
        const userId = req.user.userId; // From authenticated token

        // Validate required fields
        if (!rating) {
            return res.status(400).json({ 
                message: 'Rating is required' 
            });
        }

        // Validate rating value
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ 
                message: 'Rating must be between 1 and 5' 
            });
        }

        // Check if the rating exists and belongs to the authenticated user
        const [existingRating] = await db.query(
            'SELECT id, user_id FROM ratings WHERE id = ?',
            [ratingId]
        );

        if (existingRating.length === 0) {
            return res.status(404).json({ message: 'Rating not found' });
        }

        if (existingRating[0].user_id !== userId) {
            return res.status(403).json({ message: 'Not authorized to update this rating' });
        }

        // Update the rating
        await db.query(
            'UPDATE ratings SET rating = ?, comment = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [rating, comment || null, ratingId]
        );

        res.json({ message: 'Rating updated successfully' });
    } catch (error) {
        console.error('Error updating rating:', error);
        res.status(500).json({ message: 'Error updating rating' });
    }
});

module.exports = router; 