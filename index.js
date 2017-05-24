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
const rootUrl = `http://localhost:${port}`;

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
    clientId: 'b4e46028bf36d871f68d', 
    clientSecret: 'c39806c4d0906cfeaac932012996a1919475cc78',
    state: 'aaathub',
  },
  dropbox: {
    clientId: '37mo489tld3rdi2',
    clientSecret: 'kqfzd11vamre6xr',
    state: 'aaathub',
    redirectUri: rootUrl + '/dropbox/oauth-callback',
  },
  ftp: {
    redirectUri: rootUrl + '/ftp/signin',
  },
});

// server 'loop'
app.listen(port, function() {
  console.log('Listening on ' + port);
});

