const express = require('express');
const { google } = require('googleapis');
const session = require('express-session');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

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

// Use a secure session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'a-very-secret-key-for-cyrano', // Change this!
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' } // Use secure cookies in production
}));

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
