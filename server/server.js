const express = require('express');
const cors = require('cors');
const fs = require('fs');
const uploadRoute = require('./routes/upload');

const app = express();

// Configure CORS with specific options
app.use(cors({
	origin: 'http://localhost:3000',
	methods: ['GET', 'POST'],
	allowedHeaders: ['Content-Type']
}));

// Increase payload limit and add proper body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add error handling middleware
app.use((err, req, res, next) => {
	console.error('Global error handler:', err);
	res.status(500).json({
		success: false,
		message: 'Internal server error',
		error: err.message,
		stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
	});
});

app.use("/api", uploadRoute);

app.listen(3001, () => {
	console.log('Server running on http://localhost:3001');
});
