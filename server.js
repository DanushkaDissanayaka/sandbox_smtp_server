require('dotenv').config();
const express = require('express');
const { SMTPServer } = require('smtp-server');
const { simpleParser } = require('mailparser');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const {
    initializeDatabase,
    insertEmail,
    getAllEmails,
    getEmailById,
    deleteEmailById,
    clearAllEmails,
    getEmailCount,
    closeDatabase
} = require('./database');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static('public'));
app.use(express.json());

// Middleware
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to get all emails
app.get('/api/emails', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;
        const emails = await getAllEmails(limit, offset);
        const totalCount = await getEmailCount();
        
        res.json({
            emails,
            pagination: {
                limit,
                offset,
                total: totalCount,
                hasMore: offset + limit < totalCount
            }
        });
    } catch (error) {
        console.error('Error fetching emails:', error);
        res.status(500).json({ error: 'Failed to fetch emails' });
    }
});

// API endpoint to get a specific email
app.get('/api/emails/:id', async (req, res) => {
    try {
        const email = await getEmailById(parseInt(req.params.id));
        if (!email) {
            return res.status(404).json({ error: 'Email not found' });
        }
        res.json(email);
    } catch (error) {
        console.error('Error fetching email:', error);
        res.status(500).json({ error: 'Failed to fetch email' });
    }
});

// API endpoint to delete an email
app.delete('/api/emails/:id', async (req, res) => {
    try {
        const emailId = parseInt(req.params.id);
        const deleted = await deleteEmailById(emailId);
        if (!deleted) {
            return res.status(404).json({ error: 'Email not found' });
        }
        io.emit('emailDeleted', emailId);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting email:', error);
        res.status(500).json({ error: 'Failed to delete email' });
    }
});

// API endpoint to clear all emails
app.delete('/api/emails', async (req, res) => {
    try {
        await clearAllEmails();
        io.emit('emailsCleared');
        res.json({ success: true });
    } catch (error) {
        console.error('Error clearing emails:', error);
        res.status(500).json({ error: 'Failed to clear emails' });
    }
});

// Socket.io connection
io.on('connection', (socket) => {
    console.log('Client connected to web interface');
    
    socket.on('disconnect', () => {
        console.log('Client disconnected from web interface');
    });
});

// SMTP Server Configuration
const smtpServer = new SMTPServer({
    // Allow all authentication attempts
    onAuth(auth, session, callback) {
        console.log(`SMTP Auth attempt - User: ${auth.username}`);
        callback(null, { user: auth.username });
    },
    
    // Handle incoming mail
    onData(stream, session, callback) {
        console.log('Receiving email...');
        
        // Parse the email
        simpleParser(stream, async (err, parsed) => {
            if (err) {
                console.error('Error parsing email:', err);
                return callback(err);
            }
            
            try {
                // Create email object
                const emailData = {
                    timestamp: new Date(),
                    from: parsed.from ? parsed.from.text : 'Unknown',
                    to: parsed.to ? parsed.to.text : 'Unknown',
                    subject: parsed.subject || 'No Subject',
                    text: parsed.text || '',
                    html: parsed.html || '',
                    headers: parsed.headers,
                    attachments: parsed.attachments || [],
                    raw: parsed.raw || ''
                };
                
                // Store email in database
                const savedEmail = await insertEmail(emailData);
                
                console.log(`Email received from: ${savedEmail.from} | Subject: ${savedEmail.subject} | ID: ${savedEmail.id}`);
                
                // Notify web clients
                io.emit('newEmail', savedEmail);
                
                callback();
            } catch (dbError) {
                console.error('Error saving email to database:', dbError);
                callback(dbError);
            }
        });
    },
    
    // Server options
    secure: false,
    authOptional: true,
    banner: 'SMTP Sandbox Server - Development Only',
    size: 1024 * 1024 * 10, // 10MB max
    logger: false
});

// Error handling for SMTP server
smtpServer.on('error', (err) => {
    console.error('SMTP Server error:', err);
});

// Start servers
const WEB_PORT = process.env.WEB_PORT || 3000;
const SMTP_PORT = process.env.SMTP_PORT || 2525;

// Initialize database and start servers
async function startServers() {
    try {
        // Initialize database
        await initializeDatabase();
        
        // Start web server
        server.listen(WEB_PORT, () => {
            console.log(`🌐 Web interface available at: http://localhost:${WEB_PORT}`);
        });

        // Start SMTP server
        smtpServer.listen(SMTP_PORT, () => {
            console.log(`📧 SMTP server listening on port ${SMTP_PORT}`);
            console.log(`📋 Configure your email client with:`);
            console.log(`   - Host: localhost`);
            console.log(`   - Port: ${SMTP_PORT}`);
            console.log(`   - Security: None (no SSL/TLS)`);
            console.log(`   - Authentication: Any username/password`);
        });
    } catch (error) {
        console.error('Failed to start servers:', error);
        process.exit(1);
    }
}

// Start the application
startServers();

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('Shutting down servers...');
    smtpServer.close();
    server.close();
    await closeDatabase();
});

process.on('SIGINT', async () => {
    console.log('Shutting down servers...');
    smtpServer.close();
    server.close();
    await closeDatabase();
    process.exit(0);
});