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

// file upload
const multer  = require('multer');
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

/**
 * the router class
 * @use new ExpressRouter(app)
 */
module.exports = class Router {
  static getHttpStatus(unifileErrorCode) {
    switch(unifileErrorCode) {
      case 'ENOTSUP':
        return '405';
      case 'EISDIR':
        return '405';
      case 'EACCES':
        return '403';
      case 'EINVAL':
        return '400';
      case 'ENOENT':
        return '404';
      case 'EIO':
        return '500';
      default:
        return '400';
    }
  }
  static handleError(res, err) {
    console.error(err.message);
    res.status(Router.getHttpStatus(err.code)).send(err);
  }
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
      req.next();
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
	if(req.query.extensions != null) { // allows '' to filter only the folders
          const extensions = req.query.extensions.split(',');
          res.send(result.filter(file => file.isDir || extensions.includes(Path.extname(file.name).toLowerCase())));
	}
	else {
          res.send(result);
	}
      })
      .catch((err) => Router.handleError(res, err));
    });
    
    app.put(/\/(.*)\/mkdir\/(.*)/, (req, res) => {
      this.unifile.mkdir(req.session.unifile, req.params[0], req.params[1])
      .then((result) => {
        res.send(result);
      })
      .catch((err) => Router.handleError(res, err));
    });

    app.put(/\/(.*)\/put\/(.*)/, upload.single('content'), (req, res) => {
      this.unifile.writeFile(req.session.unifile, req.params[0], req.params[1], Buffer.from(req.file.buffer, 'binary'))
      .then((result) => {
        res.send(result);
      })
      .catch((err) => Router.handleError(res, err));
    });
    
    app.get(/\/(.*)\/get\/(.*)/, (req, res) => {
      Promise.all([
	this.unifile.stat(req.session.unifile, req.params[0], req.params[1]),
	this.unifile.readFile(req.session.unifile, req.params[0], req.params[1]),
      ])
      .then(([fileInfo, fileContent]) => {
        res.type(fileInfo.mime);
	res.send(Buffer.from(fileContent, 'binary')); // Buffer prevents the addition of "charset=utf-8" to the mime type
      })
      .catch((err) => Router.handleError(res, err));
    });
    
    app.patch(/\/(.*)\/mv\/(.*)/, (req, res) => {
      this.unifile.rename(req.session.unifile, req.params[0], req.params[1], req.body.destination)
      .then((result) => {
        res.send(result);
      })
      .catch((err) => Router.handleError(res, err));
    });
    
    app.delete(/\/(.*)\/rm\/(.*)/, (req, res) => {
      this.unifile.unlink(req.session.unifile, req.params[0], req.params[1])
      .then((result) => {
        res.send(result);
      })
      .catch((err) => Router.handleError(res, err));
    });
    
    app.delete(/\/(.*)\/rmdir\/(.*)/, (req, res) => {
      this.unifile.rmdir(req.session.unifile, req.params[0], req.params[1])
      .then((result) => {
        res.send(result);
      })
      .catch((err) => Router.handleError(res, err));
    });
    
    app.post(/\/(.*)\/cp\/(.*)/, (req, res) => {
      let stream = this.unifile.createReadStream(req.session.unifile, req.params[0], req.params[1]);
      // Use PassThrough to prevent request from copying headers between requests
      if(req.params[0] !== 'webdav' && req.params[0] !== 'fs') stream = stream.pipe(new PassThrough());
      stream.pipe(unifile.createWriteStream(req.session.unifile, req.params[0], req.body.destination))
      .pipe(res);
    });
    
    app.post(/\/(.*)\/batch\/(.*)/, (req, res) => {
      this.unifile.batch(req.session.unifile, req.params[0], req.body)
      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        console.error(err, err);
        res.status(Router.getHttpStatus(err.code)).send(err);
      });
    });
    
    app.get(/\/(.*)\/stat\/(.*)/, (req, res) => {
      this.unifile.stat(req.session.unifile, req.params[0], req.params[1])
      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        res.status(Router.getHttpStatus(err.code)).send(err);
      });
    });
    
    // register callback url
    app.get('/:connector/oauth_callback', (req, res) => {
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
        'var token = location.hash.substr(1).split("=")[1];location="/remotestorage/oauth_callback?token="+token' +
        '</script>');
    });
    
    app.get('/:connector/signin', (req, res) => {
      res.sendFile(Path.join(__dirname, 'dist/login', req.params.connector + '_login.html'));
    });
  }


  /**
   * add a custom service to unifile
   */
  addService(unifileConnector) {
    this.unifile.use(unifileConnector);
  }
}

