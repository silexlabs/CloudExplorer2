'use strict';

/**
 * A simple express server to expose unifile api
 * https://github.com/silexlabs/unifile/
 * license: GPL v2
 */
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const session = require('express-session');
const Router = require('./router.js');

// 6805 is the date of sexual revolution started in paris france 8-)
const DEFAULT_PORT = 6805;
const port = process.env.PORT || DEFAULT_PORT;
const rootUrl = process.env.SERVER_URL || `http://localhost:${port}`;

const app = express();
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: 'test session secret'
}));

const router = new Router({
  dropbox: {
    clientId: process.env.DROPBOX_APP_ID || '8lxz0i3aeztt0im',
    clientSecret: process.env.DROBOX_APP_SECRET || 'twhvu6ztqnefkh6',
    redirectUri: process.env.DROPBOX_APP_REDIRECT || `${rootUrl}/dropbox/oauth_callback`,
    state: 'aaathub'
  },
  fs: {showHiddenFile: false},
  ftp: {redirectUri: `${rootUrl}/ftp/signin`},
  github: {
    clientId: process.env.GITHUB_APP_ID || 'f124e4148bf9d633d58b',
    clientSecret: process.env.GITHUB_APP_SECRET || '1a8fcb93d5d0786eb0a16d81e8c118ce03eefece',
    redirectUri: process.env.GITHUB_APP_REDIRECT || `${rootUrl}/github/oauth_callback`,
    state: 'aaathub'
  }
});

app.use('/', router);

// Server 'loop'
app.listen(port, () => {
  console.log(`Listening on ${port}`);
});
