require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// More detailed debug logging
console.log('Environment check:');
console.log('Stripe Key loaded:', !!process.env.STRIPE_SECRET_KEY);
console.log('Stripe Key length:', process.env.STRIPE_SECRET_KEY?.length);
console.log('First 10 chars:', process.env.STRIPE_SECRET_KEY?.substring(0, 10));

// Initialize Stripe with explicit error handling
let stripe;
try {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  console.log('Stripe initialized successfully');
} catch (error) {
  console.error('Failed to initialize Stripe:', error);
}

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

const app = express();

// Set security headers manually
app.use((req, res, next) => {
  // Set CSP header
  res.setHeader(
    'Content-Security-Policy',
    [
      // Allow self and specific domains for default
      "default-src 'self' https://*.stripe.com https://*.firebaseio.com https://identitytoolkit.googleapis.com",
      
      // Scripts - include all necessary domains
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.stripe.com https://m.stripe.network https://js.stripe.com https://*.firebaseio.com https://identitytoolkit.googleapis.com https://m.stripe.network",
      
      // Connections - include Firebase and Stripe
      "connect-src 'self' https://*.stripe.com https://api.stripe.com https://errors.stripe.com https://*.firebaseio.com wss://*.firebaseio.com https://identitytoolkit.googleapis.com",
      
      // Frames - include all necessary frame sources
      "frame-src 'self' https://*.stripe.com https://js.stripe.com https://hooks.stripe.com https://m.stripe.network",
      
      // Images
      "img-src 'self' data: https://*.stripe.com https://*.firebaseio.com",
      
      // Styles - include Google Fonts if needed
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
      
      // Fonts
      "font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com",
      
      // Web Workers and Blobs
      "worker-src 'self' blob: https://*.stripe.com",
      
      // Child sources (for iframes, workers)
      "child-src blob: https://*.stripe.com",
      
      // Other restrictions
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "media-src 'self'",
      "manifest-src 'self'"
    ].join('; ')
  );

  // Set other security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  next();
});

// Configure CORS
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Origin',
    'Accept',
    'stripe-signature',
    'Stripe-Version',
    'Stripe-Account'
  ],
  exposedHeaders: ['stripe-signature']
}));

app.use(express.json());

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Verify Firebase token middleware
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Create payment intent
app.post('/api/create-payment-intent', authenticateUser, async (req, res) => {
  try {
    const { priceId } = req.body;
    
    // Get the price details first
    const price = await stripe.prices.retrieve(priceId);
    console.log('Price details:', price); // Debug log
    
    // Create or get customer
    let customer = await stripe.customers.list({
      email: req.user.email,
      limit: 1
    });
    
    if (customer.data.length === 0) {
      customer = await stripe.customers.create({
        email: req.user.email,
        metadata: {
          firebaseUID: req.user.uid
        }
      });
    } else {
      customer = customer.data[0];
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });

    res.json({
      clientSecret: subscription.latest_invoice.payment_intent.client_secret
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get transaction history
app.get('/api/transactions', authenticateUser, async (req, res) => {
  try {
    const customerList = await stripe.customers.list({
      email: req.user.email,
      limit: 1
    });

    if (customerList.data.length === 0) {
      return res.json({ transactions: [] });
    }

    const customerId = customerList.data[0].id;

    // Get subscriptions with expanded price data
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 10,
      expand: ['data.items.data.price']
    });

    // Create a Map to store unique transactions by date
    const uniqueTransactions = new Map();

    // Process each subscription
    subscriptions.data.forEach(sub => {
      if (sub.status === 'incomplete_expired') return;

      const date = new Date(sub.created * 1000);
      const formattedDate = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
      
      // The amount is already in cents (999 = $9.99)
      const amountInDollars = (9.99).toFixed(2);

      // Only add if it's a subscription type transaction
      if (sub.object === 'subscription') {
        uniqueTransactions.set(sub.id, {
          id: sub.id,
          date: formattedDate,
          amount: amountInDollars,
          status: sub.status === 'active' || sub.status === 'trialing' ? 'success' : sub.status,
          description: 'Premium Subscription'
        });
      }
    });

    // Convert Map to array and sort by date
    const transactions = Array.from(uniqueTransactions.values())
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA;
      });

    res.json({ transactions });
  } catch (error) {
    console.error('Error in /api/transactions:', error);
    res.status(400).json({ error: error.message });
  }
});

// Add a test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

app.listen(3001, () => {
  console.log('Server running on port 3001');
}); 