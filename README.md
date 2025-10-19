# PVT Support Page

A comprehensive technical support hub for PVT Group's hospitality and business portfolio.

## Features

- **Multi-Brand Support**: Centralized support for PVT Hostel, StudioNYNE, King Legend Inc., and Urban Stay Hostels
- **Interactive Dashboard**: Real-time system status monitoring
- **Service Categories**:
  - Hospitality Services
  - Media & Creative Services
  - Technology & Integration
  - Legal & Compliance
  - Business Consulting
  - Marketing Services
- **MAC Request System**: Move, Add, Change request management
- **Live Chat Widget**: Integrated support chat functionality
- **Responsive Design**: Fully optimized for mobile and desktop
- **404 Page Upselling**: Creative error page with conversion optimization

## Pages

- `index.html` - Main support hub dashboard
- `support-page.html` - Detailed support documentation
- `pvt-404-page.html` - Custom 404 error page with upselling features

## Technologies

### Frontend
- HTML5
- CSS3 with custom properties
- Vanilla JavaScript
- Font Awesome Icons
- Google Fonts (Montserrat & Lato)
- Socket.io Client (Real-time chat)

### Backend
- Node.js & Express.js
- PostgreSQL Database
- Sequelize ORM
- JWT Authentication
- Socket.io (WebSocket)
- bcryptjs (Password hashing)
- Express Validator
- Rate Limiting & Helmet (Security)

## Brand Colors

- Primary Blue: `#005f73`
- Secondary Teal: `#0a9396`
- Warm Orange: `#ca6702`
- Gold Yellow: `#ee9b00`
- Light Gray: `#f2f2f2`
- Dark Gray: `#333333`

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL database
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/presidentanderson/pvt-support-page.git
   cd pvt-support-page
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Copy `.env` file and update with your database credentials
   - Set JWT secrets and other configuration values

4. **Set up PostgreSQL database**
   - Create a database named `pvt_support`
   - Update DB credentials in `.env`

5. **Initialize database**
   ```bash
   node server/init-db.js
   ```

6. **Start the server**
   ```bash
   npm start
   # or for development with auto-reload
   npm run dev
   ```

7. **Access the application**
   - Open browser to `http://localhost:5000`
   - The API runs on the same port

### API Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh JWT token

#### MAC Requests
- `GET /api/mac-requests` - List MAC requests
- `POST /api/mac-requests` - Create new request
- `GET /api/mac-requests/:id` - Get specific request
- `PUT /api/mac-requests/:id` - Update request
- `DELETE /api/mac-requests/:id` - Delete request

#### Support
- `GET /api/support/tickets` - List support tickets
- `POST /api/support/tickets` - Create ticket
- `GET /api/support/chat/:ticketId` - Get chat messages
- `POST /api/support/chat` - Send chat message

#### System Status
- `GET /api/system/status` - Get all service statuses
- `PUT /api/system/status/:id` - Update status (admin only)

## Contact

**PVT Group**  
4460 Christophe Colomb  
Montreal, QC, H2J 3G5  
Phone: 514-400-6369  
Email: hello@market.pvthostel.ca

## License

© 2025 PVT Group. All rights reserved.

---
Created by [@presidentanderson](https://github.com/presidentanderson)