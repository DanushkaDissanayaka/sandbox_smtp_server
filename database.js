const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'emails.db');

// Create database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log(`📦 Connected to SQLite database: ${DB_PATH}`);
    }
});

// Initialize database tables
async function initializeDatabase() {
    return new Promise((resolve, reject) => {
        // Create emails table if it doesn't exist
        db.run(`
            CREATE TABLE IF NOT EXISTS emails (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                from_address TEXT,
                to_address TEXT,
                subject TEXT,
                text_content TEXT,
                html_content TEXT,
                headers TEXT,
                attachments TEXT,
                raw_content TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) {
                console.error('Error creating emails table:', err);
                reject(err);
            } else {
                // Create index for better performance
                db.run(`CREATE INDEX IF NOT EXISTS idx_emails_timestamp ON emails(timestamp DESC)`, (err) => {
                    if (err) {
                        console.error('Error creating timestamp index:', err);
                    }
                });
                
                db.run(`CREATE INDEX IF NOT EXISTS idx_emails_from ON emails(from_address)`, (err) => {
                    if (err) {
                        console.error('Error creating from_address index:', err);
                    }
                });

                console.log('📦 Database tables initialized successfully');
                resolve();
            }
        });
    });
}

// Insert a new email
async function insertEmail(emailData) {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare(`
            INSERT INTO emails (
                timestamp, from_address, to_address, subject, 
                text_content, html_content, headers, attachments, raw_content
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run([
            emailData.timestamp.toISOString(),
            emailData.from,
            emailData.to,
            emailData.subject,
            emailData.text,
            emailData.html,
            JSON.stringify(emailData.headers),
            JSON.stringify(emailData.attachments),
            emailData.raw
        ], function(err) {
            if (err) {
                console.error('Error inserting email:', err);
                stmt.finalize();
                reject(err);
            } else {
                // Get the inserted row
                db.get('SELECT * FROM emails WHERE id = ?', [this.lastID], (err, row) => {
                    stmt.finalize();
                    if (err) {
                        reject(err);
                    } else {
                        // Parse JSON fields back
                        const result = {
                            ...row,
                            from: row.from_address,
                            to: row.to_address,
                            text: row.text_content,
                            html: row.html_content,
                            raw: row.raw_content,
                            headers: JSON.parse(row.headers || '{}'),
                            attachments: JSON.parse(row.attachments || '[]')
                        };
                        resolve(result);
                    }
                });
            }
        });
    });
}

// Get all emails with pagination
async function getAllEmails(limit = 100, offset = 0) {
    return new Promise((resolve, reject) => {
        db.all(`
            SELECT 
                id,
                timestamp,
                from_address as "from",
                to_address as "to",
                subject,
                text_content as "text",
                html_content as "html",
                headers,
                attachments,
                raw_content as "raw",
                created_at
            FROM emails 
            ORDER BY timestamp DESC 
            LIMIT ? OFFSET ?
        `, [limit, offset], (err, rows) => {
            if (err) {
                console.error('Error fetching emails:', err);
                reject(err);
            } else {
                // Parse JSON fields
                const emails = rows.map(row => ({
                    ...row,
                    headers: JSON.parse(row.headers || '{}'),
                    attachments: JSON.parse(row.attachments || '[]')
                }));
                resolve(emails);
            }
        });
    });
}

// Get email by ID
async function getEmailById(id) {
    return new Promise((resolve, reject) => {
        db.get(`
            SELECT 
                id,
                timestamp,
                from_address as "from",
                to_address as "to",
                subject,
                text_content as "text",
                html_content as "html",
                headers,
                attachments,
                raw_content as "raw",
                created_at
            FROM emails 
            WHERE id = ?
        `, [id], (err, row) => {
            if (err) {
                console.error('Error fetching email by ID:', err);
                reject(err);
            } else if (row) {
                // Parse JSON fields
                const email = {
                    ...row,
                    headers: JSON.parse(row.headers || '{}'),
                    attachments: JSON.parse(row.attachments || '[]')
                };
                resolve(email);
            } else {
                resolve(null);
            }
        });
    });
}

// Delete email by ID
async function deleteEmailById(id) {
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM emails WHERE id = ?', [id], function(err) {
            if (err) {
                console.error('Error deleting email:', err);
                reject(err);
            } else {
                resolve(this.changes > 0);
            }
        });
    });
}

// Clear all emails
async function clearAllEmails() {
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM emails', [], function(err) {
            if (err) {
                console.error('Error clearing emails:', err);
                reject(err);
            } else {
                // Reset the auto-increment counter
                db.run('DELETE FROM sqlite_sequence WHERE name = ?', ['emails'], (err) => {
                    if (err) {
                        console.error('Error resetting sequence:', err);
                    }
                    resolve(true);
                });
            }
        });
    });
}

// Get email count
async function getEmailCount() {
    return new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM emails', [], (err, row) => {
            if (err) {
                console.error('Error getting email count:', err);
                reject(err);
            } else {
                resolve(row.count);
            }
        });
    });
}

// Close database connection
async function closeDatabase() {
    return new Promise((resolve) => {
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err);
            } else {
                console.log('📦 Database connection closed');
            }
            resolve();
        });
    });
}

module.exports = {
    initializeDatabase,
    insertEmail,
    getAllEmails,
    getEmailById,
    deleteEmailById,
    clearAllEmails,
    getEmailCount,
    closeDatabase
};
