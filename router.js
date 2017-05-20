'use strict';

/**
 * A simple rooter to add routes to your express app and expose unifile api
 * https://github.com/silexlabs/unifile/
 * license: GPL v2
 */
// node modules
const Path = require('path');
const PassThrough = require('stream').PassThrough;
const serveStatic = require('serve-static');
const Unifile = require('unifile');

// unifile connectors
/*
const GitHubConnector = require('./node_modules/unifile/lib/unifile-github.js');
const DropboxConnector = require('./node_modules/unifile/lib/unifile-dropbox.js');
const FtpConnector = require('./node_modules/unifile/lib/unifile-ftp.js');
const WebDavConnector = require('./node_modules/unifile/lib/unifile-webdav.js');
const FsConnector = require('./node_modules/unifile/lib/unifile-fs.js');
const SftpConnector = require('./node_modules/unifile/lib/unifile-sftp.js');
*/

/**
 * the router class
 * @use new ExpressRouter(app)
 */
module.exports = class Router {
  /**
   * @param {Object} app - the express app
   * @param {Object} options - object with the following optional attributes
   * - github, dropbox, ftp, webdav, fs, sftp... all the services included by default in unifile
   */
  constructor(app, options) {
    this.unifile = new Unifile();
    this.options = options;
    if(options.github) this.unifile.use(new Unifile.GitHubConnector(options.github));
    if(options.dropbox) this.unifile.use(new Unifile.DropboxConnector(options.dropbox));
    if(options.ftp) this.unifile.use(new Unifile.FtpConnector(options.ftp));
    if(options.webdav) this.unifile.use(new Unifile.WebDavConnector(options.webdav));
    if(options.fs) this.unifile.use(new Unifile.FsConnector(options.fs));
    if(options.sftp) this.unifile.use(new Unifile.SftpConnector(options.sftp));
    
    // serve CE static files
    app.use('/cloud-explorer', serveStatic(__dirname+'/dist'));

    // Search for a old session token in the cookies
    app.use((req, res) => {
      // Init unifile session in Express
      req.session.unifile = req.session.unifile || {};
    
      let response;
      if(req.cookies.unifile_github)
        response = this.unifile.setAccessToken(req.session.unifile, 'github', req.cookies.unifile_github);
      if(req.cookies.unifile_dropbox)
        response = this.unifile.setAccessToken(req.session.unifile, 'dropbox', req.cookies.unifile_dropbox);
    
      if(response)
        response.then(() => req.next());
      else req.next();
    });
    
    // list services 
    app.get('/services', (req, res) => {
      const services = [];

      this.unifile.connectors
      .forEach(connector => services.push(connector.getInfos(req.session.unifile)));
/*
      for(let key in this.options) services.push({
        name: key,
        displayName: this.options[key].displayName || key,
        mime: 'application/json',
        isDir: true,
      });
      */
      res.send(services);
    });

    // expose unifile API
    app.post('/:connector/authorize', (req, res) => {
      this.unifile.getAuthorizeURL(req.session.unifile, req.params.connector)
      .catch((err) => {
        console.error('Error while authorizing Unifile', err);
        res.statusCode = 400;
        res.end();
      })
      .then((result) => res.end(result));
    });

    // List files and folders
    app.get(/\/(.*)\/ls\/(.*)/, (req, res) => {
      this.unifile.readdir(req.session.unifile, req.params[0], req.params[1])
      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        console.error(err);
        res.status(400).send(err);
      });
    });
    
    app.put(/\/(.*)\/mkdir\/(.*)/, (req, res) => {
      this.unifile.mkdir(req.session.unifile, req.params[0], req.params[1])
      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        console.error(err);
        res.status(400).send(err);
      });
    });
    
    app.put(/\/(.*)\/put\/(.*)/, (req, res) => {
      this.unifile.writeFile(req.session.unifile, req.params[0], req.params[1], req.body.content)
      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        console.error(err);
        res.status(400).send(err);
      });
    });
    
    app.get(/\/(.*)\/get\/(.*)/, (req, res) => {
      this.unifile.readFile(req.session.unifile, req.params[0], req.params[1])
      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        console.error(err);
        res.status(400).send(err);
      });
    });
    
    app.patch(/\/(.*)\/mv\/(.*)/, (req, res) => {
      this.unifile.rename(req.session.unifile, req.params[0], req.params[1], req.body.destination)
      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        console.error(err);
        res.status(400).send(err);
      });
    });
    
    app.delete(/\/(.*)\/rm\/(.*)/, (req, res) => {
      this.unifile.unlink(req.session.unifile, req.params[0], req.params[1])
      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        console.error(err);
        res.status(400).send(err);
      });
    });
    
    app.delete(/\/(.*)\/rmdir\/(.*)/, (req, res) => {
      this.unifile.rmdir(req.session.unifile, req.params[0], req.params[1])
      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        console.error(err);
        res.status(400).send(err);
      });
    });
    
    app.post(/\/(.*)\/cp\/(.*)/, (req, res) => {
      let stream = this.unifile.createReadStream(req.session.unifile, req.params[0], req.params[1]);
      // Use PassThrough to prevent request from copying headers between requests
      if(req.params[0] !== 'webdav' && req.params[0] !== 'fs') stream = stream.pipe(new PassThrough());
      stream.pipe(unifile.createWriteStream(req.session.unifile, req.params[0], req.body.destination))
      .pipe(res);
    });
    
    app.post(/\/(.*)\/batch\/(.*)/, (req, res) => {
      const path = req.params[1];
      const batch = [
        {name: 'mkdir', path: path},
        {name: 'writeFile', path: path + '/test.txt', content: 'Hello world'},
        {name: 'writeFile', path: path + '/test2.txt', content: 'Hello world too'},
        {name: 'rename', path: path + '/test.txt', destination: path + '/test_old.txt'},
        {name: 'unlink', path: path + '/test2.txt'},
        {name: 'rmdir', path: path}
      ];
      this.unifile.batch(req.session.unifile, req.params[0], batch)
      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        console.error(err);
        res.status(400).send(err);
      });
    });
    
    app.get(/\/(.*)\/stat\/(.*)/, (req, res) => {
      this.unifile.stat(req.session.unifile, req.params[0], req.params[1])
      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        res.status(400).send(err.message);
      });
    });
    
    // register callback url
    app.get('/:connector/oauth-callback', (req, res) => {
      if('error' in req.query) {
        res.status(500).send(req.query);
      } else {
        this.unifile.login(req.session.unifile, req.params.connector, req.query)
        .then((result) => {
          res.cookie('unifile_' + req.params.connector, result);
          res.end('<script>window.close();</script>');
        })
        .catch((err) => {
          console.error('ERROR', err);
          res.status(500).send(err);
        });
      }
    });
    
    app.get('/remotestorage/callback', (req, res) => {
      // Return a script that get the hash and redirect to oauth-callback
      res.end('<script>' +
        'var token = location.hash.substr(1).split("=")[1];location="/remotestorage/oauth-callback?token="+token' +
        '</script>');
    });
    
    app.get('/:connector/signin', (req, res) => {
      res.sendFile(Path.join(__dirname, 'public', req.params.connector + '_login.html'));
    });
  }


  /**
   * add a custom service to unifile
   */
  addService(unifileConnector) {
    this.unifile.use(unifileConnector);
  }
}

