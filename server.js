require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieSession = require('cookie-session');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public'));
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration for login
app.use(cookieSession({
  name: 'session',
  keys: [process.env.SESSION_KEY || 'tts-secret-key'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

// Import routes
const routes = require('./src/routes/routes');
app.use('/', routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});