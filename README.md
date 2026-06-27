# IMS Backend API

A robust Node.js/Express backend API for the Inventory Management System (IMS) with MySQL database integration, JWT authentication, and comprehensive business logic.

## 🚀 Overview

This backend service provides a complete REST API for managing inventory, orders, suppliers, sales personnel, and user authentication. Built with Node.js and Express.js, it features secure authentication, role-based access control, and efficient database operations.

## 🛠️ Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js 5.1.0
- **Database**: MySQL2 3.14.3
- **Authentication**: JSON Web Tokens (JWT) 9.0.2
- **Password Hashing**: Bcrypt 6.0.0
- **File Upload**: Multer 2.0.2
- **Environment Management**: Dotenv 17.2.0
- **CORS**: CORS 2.8.5
- **Development**: Nodemon 3.1.10

## 📁 Project Structure

```
ims_backend/
├── config/
│   ├── db.js                    # Database connection configuration
│   └── jwt.config.js            # JWT configuration and secrets
├── controllers/
│   ├── admin.controller.js      # Admin business logic
│   ├── auth.controller.js       # Authentication logic
│   ├── product.controller.js    # Product management logic
│   ├── salesperson.controller.js# Salesperson management logic
│   └── supplier.controller.js   # Supplier management logic
├── middleware/
│   ├── auth.middleware.js       # JWT authentication middleware
│   └── role.middleware.js       # Role-based access control
├── models/
│   ├── billing.model.sql        # Billing database schema
│   ├── order.model.sql          # Order database schema
│   ├── product.model.sql        # Product database schema
│   └── setup_default_supplier.sql # Default data setup
├── routes/
│   ├── auth/
│   │   └── me.router.js         # User profile routes
│   ├── admin.routes.js          # Admin API routes
│   ├── auth.routes.js           # Authentication routes
│   ├── billing.routes.js        # Billing management routes
│   ├── category.js              # Product category routes
│   ├── contentabout.routes.js   # About page content routes
│   ├── contentfea.routes.js     # Features content routes
│   ├── contenthome.routes.js    # Homepage content routes
│   ├── dashboard.routes.js      # Dashboard data routes
│   ├── invoice.routes.js        # Invoice management routes
│   ├── logout.js                # Logout functionality
│   ├── orders.routes.js         # Order management routes
│   ├── product.js               # Product API routes
│   ├── product.routes.js        # Extended product routes
│   ├── refresh.router.js        # Token refresh routes
│   ├── salesperson.routes.js    # Salesperson management routes
│   └── supplier.routes.js       # Supplier management routes
├── sql/
│   └── setup_default_supplier.sql # Database initialization scripts
├── uploads/                     # File upload directory
├── utils/
│   ├── jwt.util.js              # JWT utility functions
│   └── password.util.js         # Password hashing utilities
├── server.js                    # Main application entry point
├── package.json                 # Project dependencies and scripts
├── .env                         # Environment variables (not in git)
└── README.md                    # This documentation file
```

## 🔧 Installation & Setup

### Prerequisites
- **Node.js** (v16 or higher)
- **MySQL** (v8.0 or higher)
- **npm** or **yarn**

### Installation Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd ims_backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Configuration**
Create a `.env` file in the root directory:
```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ims_database
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_key
JWT_EXPIRE_TIME=3600  # 1 hour in seconds
JWT_REFRESH_EXPIRE_TIME=604800  # 7 days in seconds

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:4200

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880  # 5MB in bytes
```

4. **Database Setup**
```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE ims_database;
USE ims_database;

# Run initialization scripts (if available)
source sql/setup_default_supplier.sql;
```

