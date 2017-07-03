'use strict';

/**
 * A simple express server to expose unifile api
 * https://github.com/silexlabs/unifile/
 * license: GPL v2
 */
// node modules
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const serveStatic = require('serve-static');
const session = require('express-session');
const Router = require('./router.js');

// 6805 is the date of sexual revolution started in paris france 8-)
const port = process.env.PORT || 6805;
const rootUrl = process.env.SERVER_URL || `http://localhost:${port}`;

const app = express();
app.use( bodyParser.json() );
app.use(cookieParser());
app.use(session({
  secret: 'test session secret',
  resave: false,
  saveUninitialized: false,
}));

const router = new Router(app, {
  fs: {
    showHiddenFile: false,
  },
  github: {
    clientId: process.env.GITHUB_APP_ID || 'b4e46028bf36d871f68d', 
    clientSecret: process.env.GITHUB_APP_SECRET || 'c39806c4d0906cfeaac932012996a1919475cc78',
    state: 'aaathub',
    redirectUri: process.env.GITHUB_APP_REDIRECT || rootUrl + '/github/oauth_callback',
  },
  dropbox: {
    clientId: process.env.DROPBOX_APP_ID || '8lxz0i3aeztt0im',
    clientSecret: process.env.DROBOX_APP_SECRET || 'twhvu6ztqnefkh6',
    state: 'aaathub',
    redirectUri: process.env.DROPBOX_APP_REDIRECT || rootUrl + '/dropbox/oauth_callback',
  },
  ftp: {
    redirectUri: rootUrl + '/ftp/signin',
  },
});

// server 'loop'
app.listen(port, function() {
  console.log('Listening on ' + port);
});

