const nodemailer = require('nodemailer');

// Simple SMTP test configuration
const transporter = nodemailer.createTransport({
    host: 'localhost',
    port: 2525,
    secure: false,
    requireTLS: false,
    auth: {
        user: 'test',
        pass: 'test'
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Send a quick test email
transporter.sendMail({
    from: 'sender@test.com',
    to: 'recipient@test.com',
    subject: 'Quick SMTP Test',
    text: 'Hello! This is a quick test of your SMTP server.',
    html: '<h1>Hello!</h1><p>This is a <strong>quick test</strong> of your SMTP server.</p>'
}).then((info) => {
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('🌐 Check http://localhost:3000 to see the email');
}).catch((error) => {
    console.error('❌ Error:', error.message);
    console.log('💡 Make sure your SMTP server is running with: npm start');
});