5. **Start the server**
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000` (or your configured PORT).

## 🔐 Authentication & Authorization

### JWT Authentication Flow
1. **Login** → Receive access token + refresh token
2. **API Requests** → Include `Authorization: Bearer <token>` header
3. **Token Refresh** → Use refresh token to get new access token
4. **Logout** → Invalidate tokens

### Role-Based Access Control
- **Admin**: Full system access
- **Supplier**: Limited to supplier-specific operations
- **Salesperson**: Access to sales-related functions

### Protected Routes
All API routes except authentication endpoints require valid JWT tokens.

## 📡 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints

#### User Authentication
```http
POST   /api/auth/register        # User registration
POST   /api/auth/login           # User login
POST   /api/auth/logout          # User logout
POST   /api/auth/refresh         # Refresh access token
GET    /auth/me                  # Get current user profile
```

**Login Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Login Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "admin",
    "name": "John Doe"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Product Management

#### Product Operations
```http
GET    /api/product/all          # List all products
POST   /api/product/add          # Create new product
GET    /api/product/:id          # Get product by ID
PUT    /api/product/:id          # Update product
DELETE /api/product/:id          # Delete product
POST   /api/product/upload       # Bulk upload products
```

**Create Product Request:**
```json
{
  "name": "Product Name",
  "category": "Electronics",
  "buyingPrice": 100.00,
  "sellingPrice": 150.00,
  "quantity": 50,
  "threshold": 10,
  "supplier": "Supplier Name",
  "description": "Product description"
}
```

#### Category Management
```http
GET    /api/category             # List all categories
POST   /api/category             # Create new category
PUT    /api/category/:id         # Update category
DELETE /api/category/:id         # Delete category
```

### Order Management

#### Order Operations
```http
GET    /api/orders               # List all orders
POST   /api/orders/add           # Create new order
GET    /api/orders/:id           # Get order by ID
PUT    /api/orders/:id           # Update order
DELETE /api/orders/:id           # Delete order
GET    /api/orders/supplier/:id  # Get orders by supplier
```

**Create Order Request:**
```json
{
  "productId": 1,
  "quantity": 10,
  "supplierId": 1,
  "deliveryDate": "2025-02-01",
  "notes": "Urgent order"
}
```

### Supplier Management

#### Supplier Operations
```http
GET    /api/supplier             # List all suppliers
POST   /api/supplier/add         # Create new supplier
GET    /api/supplier/:id         # Get supplier by ID
PUT    /api/supplier/:id         # Update supplier
DELETE /api/supplier/:id         # Delete supplier
GET    /api/supplier/orders/:id  # Get supplier orders
```

**Create Supplier Request:**
```json
{
  "name": "Supplier Name",
  "email": "supplier@example.com",
  "phone": "+1234567890",
  "address": "123 Supplier Street",
  "city": "City Name",
  "country": "Country",
  "category": "Electronics"
}
```

### Salesperson Management

#### Salesperson Operations
```http
GET    /api/salesperson          # List all salespeople
POST   /api/salesperson/add      # Create new salesperson
GET    /api/salesperson/:id      # Get salesperson by ID
PUT    /api/salesperson/:id      # Update salesperson
DELETE /api/salesperson/:id      # Delete salesperson
```

### Admin Operations

#### Admin Dashboard
```http
GET    /api/admin/dashboard      # Dashboard statistics
GET    /api/admin/analytics      # Analytics data
GET    /api/admin/reports        # Generate reports
```

#### Billing & Invoices
```http
GET    /api/billing              # List all bills
POST   /api/billing/add          # Create new bill
GET    /api/invoice              # List all invoices
POST   /api/invoice/generate     # Generate invoice
```

### Content Management

#### Dynamic Content
```http
GET    /api/content/home         # Homepage content
PUT    /api/content/home         # Update homepage content
GET    /api/content/features     # Features content
PUT    /api/content/features     # Update features content
GET    /api/content/about        # About page content
PUT    /api/content/about        # Update about content
```

## 🗄️ Database Schema

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('admin', 'supplier', 'salesperson') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Products Table
```sql
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    buying_price DECIMAL(10,2) NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    threshold INT NOT NULL DEFAULT 0,
    supplier_id INT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);
