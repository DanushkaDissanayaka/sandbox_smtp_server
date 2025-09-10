const nodemailer = require('nodemailer');

// Configure the SMTP transporter to connect to your local SMTP server
const transporter = nodemailer.createTransport({
    host: 'localhost',
    port: 2525, // Your SMTP server port
    secure: false, // No SSL/TLS
    requireTLS: false,
    auth: {
        user: 'testuser', // Any username works with your server
        pass: 'testpass'  // Any password works with your server
    },
    // Ignore certificate errors for local testing
    tls: {
        rejectUnauthorized: false
    }
});

// Function to send a test email
async function sendTestEmail() {
    try {
        console.log('📧 Sending test email...');
        
        const info = await transporter.sendMail({
            from: '"Test Sender" <test@example.com>',
            to: 'recipient@example.com, another@example.com',
            subject: 'Test Email from SMTP Client',
            text: 'This is a plain text test email sent to your SMTP sandbox server!',
            html: `
                <h1>Test Email</h1>
                <p>This is an <strong>HTML test email</strong> sent to your SMTP sandbox server!</p>
                <ul>
                    <li>✅ HTML formatting works</li>
                    <li>✅ Multiple recipients supported</li>
                    <li>✅ Timestamp: ${new Date().toISOString()}</li>
                </ul>
                <p>Check your web interface at <a href="http://localhost:3000">http://localhost:3000</a></p>
            `
        });

        console.log('✅ Email sent successfully!');
        console.log('📋 Message ID:', info.messageId);
        console.log('🌐 Check your web interface at: http://localhost:3000');
        
    } catch (error) {
        console.error('❌ Error sending email:', error.message);
        console.log('\n💡 Make sure your SMTP server is running with: npm start');
    }
}

// Function to send multiple test emails
async function sendMultipleTestEmails() {
    const emails = [
        {
            from: '"Marketing Team" <marketing@company.com>',
            to: 'customer@example.com',
            subject: 'Welcome to Our Service!',
            html: '<h2>Welcome!</h2><p>Thank you for signing up for our amazing service.</p>'
        },
        {
            from: '"Support Team" <support@company.com>',
            to: 'user@example.com',
            subject: 'Your Support Ticket #12345',
            text: 'Your support ticket has been received and will be processed within 24 hours.'
        },
        {
            from: '"Newsletter" <newsletter@company.com>',
            to: 'subscriber@example.com',
            subject: 'Monthly Newsletter - September 2025',
            html: `
                <h1>Monthly Newsletter</h1>
                <h2>This Month's Highlights</h2>
                <p>Here are the top stories from this month...</p>
                <img src="https://via.placeholder.com/400x200" alt="Newsletter Image">
            `
        }
    ];

    console.log('📧 Sending multiple test emails...');
    
    for (let i = 0; i < emails.length; i++) {
        try {
            await transporter.sendMail(emails[i]);
            console.log(`✅ Email ${i + 1}/${emails.length} sent: "${emails[i].subject}"`);
            // Small delay between emails
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error(`❌ Failed to send email ${i + 1}:`, error.message);
        }
    }
    
    console.log('\n🎉 Finished sending test emails!');
    console.log('🌐 Check your web interface at: http://localhost:3000');
}

// Function to test email with attachment
async function sendEmailWithAttachment() {
    try {
        console.log('📎 Sending email with attachment...');
        
        const info = await transporter.sendMail({
            from: '"File Sender" <files@example.com>',
            to: 'recipient@example.com',
            subject: 'Test Email with Attachment',
            text: 'This email contains a test attachment.',
            html: '<h2>Email with Attachment</h2><p>This email contains a <strong>test attachment</strong>.</p>',
            attachments: [
                {
                    filename: 'test.txt',
                    content: 'This is a test attachment file!\nGenerated at: ' + new Date().toISOString()
                },
                {
                    filename: 'data.json',
                    content: JSON.stringify({
                        message: 'Hello from attachment',
                        timestamp: new Date().toISOString(),
                        data: [1, 2, 3, 4, 5]
                    }, null, 2),
                    contentType: 'application/json'
                }
            ]
        });

        console.log('✅ Email with attachment sent successfully!');
        console.log('📋 Message ID:', info.messageId);
        
    } catch (error) {
        console.error('❌ Error sending email with attachment:', error.message);
    }
}

// Main execution
async function main() {
    console.log('🚀 SMTP Server Email Test Script');
    console.log('==================================\n');
    
    // Get command line argument
    const testType = process.argv[2];
    
    switch (testType) {
        case 'multiple':
            await sendMultipleTestEmails();
            break;
        case 'attachment':
            await sendEmailWithAttachment();
            break;
        case 'all':
            await sendTestEmail();
            await new Promise(resolve => setTimeout(resolve, 1000));
            await sendMultipleTestEmails();
            await new Promise(resolve => setTimeout(resolve, 1000));
            await sendEmailWithAttachment();
            break;
        default:
            await sendTestEmail();
            break;
    }
    
    console.log('\n📖 Usage:');
    console.log('  node test-email.js          - Send single test email');
    console.log('  node test-email.js multiple - Send multiple test emails');
    console.log('  node test-email.js attachment - Send email with attachment');
    console.log('  node test-email.js all       - Send all types of test emails');
}

// Run the script
main().catch(console.error);
