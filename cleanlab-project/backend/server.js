const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MySQL Connection with connection pool
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '12',
    database: 'cleanlab_db',
    connectionLimit: 10, // Creates a pool of 10 connections
    acquireTimeout: 60000, // 60 seconds to get a connection
    timeout: 60000, // 60 seconds for query execution
    reconnect: true // Enable automatic reconnection
});

// Verify the connection on startup
db.getConnection((err, connection) => {
    if (err) {
        console.error('MySQL connection failed: ', err.code);
        if (err.code === 'ECONNREFUSED') {
            console.error('Database connection refused. Check if MySQL is running.');
        }
    } else {
        console.log('Connected to MySQL database');
        connection.release(); // Release the connection back to the pool
    }
});

// Handle connection errors after initial connect
db.on('error', (err) => {
    console.error('Database error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.error('Database connection was lost.');
    } else {
        throw err;
    }
});

// API Routes
app.get('/', (req, res) => {
    res.send('Welcome to Clean LAB API Server!');
});

// Get bookings by email
app.get('/api/bookings/:email', (req, res) => {
    const email = req.params.email;
    
    const sql = 'SELECT * FROM bookings WHERE contact = ? ORDER BY created_at DESC';
    
    db.query(sql, [email], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }
        res.json(results);
    });
});

// Update a specific booking
app.put('/api/bookings/:id', (req, res) => {
    const bookingId = req.params.id;
    const { name, contact, service_type, service_date, service_time, address, notes } = req.body;

    const sql = `UPDATE bookings 
                 SET name = ?, contact = ?, service_type = ?, service_date = ?, 
                     service_time = ?, address = ?, notes = ?
                 WHERE id = ?`;
    
    db.query(sql, [name, contact, service_type, service_date, service_time, address, notes, bookingId], 
        (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ success: false, message: 'Database error' });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Booking not found' });
            }
            
            res.json({ 
                success: true, 
                message: 'Booking updated successfully!',
                bookingId: bookingId 
            });
        });
});

// Create new booking (your existing route)
app.post('/api/bookings', (req, res) => {
    const { name, contact, service_type, service_date, service_time, address, notes } = req.body;

    const sql = `INSERT INTO bookings (name, contact, service_type, service_date, service_time, address, notes)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;

    db.query(sql, [name, contact, service_type, service_date, service_time, address, notes],
        (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error'
                });
            }

            res.json({
                success: true,
                message: 'Booking submitted successfully!',
                bookingId: result.insertId
            });
        });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
