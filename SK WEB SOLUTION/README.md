# SK Web Solutions - Website

A professional web development portfolio website with contact form and admin dashboard.

## Issues Fixed

### 1. **File Path Issues**
- ✅ Fixed CSS path: Changed from `CSS/Style.css` to `Style.css`
- ✅ Fixed JavaScript path: Changed from `CSS/Java/Script.js` to `script.js`

### 2. **Missing/Incomplete Files**
- ✅ Created complete `Style.css` with modern, responsive design
- ✅ Created `script.js` with full functionality for forms and admin panel

### 3. **Invalid JSON**
- ✅ Fixed `messages.json` - was containing plain text instead of valid JSON array

### 4. **Invalid HTML**
- ✅ Removed stray `<colgroup><wbr></wbr></colgroup>` tags from `admin.html`

### 5. **Missing Functionality**
- ✅ Added complete contact form submission
- ✅ Added status checking feature for clients
- ✅ Added admin login system (credentials: admin/admin123)
- ✅ Added admin inbox with message management
- ✅ Added mobile responsive navigation

## Project Structure

```
Project 1/
├── index.html          # Main website homepage
├── admin.html          # Admin dashboard
├── Style.css           # Complete stylesheet
├── script.js           # Client-side JavaScript
├── server.js           # Node.js backend server
├── messages.json       # Message storage (auto-created in /data)
└── README.md           # This file
```

## Features

### Public Website (index.html)
- **Hero Section**: Company introduction with stats
- **Services**: Web development, e-commerce, performance & SEO
- **Case Studies**: Featured work with measurable outcomes
- **Testimonials**: Client feedback
- **Contact Form**: Send messages to admin
- **Status Check**: Clients can check their message status

### Admin Dashboard (admin.html)
- **Secure Login**: Username: `admin`, Password: `admin123`
- **Message Inbox**: View all client messages
- **Statistics**: Pending, accepted, and rejected message counts
- **Message Management**: Accept, reject, or mark as pending
- **SMS Reply**: Send SMS replies directly to clients
- **SMS History**: View all sent SMS replies for each message
- **Clear All**: Delete all messages

## Setup & Installation

### Option 1: Without Server (Demo Mode - Recommended for Testing)

The website now works **without requiring Node.js or a server**! It uses browser localStorage to save messages.

1. Simply open `index.html` in your web browser
2. The contact form and admin panel will work using localStorage
3. Messages are stored in your browser and persist between sessions

### Option 2: With Node.js Server (Production Mode)

For a full backend with persistent database:

#### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

#### Installation Steps

1. **Install Dependencies**
   ```bash
   npm install express
   ```

2. **Start the Server**
   ```bash
   node server.js
   ```

3. **Access the Website**
   - Main website: http://localhost:3000
   - Admin panel: http://localhost:3000/admin.html

### Default Admin Credentials
- **Username**: `admin`
- **Password**: `admin123`

⚠️ **Security Note**: In production, change these credentials and implement proper server-side authentication!

## How to Use

### For Clients
1. Visit the website
2. Navigate to the Contact section
3. Fill out the form with name, contact info, and message
4. Submit the form
5. Note the reference ID for tracking
6. Use "Check meeting status" to see updates

### For Admins
1. Go to admin.html
2. Login with admin credentials
3. View incoming messages in the inbox
4. Click Accept, Reject, or Mark Pending to update status
5. Use "Clear all" to delete all messages

## API Endpoints

- `GET /api/messages` - Get all messages (or filter by contact)
- `POST /api/messages` - Submit new message
- `PUT /api/messages/:id/status` - Update message status
- `DELETE /api/messages` - Clear all messages
- `POST /api/messages/:id/sms` - Send SMS reply to client

## SMS Reply Feature

### How It Works

1. **Admin receives a message** from a client via the contact form
2. **Admin logs in** to the admin panel at `admin.html`
3. **Click "Send SMS"** button on any message that has contact information
4. **Compose reply** in the SMS modal with character count preview (max 160 chars)
5. **Send SMS** - The reply is stored in the message history

### Demo Mode (localStorage)
- SMS messages are simulated and stored in browser localStorage
- Shows a success notification with the message that would be sent
- Perfect for testing the workflow without SMS costs

### Production Mode (Real SMS)
To enable real SMS sending, integrate with an SMS provider:

#### Option 1: Twilio
```javascript
// In server.js, replace the SMS simulation with:
const twilio = require('twilio');
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

app.post('/api/messages/:id/sms', async (req, res) => {
  // ... validation code ...
  
  await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE,
    to: to
  });
  
  // ... save to database ...
});
```

#### Option 2: AWS SNS
```javascript
const AWS = require('aws-sdk');
const sns = new AWS.SNS({ region: 'us-east-1' });

app.post('/api/messages/:id/sms', async (req, res) => {
  // ... validation code ...
  
  await sns.publish({
    Message: message,
    PhoneNumber: to
  }).promise();
  
  // ... save to database ...
});
```

#### Option 3: Other Providers
- **MessageBird**: Global SMS API
- **Plivo**: Affordable international SMS
- **Vonage (Nexmo)**: Enterprise SMS solutions
- **TextLocal**: India-focused SMS provider

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Styling**: Custom CSS with CSS Variables, Flexbox, Grid
- **Responsive**: Mobile-first design with breakpoints

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## Contributing

This is a portfolio project. For issues or improvements, please contact the developer.

## License

© 2026 SK Web Solutions. All rights reserved.

## Contact

- **Email**: Sarangkumar408@gmail.com
- **Location**: Hyderabad, India
- **Availability**: Mon-Fri, 9AM-6PM IST