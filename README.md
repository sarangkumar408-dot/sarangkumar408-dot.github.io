# NexusForge - Forge Your Digital Presence

A cutting-edge web development portfolio website with a stunning dark theme, glassmorphism design, live India news feed, and an admin dashboard.

## ✨ Features

### 🎨 Design
- **Dark Theme**: Sleek dark background with vibrant purple/teal/pink accents
- **Glassmorphism**: Frosted glass cards with backdrop blur effects
- **Animations**: Scroll-triggered reveals, typing animation, floating geometric shapes
- **Responsive**: Fully responsive design for all devices

### 🚀 Public Website (index.html)
- **Hero Section**: Animated gradient background with typing effect and visitor counter
- **Live News**: Multi-language India news feed with category filters and search
- **Project Gallery**: Showcase with download capability
- **Services**: Web development, e-commerce, performance & SEO
- **Case Studies**: Featured work with measurable outcomes
- **Testimonials**: Client feedback
- **Contact Form**: Send messages to admin with status tracking
- **WhatsApp Integration**: Floating chat button
- **Back to Top**: Smooth scroll-to-top button

### 🔐 Admin Dashboard (admin.html)
- **Secure Login**: Username: `admin`, Password: `admin123`
- **Message Inbox**: View all client messages with status management
- **Analytics**: Visit statistics (total, today, week, month, unique visitors)
- **Visit History**: Detailed visit log with pagination
- **Project Gallery Management**: Upload images/videos with crop functionality
- **SMS Reply**: Send SMS replies to clients directly
- **Message Actions**: Accept, reject, or mark messages as pending

### 📰 Live News
- 7 Indian languages support (English, Hindi, Telugu, Tamil, Kannada, Bengali, Marathi)
- Auto-refresh every 60 seconds
- Category filtering and search
- Live status indicator

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Styling**: Custom CSS with CSS Variables, Glassmorphism, Flexbox, Grid
- **Image Cropping**: Cropper.js
- **Responsive**: Mobile-first design with breakpoints

## 📁 Project Structure

```
NexusForge/
├── index.html          # Main website homepage
├── admin.html          # Admin dashboard with crop modal
├── Style.css           # Complete glassmorphism dark theme stylesheet
├── script.js           # Client-side JavaScript with all functionality
├── server.js           # Node.js backend server
├── package.json        # Project configuration
├── messages.json       # Message storage (auto-created in /data)
├── README.md           # This file
├── DEPLOYMENT_GUIDE.md # Deployment instructions
├── VISIT_COUNTER_GUIDE.md # Visit counter documentation
└── TODO.md             # Progress tracker
```

## 🚀 Setup & Installation

### Option 1: Without Server (Demo Mode)
The website works without Node.js using browser localStorage.

1. Open `index.html` in your web browser
2. The contact form and admin panel work using localStorage
3. Messages are stored in your browser between sessions

### Option 2: With Node.js Server (Production)

#### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

#### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Server**
   ```bash
   npm start
   ```

3. **Access the Website**
   - Main website: http://localhost:3000
   - Admin panel: http://localhost:3000/admin.html

### Default Admin Credentials
- **Username**: `admin`
- **Password**: `admin123`

⚠️ **Security Note**: In production, change these credentials and implement proper server-side authentication!

## 📋 How to Use

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
6. Upload project images/videos to the gallery
7. Use the crop tool to adjust images before uploading

## 📡 API Endpoints

- `GET /api/messages` - Get all messages (or filter by contact)
- `POST /api/messages` - Submit new message
- `PUT /api/messages/:id/status` - Update message status
- `DELETE /api/messages` - Clear all messages
- `POST /api/messages/:id/sms` - Send SMS reply to client
- `GET /api/visits` - Get visit statistics
- `POST /api/visits` - Record a new visit
- `GET /api/visits/history` - Get visit history (paginated)
- `DELETE /api/visits` - Clear all visit data
- `GET /api/projects` - Get all gallery projects
- `POST /api/projects` - Upload new project media
- `DELETE /api/projects/:id` - Delete a project
- `GET /api/news?lang=en` - Get live news in specified language

## 🎨 Design System

### Color Palette
- **Background**: `#0a0a0f` (deep dark)
- **Cards**: Glass with `rgba(255,255,255,0.03)` backdrop
- **Primary Accent**: `#6c5ce7` (purple)
- **Secondary Accent**: `#00cec9` (teal)
- **Tertiary Accent**: `#fd79a8` (pink)
- **Text**: `#f0f0f5` (light), `#a0a0b8` (muted)

### Key Effects
- **Glassmorphism**: `backdrop-filter: blur(20px)` with semi-transparent borders
- **Gradients**: Text gradients on headings, button gradients
- **Glow**: Box shadows with accent color glow on hover
- **Animations**: Fade-in-up, scale-in, slide-in on scroll reveal

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## 📄 License

© 2026 NexusForge. All rights reserved.

## 📞 Contact

- **Email**: hello@nexusforge.dev
- **Phone**: +91 7095244790
- **Location**: Hyderabad, India
- **Availability**: Mon-Fri, 9AM-6PM IST
