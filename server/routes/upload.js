const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const router = express.Router();

const uploadsDir = path.join(__dirname, '..', 'uploads');
const resultsDir = path.join(__dirname, '..', 'results');

[uploadsDir, resultsDir].forEach(dir => {
	if (!fs.existsSync(dir)) {
		console.log("Creating directory:", dir);
		fs.mkdirSync(dir, { recursive: true });
	}
});

// AWS S3 setup
const s3 = new S3Client({
	region: process.env.AWS_REGION,
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	},
});

// Configure multer with error handling
const upload = multer({ 
	dest: 'uploads/',
	limits: {
		fileSize: 10 * 1024 * 1024, // 10MB limit
	}
}).single('logfile');

// Wrap multer middleware to handle errors
const uploadMiddleware = (req, res, next) => {
	upload(req, res, (err) => {
		if (err instanceof multer.MulterError) {
			console.error("Multer error:", err);
			return res.status(400).json({ 
				success: false, 
				message: 'File upload error', 
				error: err.message 
			});
		} else if (err) {
			console.error("Unknown upload error:", err);
			return res.status(500).json({ 
				success: false, 
				message: 'Unknown upload error', 
				error: err.message 
			});
		}
		next();
	});
};

function parseLogToJson(content) {
	const lines = content.split('\n').filter(line => line.trim());
	const stats = {
		totalLines: lines.length,
		errorCount: 0,
		warnCount: 0,
		debugCount: 0,
		infoCount: 0,
		users: {},
		errors: [],
		timeline: [],
		userActivity: {}
	};

	lines.forEach(line => {
		// Extract timestamp and log level
		const timestampMatch = line.match(/\[(.*?)\]/);
		const timestamp = timestampMatch ? timestampMatch[1] : null;
		const logLevel = line.includes('ERROR') ? 'ERROR' :
						line.includes('WARN') ? 'WARN' :
						line.includes('DEBUG') ? 'DEBUG' :
						line.includes('INFO') ? 'INFO' : null;

		// Count log levels
		if (logLevel === 'ERROR') {
			stats.errorCount++;
			stats.errors.push({ timestamp, message: line });
		}
		if (logLevel === 'WARN') stats.warnCount++;
		if (logLevel === 'DEBUG') stats.debugCount++;
		if (logLevel === 'INFO') stats.infoCount++;

		// Extract user information
		const userMatch = line.match(/User (\w+)/);
		if (userMatch) {
		const user = userMatch[1];
		stats.users[user] = (stats.users[user] || 0) + 1;
		
		// Track user activity
		if (!stats.userActivity[user]) {
			stats.userActivity[user] = [];
		}

		stats.userActivity[user].push({
			timestamp,
			action: line.includes('logged in') ? 'login' :
					line.includes('logged out') ? 'logout' :
					line.includes('requested') ? 'request' :
					line.includes('updated') ? 'update' : 'other',
			details: line
		});
		}

		// Add to timeline
		if (timestamp) {
			stats.timeline.push({
				timestamp,
				level: logLevel,
				message: line
			});
		}
	});

	// Sort timeline by timestamp
	stats.timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

	return stats;
}

router.post('/upload', uploadMiddleware, async (req, res) => {
	try {
		if (!req.file) {
			console.error("No file was uploaded");
			return res.status(400).json({ success: false, message: 'No file uploaded' });
		}

		console.log("Received file:", req.file);
		const filePath = path.join(__dirname, '..', req.file.path);
		console.log("Reading file from:", filePath);
		
		const content = fs.readFileSync(filePath, 'utf-8');
		console.log("File content length:", content.length);
		
		const stats = parseLogToJson(content);
		console.log("Parsed stats:", {
			totalLines: stats.totalLines,
			errorCount: stats.errorCount,
			warnCount: stats.warnCount,
			debugCount: stats.debugCount,
			infoCount: stats.infoCount,
			uniqueUsers: Object.keys(stats.users).length
		});

		// Save the JSON file locally
		const jsonFilename = req.file.originalname.replace('.log', '.json');
		const jsonPath = path.join(resultsDir, jsonFilename);
		fs.writeFileSync(jsonPath, JSON.stringify(stats, null, 2));
		console.log("Saved JSON file to:", jsonPath);

		// Upload the JSON file to S3
		const s3Key = `results/${jsonFilename}`;
		const jsonBuffer = fs.readFileSync(jsonPath);
		const command = new PutObjectCommand({
			Bucket: "my-log-parser",
			Key: s3Key,
			Body: jsonBuffer,
			ContentType: 'application/json',
		});
		await s3.send(command);
		console.log("Uploaded JSON to S3:", s3Key);

		// Clean up the temporary upload file and local JSON file
		fs.unlinkSync(filePath);
		fs.unlinkSync(jsonPath);
		console.log("Cleaned up temporary files");

		// Return the parsed JSON and S3 key
		res.json({ 
			success: true, 
			stats,
			filename: req.file.originalname,
			jsonFile: jsonFilename,
			s3Key
		});
	} catch (err) {
		console.error("Detailed upload error:", {
			message: err.message,
			stack: err.stack,
			code: err.code,
			name: err.name
		});
		res.status(500).json({ 
			success: false, 
			message: 'Upload failed', 
			error: err.message,
			details: process.env.NODE_ENV === 'development' ? err.stack : undefined
		});
	}
});

module.exports = router;
