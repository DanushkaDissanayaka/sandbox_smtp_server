# SMTP Sandbox Server

A development SMTP server that captures incoming emails and displays them in a web browser interface. Perfect for testing email functionality during development without sending real emails.

## Features

- 📧 **SMTP Server**: Accepts emails on port 2525 (configurable)
- 🌐 **Web Interface**: View emails in a modern web browser interface
- 🔄 **Real-time Updates**: New emails appear instantly using WebSocket
- 📱 **Responsive Design**: Works on desktop and mobile devices
- �️ **PostgreSQL Storage**: Persistent email storage with database support
- 🧹 **Easy Management**: Delete individual emails or clear all at once
- 📋 **Multiple Formats**: View emails as text, HTML, or raw data
- 🔍 **Pagination**: Efficient handling of large email volumes

## Prerequisites

- **Node.js** (v14 or higher)

## Installation

### Option 1: Docker (Recommended)

1. **Prerequisites:**
   - Docker and Docker Compose installed

2. **Quick Start:**
   ```bash
   # Build and start the services
   ./docker.sh build
   ./docker.sh start
   
   # Or use docker-compose directly
   docker-compose up -d
   ```

3. **Access the application:**
   - **Web Interface**: http://localhost:3000
   - **SMTP Server**: localhost:2525

4. **Management commands:**
   ```bash
   ./docker.sh status   # Check service status
   ./docker.sh logs     # View logs
   ./docker.sh stop     # Stop services
   ./docker.sh backup   # Backup database
   ./docker.sh clean    # Remove everything
   ```

### Option 2: Node.js (Traditional)

1. **Prerequisites:**
   - Node.js (v14 or higher)

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables (optional):**
   
   Copy `.env.example` to `.env` and update if needed:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env`:
   ```
   # Server Configuration
   WEB_PORT=3000
   SMTP_PORT=2525
   
   # SQLite Database Configuration  
   DB_PATH=./emails.db
   ```

The SQLite database file will be created automatically when you first start the server.

## Usage

### Starting the Server

```bash
# Production mode
npm start

# Development mode with auto-restart
npm run dev
```

The server will start:
- **Web Interface**: http://localhost:3000
- **SMTP Server**: localhost:2525

### Configuring Email Clients

Configure your email client or application with these settings:
- **Host**: `localhost`
- **Port**: `2525` (or your custom SMTP_PORT)
- **Security**: None (no SSL/TLS required)
- **Authentication**: Any username/password (or none)

### Environment Variables

You can customize the server and database settings using environment variables:

```bash
# Custom ports and database path
DB_PATH=./custom-emails.db \
WEB_PORT=8080 \
SMTP_PORT=1025 \
npm start
```

## Testing with Different Email Clients

### 1. Using Nodemailer (Node.js)

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  host: 'localhost',
  port: 2525,
  secure: false, // no SSL
  auth: {
    user: 'test@example.com',
    pass: 'password'
  }
});

const mailOptions = {
  from: 'sender@example.com',
  to: 'recipient@example.com',
  subject: 'Test Email',
  text: 'This is a test email!',
  html: '<h1>This is a test email!</h1>'
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});
```

### 2. Using Python (smtplib)

```python
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Create message
msg = MIMEMultipart()
msg['From'] = 'sender@example.com'
msg['To'] = 'recipient@example.com'
msg['Subject'] = 'Test Email from Python'

# Add body
body = 'This is a test email sent from Python!'
msg.attach(MIMEText(body, 'plain'))

# Send email
server = smtplib.SMTP('localhost', 2525)
server.sendmail('sender@example.com', 'recipient@example.com', msg.as_string())
server.quit()
```

### 3. Using curl

```bash
curl -X POST \
  --url 'smtps://localhost:2525' \
  --user 'test:password' \
  --mail-from 'sender@example.com' \
  --mail-rcpt 'recipient@example.com' \
  --upload-file - << EOF
From: sender@example.com
To: recipient@example.com
Subject: Test Email

This is a test email sent via curl!
EOF
```

### 4. Using Telnet (Manual SMTP)

```bash
telnet localhost 2525

# Then type these commands:
HELO localhost
MAIL FROM: <sender@example.com>
RCPT TO: <recipient@example.com>
DATA
Subject: Test Email
From: sender@example.com
To: recipient@example.com

This is a test email!
.
QUIT
```

## Web Interface Features

### Email List View
- View all received emails in chronological order
- See sender, subject, timestamp, and preview
- Real-time updates when new emails arrive
- Delete individual emails or clear all

### Email Detail View
- Full email content display
- Multiple view modes: Text, HTML, Raw
- Complete email headers
- Responsive modal interface

### Status Indicators
- Connection status indicator
- Email count display
- Real-time notifications

## API Endpoints

The server provides a REST API with pagination support:

- `GET /api/emails?limit=100&offset=0` - Get emails with pagination
- `GET /api/emails/:id` - Get specific email
- `DELETE /api/emails/:id` - Delete specific email
- `DELETE /api/emails` - Clear all emails

Example response for `/api/emails`:
```json
{
  "emails": [...],
  "pagination": {
    "limit": 100,
    "offset": 0,
    "total": 250,
    "hasMore": true
  }
}
```

## Database Schema

The application creates the following SQLite table:

```sql
CREATE TABLE emails (
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
);
```

## Docker Support

### Docker Files

- `Dockerfile` - Multi-stage build for production-ready image
- `docker-compose.yml` - Complete service configuration
- `docker.sh` - Management script for common operations
- `.dockerignore` - Optimized for smaller images

### Docker Features

- **Persistent Storage**: Database is stored in a Docker volume
- **Health Checks**: Automatic container health monitoring
- **Security**: Runs as non-root user
- **Multi-port**: Exposes both web (3000) and SMTP (2525) ports
- **Easy Management**: Simple commands via docker.sh script

### Docker Environment Variables

```bash
# Default values in docker-compose.yml
WEB_PORT=3000
SMTP_PORT=2525
DB_PATH=/app/data/emails.db
```

### Custom Docker Configuration

```yaml
# Custom docker-compose.override.yml
version: '3.8'
services:
  smtp-sandbox:
    ports:
      - "8080:3000"   # Custom web port
      - "1025:2525"   # Custom SMTP port
    environment:
      - WEB_PORT=3000
      - SMTP_PORT=2525
```

## Security Note

⚠️ **This is for development use only!**

- No authentication required for SMTP
- No encryption on SMTP connection
- SQLite database file should be secured in production
- Not suitable for production email handling

## Troubleshooting

### Database Issues
1. **Permission errors**: Make sure the application has write access to the directory where `emails.db` will be created
2. **Database locked**: Close any other applications that might be accessing the database file
3. **Corrupt database**: Delete the `emails.db` file to reset: `npm run reset-db`

### Port Already in Use
If you get a "port already in use" error, either:
1. Stop the conflicting service
2. Use different ports in your `.env` file

### Emails Not Appearing
1. Check the console for SMTP server errors
2. Verify your email client is connecting to the correct port
3. Check the web interface connection status
4. Check database file permissions
5. Try refreshing the browser

### Browser Not Loading
1. Ensure the web server is running on the correct port
2. Check for firewall blocking the port
3. Try accessing http://localhost:3000 directly

## Development

The project structure:
```
smtp-sandbox/
├── server.js          # Main server file
├── database.js        # SQLite database operations
├── package.json       # Dependencies and scripts
├── .env.example       # Environment variables template
├── emails.db          # SQLite database file (auto-created)
├── public/
│   └── index.html     # Web interface
└── README.md          # This file
```

## License

MIT License - Feel free to use for your projects!