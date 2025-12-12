const express = require('express');
const { google } = require('googleapis');
const session = require('express-session');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Simple rate limiting middleware (in-memory store)
// For production, consider using express-rate-limit with Redis
const rateLimitStore = new Map();
const rateLimitMiddleware = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100; // Max 100 requests per window
  
  if (!rateLimitStore.has(ip)) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }
  
  const limit = rateLimitStore.get(ip);
  if (now > limit.resetTime) {
    limit.count = 1;
    limit.resetTime = now + windowMs;
    return next();
  }
  
  if (limit.count >= maxRequests) {
    return res.status(429).json({ error: 'Too many requests, please try again later' });
  }
  
  limit.count++;
  next();
};

// --- CONFIGURATION ---
// IMPORTANT: Use environment variables for these in production!
// Do not commit your secrets to GitHub.
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID_HERE';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'YOUR_CLIENT_SECRET_HERE';
// This should be the public URL of your Cyrano server
const REDIRECT_URI = process.env.REDIRECT_URI || `http://localhost:${port}/oauth2callback`;

// Scopes define the permissions your app requests from the user.
const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email', // Basic profile info
  'https://www.googleapis.com/auth/gmail.readonly',   // To read email
  'https://www.googleapis.com/auth/calendar.readonly' // To read calendar
];

// Disable X-Powered-By header to prevent information disclosure
app.disable('x-powered-by');

// Use a secure session middleware
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error('SESSION_SECRET environment variable is required');
}
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    sameSite: 'strict' // CSRF protection via SameSite attribute
  }
}));

// Apply rate limiting to all routes
app.use(rateLimitMiddleware);

// CSRF protection middleware
// For production, consider using csurf or csrf packages
app.use((req, res, next) => {
  // Skip CSRF for GET requests
  if (req.method === 'GET') {
    return next();
  }
  
  // For POST/PUT/DELETE, validate origin header
  // This provides basic CSRF protection by ensuring requests come from expected origins
  const origin = req.get('origin');
  const referer = req.get('referer');
  
  // Define allowed origins (whitelist)
  const allowedOrigins = [
    'http://localhost:5173',  // LexFiat dev
    'http://localhost:5174',  // Arkiver dev
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
  ];
  
  // In production, add your actual domain(s) here
  if (process.env.NODE_ENV === 'production') {
    const productionOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
    allowedOrigins.push(...productionOrigins);
  }
  
  // Extract origin from referer if origin header is missing
  let requestOrigin = origin;
  if (!requestOrigin && referer) {
    try {
      const refererUrl = new URL(referer);
      requestOrigin = refererUrl.origin;
    } catch (e) {
      // Invalid referer URL, will be rejected below
    }
  }
  
  // Reject requests without origin/referer or from non-whitelisted origins
  if (!requestOrigin || !allowedOrigins.includes(requestOrigin)) {
    return res.status(403).json({ 
      error: 'CSRF protection: Request origin not allowed',
      allowedOrigins: process.env.NODE_ENV === 'development' ? allowedOrigins : undefined
    });
  }
  
  next();
});

// --- OAuth2 Client Setup ---
const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

// --- ROUTES ---

// 1. The main setup page, served from the 'views' directory
app.get('/setup', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'setup.html'));
});

// 2. Redirect to Google to start the OAuth flow
app.get('/connect/google', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // 'offline' is crucial for getting a refresh_token
    scope: SCOPES,
    prompt: 'consent' // Forces the consent screen to ensure you get a refresh_token
  });
  res.redirect(authUrl);
});

// 3. The callback URL that Google redirects to after user consent
app.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Error: Authorization code not provided by Google.');
  }

  try {
    // Exchange the single-use authorization code for a long-lived token set
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    console.log('Tokens received for user. In a real app, you would save these now:', tokens);
    req.session.google_tokens = tokens; // Storing in session only for this demo

    // You can now verify the connection by making a sample API call
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();
    console.log('Successfully connected for user:', data.email);

    req.session.email = data.email;

    res.redirect('/setup/success');

  } catch (error) {
    console.error('Error exchanging authorization code for tokens:', error.message);
    res.status(500).send('Authentication failed. Could not exchange code for token.');
  }
});

// 4. A simple success page
app.get('/setup/success', (req, res) => {
    if (req.session.email) {
        res.send(`
            <h1>Connection Successful!</h1>
            <p>Your Google account (<strong>${req.session.email}</strong>) is now connected to the Cyrano platform.</p>
            <p><a href="/setup">Return to Connections Dashboard</a></p>
        `);
    } else {
        res.redirect('/setup');
    }
});


app.listen(port, () => {
  console.log(`Cyrano MCP - Integrations server running at http://localhost:${port}`);
});
