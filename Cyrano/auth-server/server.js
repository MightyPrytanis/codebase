const express = require('express');
const { google } = require('googleapis');
const session = require('express-session');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
app.enable('trust proxy');
const port = process.env.PORT || 3000;

// Enhanced rate limiting using express-rate-limit
// General rate limiter (100 requests per 15 minutes)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per window
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for OAuth endpoints (5 requests per 15 minutes)
const oauthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 requests per window (protects against brute force)
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

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

const isProduction = process.env.NODE_ENV === 'production';

app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false, // Changed from true for security - don't create session until needed
  name: 'cyrano.session', // Custom session name to avoid fingerprinting
  cookie: { 
    secure: isProduction, // Require TLS in production only (allows HTTP in development) // nosemgrep: javascript.express.security.audit.express-cookie-settings.express-cookie-session-no-secure
    httpOnly: true, // Always prevent XSS access to cookies
    sameSite: 'strict', // CSRF protection via SameSite attribute
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // Explicit expiry
    domain: isProduction ? process.env.COOKIE_DOMAIN || undefined : undefined, // Set domain in production
    path: '/'
  }
}));

// Enforce HTTPS in production
app.use((req, res, next) => {
  // Check both req.secure (direct) and X-Forwarded-Proto (behind proxy)
  const isSecure = req.secure || req.get('X-Forwarded-Proto') === 'https';
  if (!isSecure && isProduction) {
    const host = req.headers.host || '';
    return res.redirect(301, `https://${host}${req.url}`);
  }
  next();
;

// Apply general rate limiting to all routes
app.use(generalLimiter);

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

// 2. Redirect to Google to start the OAuth flow (with strict rate limiting)
app.get('/connect/google', oauthLimiter, (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // 'offline' is crucial for getting a refresh_token
    scope: SCOPES,
    prompt: 'consent' // Forces the consent screen to ensure you get a refresh_token
  });
  res.redirect(authUrl);
});

// 3. The callback URL that Google redirects to after user consent (with strict rate limiting)
app.get('/oauth2callback', oauthLimiter, async (req, res) => {
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
)
)
}