const express = require('express');
const app = express();
require('dotenv').config();
const { initializeDatabase } = require('./sql/db-init');
const adminRoutes = require('./routes/admin.routes');
const salespersonRoutes = require('./routes/salesperson.routes');
const supplierRoutes = require('./routes/supplier.routes');
const cors = require('cors');
const contentRoutes = require('./routes/contenthome.routes');
const bodyParser = require('body-parser');
const path = require('path');
const cookieParser = require('cookie-parser');

app.use(express.json());
app.use(cookieParser()); // Add cookie parser middleware

// app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Enable CORS for Angular frontend (both local development and deployed Vercel app)
const allowedOrigins = [
  'http://localhost:4200',
  'https://stockeasy-ims.vercel.app'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

const meRouter = require('./routes/auth/me.router');
app.use('/auth', meRouter);

const categoryRoutes = require('./routes/category');
app.use('/api/category', categoryRoutes);

const productRoutes = require('./routes/product');
app.use('/api/product', productRoutes);

const orderRoutes = require('./routes/orders.routes');
app.use('/api/orders', orderRoutes);  

// In your main backend file (e.g., app.js or server.js)
const billingRoutes = require('./routes/billing.routes');
app.use('/api/billing', billingRoutes);

const invoiceRoutes = require("./routes/invoice.routes");// Or whatever base path you use
app.use("/api/invoice", invoiceRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// API routes
app.use('/api/contenthome', contentRoutes);

// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
const contentAboutRoutes = require('./routes/contentabout.routes');
app.use('/api/contentabout', contentAboutRoutes);

const featuresRoutes = require('./routes/contentfea.routes');
app.use('/api/feature', featuresRoutes);

// const featureCardRoutes = require('./routes/contentfeacard.routes');
// app.use('/api/cards', featureCardRoutes);

const dashboardRoutes = require('./routes/dashboard.routes');
app.use('/api/dashboard', dashboardRoutes);


app.use('/api/admin', adminRoutes);
app.use('/api/salesperson', salespersonRoutes);
app.use('/api/supplier', supplierRoutes);

const PORT = process.env.PORT || 3000;

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ Failed to initialize database:', err);
    process.exit(1);
  });