```

#### Orders Table
```sql
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id VARCHAR(50) UNIQUE NOT NULL,
    product_id INT NOT NULL,
    supplier_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_value DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    order_date DATE NOT NULL,
    delivery_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);
```

## 🔒 Security Features

### Authentication Security
- **JWT tokens** with secure secrets
- **Password hashing** using bcrypt with salt rounds
- **Refresh token** mechanism for session management
- **Token expiration** handling

### Data Protection
- **SQL injection prevention** with parameterized queries
- **Input validation** and sanitization
- **CORS configuration** for cross-origin requests
- **Environment variables** for sensitive data

### Authorization
- **Role-based access control** middleware
- **Route protection** for authenticated users
- **Permission validation** for specific operations

## 📊 Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error details (development only)"
  },
  "timestamp": "2025-01-08T12:00:00.000Z"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `500` - Internal Server Error

## 🚀 Development

### Available Scripts
```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run tests (not implemented)
```

### Development Tools
- **Nodemon** for auto-restart during development
- **Environment variables** for configuration
- **Debug logging** for troubleshooting

### Testing Database Connections
```bash
node check_users.js          # Test user table operations
node check_relationships.js   # Test table relationships
node check_invoice_table.js   # Test invoice table
node simple_check.js          # Basic connectivity test
```

## 📝 Logging

### Request Logging
All API requests are logged with:
- Timestamp
- HTTP method and URL
- Request body (sensitive data excluded)
- Response status
- Processing time

### Error Logging
- Error stack traces (development only)
- Database query errors
- Authentication failures
- Validation errors

## 🔧 Configuration

### Environment Variables
- `DB_*` - Database connection settings
- `JWT_*` - JWT token configuration
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode
- `UPLOAD_DIR` - File upload directory

### CORS Configuration
```javascript
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true,
  optionSuccessStatus: 200
};
```

## 🚀 Deployment

### Production Setup
1. **Environment Configuration**
   - Set `NODE_ENV=production`
   - Configure production database
   - Set secure JWT secrets

2. **Database Migration**
   - Run production database migrations
   - Set up database indexes
   - Configure database backups

3. **Server Configuration**
   - Use process manager (PM2)
   - Configure reverse proxy (Nginx)
   - Set up SSL certificates
   - Configure monitoring

### PM2 Deployment
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start server.js --name "ims-backend"

# Monitor application
pm2 monitor

# Set up auto-restart
pm2 startup
pm2 save
```

## 🔍 Monitoring & Health Checks

### Health Check Endpoint
```http
GET /api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-08T12:00:00.000Z",
  "uptime": 3600,
  "database": "connected",
  "memory": {
    "used": "45.2 MB",
    "total": "512 MB"
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Follow coding standards and conventions
4. Add tests for new functionality
5. Update documentation
6. Commit changes (`git commit -m 'Add new feature'`)
7. Push to branch (`git push origin feature/new-feature`)
8. Create a Pull Request

### Coding Standards
- Use **ES6+** features
- Follow **camelCase** naming convention
- Add **JSDoc** comments for functions
- Use **async/await** for asynchronous operations
- Implement proper **error handling**

## 📞 Support

For technical support and questions:
- **GitHub Issues**: [Create an issue](https://github.com/abishek17624/ims/issues)
- **Email**: abishek17624@gmail.com
- **Documentation**: Check the inline code comments

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🚀 Future Enhancements

- [ ] **GraphQL API** implementation
- [ ] **WebSocket** real-time updates
- [ ] **Microservices** architecture migration
- [ ] **Docker** containerization
- [ ] **Redis** caching layer
- [ ] **Elasticsearch** for advanced search
- [ ] **API rate limiting**
- [ ] **Comprehensive test suite**
- [ ] **API documentation** with Swagger
- [ ] **Database migrations** system

---

**Built with ❤️ using Node.js and Express.js**

*Last updated: January 8, 2025*
