'use strict';

/**
 * A simple rooter to add routes to your express app and expose unifile api
 * https://github.com/silexlabs/unifile/
 * license: GPL v2
 */
// Node modules
const express = require('express');
const Path = require('path');
const {PassThrough} = require('stream');
const Unifile = require('unifile');
const WebDavConnector = require('unifile-webdav');

// File upload
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({storage});

const SUPPORTED_SERVICES = [
  'github',
  'dropbox',
  'ftp',
  'webdav',
  'fs',
  'sftp'
];

const EMPTY_STATUS = 204;
const BAD_REQUEST_STATUS = 400;
const FORBIDDEN_STATUS = 403;
const NOT_FOUND_STATUS = 404;
const NOT_ALLOWED_STATUS = 405;
const SYSTEM_ERROR_STATUS = 500;

/**
 * The router class
 * @use new ExpressRouter(app)
 */
module.exports = class Router extends express.Router {
  static getHttpStatus (unifileErrorCode) {
    switch (unifileErrorCode) {
      case 'ENOTSUP':
        return NOT_FOUND_STATUS;
      case 'EISDIR':
        return NOT_ALLOWED_STATUS;
      case 'EACCES':
      case 'EPERM':
        return FORBIDDEN_STATUS;
      case 'EINVAL':
        return BAD_REQUEST_STATUS;
      case 'ENOENT':
        return NOT_FOUND_STATUS;
      case 'EIO':
        return SYSTEM_ERROR_STATUS;
      default:
        return BAD_REQUEST_STATUS;
    }
  }

  static handleError (res, err) {
    res.status(Router.getHttpStatus(err.code)).send(err);
  }


  /**
   * @param {Object} options - object with the following optional attributes
   * - github, dropbox, ftp, webdav, fs, sftp... all the services included by default in unifile
   */
  constructor (options) {
    super();
    this.unifile = new Unifile();
    this.options = options;
    if (options.github) {
      this.unifile.use(new Unifile.GitHubConnector(options.github));
    }
    if (options.dropbox) {
      this.unifile.use(new Unifile.DropboxConnector(options.dropbox));
    }
    if (options.ftp) {
      this.unifile.use(new Unifile.FtpConnector(options.ftp));
    }
    if (options.webdav) {
      this.unifile.use(new WebDavConnector(options.webdav));
    }
    if (options.fs) {
      this.unifile.use(new Unifile.FsConnector(options.fs));
    }
    if (options.sftp) {
      this.unifile.use(new Unifile.SftpConnector(options.sftp));
    }

    // Serve CE static files
    this.use('/cloud-explorer', express.static(Path.resolve(__dirname, '../dist')));

    // Search for a old session token in the cookies
    this.use((req) => {
      // Init unifile session in Express
      req.session.unifile = req.session.unifile || {};
      req.next();
    });

    // Disable cache
    this.use((req, res) => {
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Expires: 0,
        Pragma: 'no-cache'
      });
      req.next();
    });

    // Parse JSON in the body when content type is json
    this.use(express.json());

    // List services
    this.get('/services', (req, res) => {
      const services = [];

      for (const key in this.options) {
        if (SUPPORTED_SERVICES.includes(key)) {
          services.push({
            displayName: this.options[key].displayName || key,
            isDir: true,
            mime: 'application/json',
            name: key
          });
        }
      }
      res.send(services);
    });

    // Expose unifile API
    this.post('/:connector/authorize', (req, res) => {
      this.unifile.getAuthorizeURL(req.session.unifile, req.params.connector)
      .then((url) => res.send(url))
      .catch((err) => {
        res.status(BAD_REQUEST_STATUS).send(new Error(err.message));
      });
    });

    // List files and folders
    this.get(/\/(.*)\/ls\/(.*)/, (req, res) => {
      this.unifile.readdir(req.session.unifile, req.params[0], req.params[1])
      .then((result) => {
        // Allows '' to filter only the folders
        if (req.query.extensions) {
          const extensions = req.query.extensions.split(',');
          res.send(result.filter((file) => file.isDir || extensions.includes(Path.extname(file.name).toLowerCase())));
        } else {
          res.send(result);
        }
      })
      .catch((err) => Router.handleError(res, err));
    });

    this.put(/\/(.*)\/mkdir\/(.*)/, (req, res) => {
      this.unifile.mkdir(req.session.unifile, req.params[0], req.params[1])
      .then(() => {
        res.status(EMPTY_STATUS).send();
      })
      .catch((err) => Router.handleError(res, err));
    });

    this.put(/\/(.*)\/put\/(.*)/, upload.single('content'), (req, res) => {
      this.unifile.writeFile(req.session.unifile, req.params[0], req.params[1], Buffer.from(req.file.buffer, 'binary'))
      .then((result) => {
        res.send(result);
      })
      .catch((err) => Router.handleError(res, err));
    });

    this.get(/\/(.*)\/get\/(.*)/, (req, res) => {
      Promise.all([
        this.unifile.stat(req.session.unifile, req.params[0], req.params[1]),
        this.unifile.readFile(req.session.unifile, req.params[0], req.params[1])
      ])
      .then(([
        fileInfo,
        fileContent
      ]) => {
        res.type(fileInfo.mime);
        // Buffer prevents the addition of "charset=utf-8" to the mime type
        res.send(Buffer.from(fileContent, 'binary'));
      })
      .catch((err) => Router.handleError(res, err));
    });

    this.patch(/\/(.*)\/mv\/(.*)/, (req, res) => {
      this.unifile.rename(req.session.unifile, req.params[0], req.params[1], req.body.destination)
      .then(() => {
        res.status(EMPTY_STATUS).send();
      })
      .catch((err) => Router.handleError(res, err));
    });

    this.delete(/\/(.*)\/rm\//, (req, res) => {
      let rmPromised = null;
      if (req.body.length === 1) {
        const [action] = req.body.filter((a) => [
          'rmdir',
          'unlink'
        ].includes(a.name));
        if (!action) {
          const err = new Error('Invalid delete action');
          err.code = 'EINVAL';
          return Router.handleError(res, err);
        }
        rmPromised = this.unifile[action.name](req.session.unifile, req.params[0], action.path);
      } else {
        rmPromised = this.unifile.batch(req.session.unifile, req.params[0], req.body);
      }
      return rmPromised.then((result) => {
        res.status(EMPTY_STATUS).send(result);
      })
      .catch((err) => Router.handleError(res, err));
    });

    this.delete(/\/(.*)\/rmdir\/(.*)/, (req, res) => {
      this.unifile.rmdir(req.session.unifile, req.params[0], req.params[1])
      .then((result) => {
        res.status(EMPTY_STATUS).send(result);
      })
      .catch((err) => Router.handleError(res, err));
    });

    this.post(/\/(.*)\/cp\/(.*)/, (req, res) => {
      let stream = this.unifile.createReadStream(req.session.unifile, req.params[0], req.params[1]);
      // Use PassThrough to prevent request from copying headers between requests
      if (req.params[0] !== 'webdav' && req.params[0] !== 'fs') {
        stream = stream.pipe(new PassThrough());
      }
      stream.pipe(this.unifile.createWriteStream(req.session.unifile, req.params[0], req.body.destination))
      .pipe(res);
    });

    this.post(/\/(.*)\/upload\/(.*)/, upload.array('content'), (req, res) => {
      let batchPromised = null;
      if (req.files.length === 0) {
        batchPromised = this.unifile.writeFile(
          req.session.unifile,
          req.params[0],
          req.params[1],
          req.body.content
        );
      } else if (req.files.length === 1) {
        batchPromised = this.unifile.writeFile(
          req.session.unifile,
          req.params[0],
          `${req.params[1]}/${req.files[0].originalname}`,
          req.files[0].buffer
        );
      } else {
        const actions = req.files.map((file) => ({
          content: file.buffer.toString(),
          name: 'writeFile',
          path: Path.join(req.params[1], file.originalname)
        }));
        batchPromised = this.unifile.batch(req.session.unifile, req.params[0], actions);
      }
      batchPromised.then(() => {
        res.status(EMPTY_STATUS).send();
      })
      .catch((err) => {
        res.status(Router.getHttpStatus(err.code)).send(err);
      });
    });

    this.get(/\/(.*)\/stat\/(.*)/, (req, res) => {
      this.unifile.stat(req.session.unifile, req.params[0], req.params[1])
      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        res.status(Router.getHttpStatus(err.code)).send(err);
      });
    });

    // Register callback url
    this.get('/:connector/oauth_callback', (req, res) => {
      if ('error' in req.query) {
        res.status(SYSTEM_ERROR_STATUS).send(req.query);
      } else {
        this.unifile.login(req.session.unifile, req.params.connector, req.query)
        .then((result) => {
          res.cookie(`unifile_${req.params.connector}`, result);
          res.end('<script>window.close();</script>');
        })
        .catch((err) => {
          res.status(SYSTEM_ERROR_STATUS).send(err);
        });
      }
    });

    // Register callback url
    this.post('/:connector/login_callback', express.urlencoded(), (req, res) => {
      this.unifile.login(req.session.unifile, req.params.connector, req.body)
      .then((result) => {
        res.cookie(`unifile_${req.params.connector}`, result);
        res.end('<script>window.close();</script>');
      })
      .catch((err) => {
        res.status(SYSTEM_ERROR_STATUS).send(err);
      });
    });

    this.get('/remotestorage/callback', (req, res) => {
      // Return a script that get the hash and redirect to oauth-callback
      res.end('<script>' +
        'var token = location.hash.substr(1).split("=")[1];location="/remotestorage/oauth_callback?token="+token' +
        '</script>');
    });

    this.get('/:connector/signin', (req, res) => {
      res.sendFile(Path.join(__dirname, '..', 'dist/login', `${req.params.connector}_login.html`));
    });
  }

  /*
   * Add a custom service to unifile
   */
  addService (unifileConnector) {
    this.unifile.use(unifileConnector);
  }
};
