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

// image banks
const imageBank = require('./image-bank.js');

// File upload
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({storage});

// images
const sharp = require('sharp');
const sizeOf = require('buffer-image-size');

// statuses
const EMPTY_STATUS = 204;
const BAD_REQUEST_STATUS = 400;
const FORBIDDEN_STATUS = 403;
const NOT_FOUND_STATUS = 404;
const NOT_ALLOWED_STATUS = 405;
const SYSTEM_ERROR_STATUS = 500;

function noCache(req, res, next) {
  res.header('Cache-Control', 'private,no-cache,no-store,must-revalidate,proxy-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  next();
}

function withCache(req, res, next) {
  res.header('Cache-Control', 'public,max-age=86400,immutable'); // 24h
  next();
}

function getFile(unifile, res, session, service, path) {
  return Promise.all([
    unifile.stat(session, service, path),
    unifile.readFile(session, service, path)
  ])
}

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
    res.status(Router.getHttpStatus(err.code)).send(err.message);
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

    // image banks
    this.use(imageBank.getRouter())
    const unsplash = imageBank.unsplash(options.unsplash);
    if (options.unsplash) {
      imageBank.add({
        name: 'unsplash',
        displayName: 'Unsplash photos',
        search: unsplash.search,
        random: unsplash.random,
      });
    }

    // Serve CE static files
    const nodeModulesPath = require('node_modules-path');
    this.use('/cloud-explorer', withCache, express.static(Path.resolve(__dirname, '../dist')));
    this.use('/cloud-explorer/fonts', withCache, express.static(Path.resolve(nodeModulesPath('font-awesome'), 'font-awesome/fonts/')));
    this.use('/cloud-explorer/fonts', withCache, express.static(Path.resolve(nodeModulesPath('npm-font-open-sans'), 'npm-font-open-sans/fonts/')));

    // Search for a old session token in the cookies
    this.use((req) => {
      // Init unifile session in Express
      req.session.unifile = req.session.unifile || {};
      req.next();
    });

    // List unifile services
    this.get('/services', noCache, (req, res) => {
      res.send(this.unifile.listConnectors()
        .map(serviceName => Object.assign({
          displayName: serviceName,
          isDir: true,
          isService: true,
          mime: 'application/json',
          name: serviceName
        }, this.unifile.getInfos(req.session.unifile, serviceName)))
        .filter(obj => !obj.hideFromServicesList) // hide the services when they want to be hidden
      );
    });

    // Expose unifile API
    this.post('/:connector/authorize', noCache, (req, res) => {
      this.unifile.getAuthorizeURL(req.session.unifile, req.params.connector)
      .then((url) => res.send(url))
      .catch((err) => {
        res.status(BAD_REQUEST_STATUS).send(new Error(err.message));
      });
    });
    this.post('/:connector/logout', noCache, (req, res) => {
      req.session.unifile[req.params.connector] = {};
      res.status(EMPTY_STATUS).send();
    });

    // List files and folders
    this.get(/\/(.*)\/ls\/(.*)/, noCache, (req, res) => {
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

    this.put(/\/(.*)\/mkdir\/(.*)/, noCache, (req, res) => {
      this.unifile.mkdir(req.session.unifile, req.params[0], req.params[1])
      .then(() => {
        res.status(EMPTY_STATUS).send();
      })
      .catch((err) => Router.handleError(res, err));
    });

    this.put(/\/(.*)\/put\/(.*)/, noCache, upload.single('content'), (req, res) => {
      this.unifile.writeFile(req.session.unifile, req.params[0], req.params[1], Buffer.from(req.file.buffer, 'binary'))
      .then((result) => {
        res.send(result);
      })
      .catch((err) => Router.handleError(res, err));
    });

    const iconsRoot = Path.resolve(nodeModulesPath('file-icon-vectors'), 'file-icon-vectors/dist/icons/square-o');
    const catalog = require(iconsRoot + '/catalog.json');
    this.get(/\/(.*)\/icon\/(.*)/, withCache, (req, res) => {
      const service = req.params['0'];
      const file = req.params['1'];
      const ext = file.split('.').pop().split('?').shift().toLowerCase();
      if(options.thumbnails.extensions.includes(ext)) {
        getFile(this.unifile, res, req.session.unifile, req.params[0], req.params[1])
        .then(([fileInfo, fileContent]) => {
          if(fileInfo.mime) res.type(fileInfo.mime);
          const {width, height} = sizeOf(fileContent);
          if(width > options.thumbnails.width || height > options.thumbnails.height) {
            sharp(fileContent)
            .resize({
              width:   options.thumbnails.width,
              height:   options.thumbnails.height,
              fit: 'contain',
            })
            .jpeg({
              progressive: true,
              quality: 50,
            })
            .toBuffer((err, data, stderr) => {
              if (err) {
                Router.handleError(res, err);
              }
              else {
                res.send(Buffer.from(data, 'binary'));
              }
            });
          }
          else {
            // Buffer prevents the addition of "charset=utf-8" to the mime type
            res.send(Buffer.from(fileContent, 'binary'));
          }
        })
        .catch((err) => Router.handleError(res, err));
      }
      else if(!catalog.includes(ext)) {
        res.sendFile(`${iconsRoot}/${ext}.svg`);
      }
      else {
        res.sendFile(iconsRoot + '/blank.svg');
      }
    })

    this.get(/\/(.*)\/get\/(.*)/, noCache, (req, res) => {
      getFile(this.unifile, res, req.session.unifile, req.params[0], req.params[1])
      .then(([fileInfo, fileContent]) => {
        if(fileInfo.mime) res.type(fileInfo.mime);
        // Buffer prevents the addition of "charset=utf-8" to the mime type
        res.send(Buffer.from(fileContent, 'binary'));
      })
      .catch((err) => Router.handleError(res, err));
    });

    this.patch(/\/(.*)\/mv\/(.*)/, noCache, (req, res) => {
      if (!req.body) Router.handleError(res, new Error('No body parsed supplied'));
      this.unifile.rename(req.session.unifile, req.params[0], req.params[1], req.body.destination)
      .then(() => {
        res.status(EMPTY_STATUS).send();
      })
      .catch((err) => Router.handleError(res, err));
    });

    this.delete(/\/(.*)\/rm\//, noCache, (req, res) => {
      if (!req.body) Router.handleError(res, new Error('No body parsed supplied'));
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

    this.delete(/\/(.*)\/rmdir\/(.*)/, noCache, (req, res) => {
      this.unifile.rmdir(req.session.unifile, req.params[0], req.params[1])
      .then((result) => {
        res.status(EMPTY_STATUS).send(result);
      })
      .catch((err) => Router.handleError(res, err));
    });

    this.post(/\/(.*)\/cp\/(.*)/, noCache, (req, res) => {
      if (!req.body) Router.handleError(res, new Error('No body parsed supplied'));
      let stream = this.unifile.createReadStream(req.session.unifile, req.params[0], req.params[1]);
      // Use PassThrough to prevent request from copying headers between requests
      if (req.params[0] !== 'webdav' && req.params[0] !== 'fs') {
        stream = stream.pipe(new PassThrough());
      }
      stream.pipe(this.unifile.createWriteStream(req.session.unifile, req.params[0], req.body.destination))
      .pipe(res);
    });

    this.post(/\/(.*)\/upload\/(.*)/, upload.array('content'), noCache, (req, res) => {
      if (req.body) {
        //empty path get a 400 error, so avoid it
        const target = {
            folder: req.params[0],
            path: req.params[1] || './'
        }
        let batchPromised = null;
        if (req.files.length === 0) {
          batchPromised = this.unifile.writeFile(
            req.session.unifile,
            target.folder,
            target.path,
            req.body.content
          );
        } else if (req.files.length === 1) {
          try {
            batchPromised = this.unifile.writeFile(
              req.session.unifile,
              target.folder,
              `${target.path}/${req.files[0].originalname}`,
              req.files[0].buffer
            );
          }
          catch(err) {
            // sometimes unifile throws errors, cf https://github.com/silexlabs/unifile/issues/148
            batchPromised = Promise.reject(err);
          }
        } else {
          const actions = req.files.map((file) => ({
            content: file.buffer,
            name: 'writeFile',
            path: Path.join(target.path, file.originalname)
          }));
          batchPromised = this.unifile.batch(req.session.unifile, target.folder, actions);
        }
        batchPromised.then(() => {
          res.status(EMPTY_STATUS).send();
        })
        .catch((err) => {
          Router.handleError(res, err);
          // res.status(Router.getHttpStatus(err.code)).send(err);
        });
      }
      else {
        Router.handleError(res, new Error('No body parsed supplied'));
      }
    });

    this.get(/\/(.*)\/stat\/(.*)/, noCache, (req, res) => {
      this.unifile.stat(req.session.unifile, req.params[0], req.params[1])
      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        res.status(Router.getHttpStatus(err.code)).send(err);
      });
    });

    // Register callback url
    this.get('/:connector/oauth_callback', noCache, (req, res) => {
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
    this.post('/:connector/login_callback', express.urlencoded({ extended: true }), noCache, (req, res) => {
      if (!req.body) Router.handleError(res, new Error('No body parsed supplied'));
      this.unifile.login(req.session.unifile, req.params.connector, req.body)
      .then((result) => {
        res.cookie(`unifile_${req.params.connector}`, result);
        res.end('<script>window.close();</script>');
      })
      .catch((err) => {
        res.status(SYSTEM_ERROR_STATUS).send(err.message);
      });
    });

    this.get('/remotestorage/callback', noCache, (req, res) => {
      // Return a script that get the hash and redirect to oauth-callback
      res.end('<script>' +
        'var token = location.hash.substr(1).split("=")[1];location="/remotestorage/oauth_callback?token="+token' +
        '</script>');
    });

    this.get('/:connector/signin', noCache, (req, res) => {
      res.sendFile(Path.join(__dirname, '..', 'dist/login', `${req.params.connector}_login.html`));
    });

  }

  /*
   * Add a custom service to unifile
   */
  addService (unifileConnector) {
    this.unifile.use(unifileConnector);
  }
  /*
   * Add an image bank
   */
  addImageBank ({name, displayName, search}) {
    imageBank.add({name, displayName, search});
  }
};
