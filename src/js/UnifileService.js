import '@babel/polyfill';
import {ROOT_URL} from './ServiceUtils';

const STORAGE_KEY_LS_CACHE = 'CloudExplorer.lsCache';

const POLLING_FREQUENCY = 200;
const OK_STATUS = 200;
const CREATED_STATUS = 201;
const EMPTY_STATUS = 204;
const OK_STATUSES = [
  OK_STATUS,
  CREATED_STATUS,
  EMPTY_STATUS
];

const serviceMap = new Map();

export default class {

  currentPath = [];

  extensions = null;

  constructor (path) {
    this.currentPath = path;
  }

  setExtensions (extensions) {
    this.extensions = extensions;
  }

  getStorageKey (path) {
    return `${STORAGE_KEY_LS_CACHE}('${path.join('/')}')`;
  }

  getPath (path) {
    return path.slice(1).join('/');
  }

  getIconUrl (path, name) {
    const nameWithSlash = path.length > 1 ? `/${name}` : name;
    return `${ROOT_URL}${path[0]}/icon/${this.getPath(path)}${nameWithSlash}`;
  }

  getUrl (path) {
    return `${ROOT_URL}${path[0]}/get/${this.getPath(path)}`;
  }

  getServices () {
    return new Promise((resolve, reject) => {
      this.call('services', (services) => {
        services.forEach((service) => {
          serviceMap.set(service.name, service);
        });
        resolve(services);
      }, (e) => reject(e));
    });
  }

  getServiceByName (name) {
    return serviceMap.get(name);
  }

  read (path) {
    return new Promise((resolve, reject, progress = null) => {
      this.call(
        `${path[0]}/get/${this.getPath(path)}`,
        (res) => resolve(res), (e) => reject(e), 'GET', '', progress, false
      );
    });
  }

  ls (path = null) {
    return new Promise((resolve, reject) => {
      const pathToLs = path || this.currentPath;
      if (pathToLs.length > 0) {
        const filters = this.extensions ? `?extensions=${this.extensions.join(',')}` : '';

        this.call(`${pathToLs[0]}/ls/${pathToLs.slice(1).join('/')}${filters}`, (res) => {
          sessionStorage.setItem(this.getStorageKey(path), JSON.stringify(res));
          resolve(res);
        }, (e) => reject(e));
      } else {
        (this.getServices().then((res) => {
          sessionStorage.setItem(this.getStorageKey(path), JSON.stringify(res));
          resolve(res);
        })
        .catch((e) => {
          console.log('unifile getServices failed', e);
        }));
      }
    });
  }

  lsHasCache (path = null) {
    return Boolean(sessionStorage.getItem(this.getStorageKey(path)));
  }

  lsGetCache (path = null) {
    try {
      const cached = sessionStorage.getItem(this.getStorageKey(path));
      if (cached) return JSON.parse(cached);
      return [];
    } catch (e) {
      return [];
    }
  }

  mkdir (path, relative = false) {
    return new Promise((resolve, reject) => {
      const absPath = relative ? this.currentPath.concat(path) : path;
      this.call(
        `${absPath[0]}/mkdir/${absPath.slice(1).join('/')}`,
        (res) => resolve(res), (e) => reject(e), 'PUT'
      );
    });
  }

  rename (name, newName) {
    return new Promise((resolve, reject) => {
      const absPath = this.currentPath.concat([name]);
      const absNewPath = this.currentPath.slice(1).concat([newName]);
      this.call(
        `${absPath[0]}/mv/${absPath.slice(1).join('/')}`,
        resolve, reject,
        'PATCH',
        JSON.stringify({destination: absNewPath.join('/')})
      );
    });
  }

  cd (path) {
    return new Promise((resolve, reject) => {
      if (path.length === 1 && path[0] !== this.currentPath[0]) {
        this.auth(path[0])
        .then(() => {
          this.currentPath = path;
          resolve(this.currentPath);
        })
        .catch((e) => {
          reject(e);
        });
      } else {
        this.currentPath = path;
        resolve(this.currentPath);
      }
    });
  }

  upload (path, files, progress = null) {
    return new Promise((resolve, reject) => {
      this.call(
        `${path[0]}/upload/${this.getPath(path)}`,
        resolve,
        reject,
        'POST',
        files,
        progress,
        false,
        true
      );
    });
  }

  delete (path, files) {
    return new Promise((resolve, reject) => {
      this.call(`${path[0]}/rm/`, resolve, reject, 'DELETE', JSON.stringify(files));
    });
  }

  logout (service) {
    return new Promise((resolve, reject) => {
      this.call(
        `${service}/logout/`,
        resolve,
        reject,
        'POST'
      );
    });

  }

  // The auth method has to be called on a click or keydown in order not to be blocked by the browser
  auth (serviceName) {
    return new Promise((resolve, reject) => {
      const service = this.getServiceByName(serviceName);
      // Here we may not have the service info yet, e.g. if we did not ls '/'
      if (service && service.isLoggedIn) {
        this.authEnded(serviceName, resolve, reject);
      } else {
        // Open a blank window right away, before we know the URL, otherwise the browser blocks it
        const win = window.open();
        if (win) {
          const req = new XMLHttpRequest();
          req.open('POST', `${ROOT_URL}${serviceName}/authorize`);
          req.onload = () => {
            if (req.responseText) {
              win.location = req.responseText;
              win.addEventListener('unload', () => {
                win.onunload = null;
                this.startPollingAuthWin({
                  reject,
                  resolve,
                  serviceName,
                  win
                });
              });
            } else {
              this.authEnded(serviceName, resolve, reject);
              win.close();
            }
          };
          req.onerror = reject;
          req.ontimeout = () => reject(new Error('Auth request timed out'));
          req.send();
        } else {
          console.warn('Popup blocked by the browser, please authorise and try again');
        }
      }
    });
  }

  authEnded (service, resolve, reject) {
    this.ls([service])
    .then((res) => resolve(res))
    .catch((e) => reject(e));
  }

  startPollingAuthWin ({win, serviceName, resolve, reject}) {
    if (win.closed) {
      this.authEnded(serviceName, resolve, reject);
    } else {
      setTimeout(() => {
        this.startPollingAuthWin({
          reject,
          resolve,
          serviceName,
          win
        });
      }, POLLING_FREQUENCY);
    }
  }

  getJsonBody (oReq) {
    if (oReq.status === EMPTY_STATUS) {
      return null;
    }

    try {
      return JSON.parse(oReq.responseText);
    } catch (e) {
      return null;
    }
  }

  /* eslint max-params: ["off"]*/
  call (
    route, cbk, err,
    method = 'GET',
    body = '',
    progress = null,
    receiveBinary = false,
    sendBinary = false
  ) {
    const oReq = new XMLHttpRequest();
    oReq.onload = () => {
      if (OK_STATUSES.includes(oReq.status)) {
        const contentType = oReq.getResponseHeader('Content-Type');
        if (contentType && contentType.indexOf('json') >= 0) {
          const res = this.getJsonBody(oReq);
          if (res !== null) {
            cbk(res);
          }
        } else if (oReq.response === '') {
          cbk(null);
        } else if (oReq.response instanceof Blob) {
          cbk(oReq.response);
        } else {

          /*
           * Convert to blob if needed
           * this happens on heroku not locally
           */
          cbk(new Blob([oReq.response.toString()]));
        }
      } else {
        // Unifile should set the error object in the response body
        const e = this.getJsonBody(oReq) || {
          code: oReq.status,
          message: `${oReq.responseText} (${oReq.statusText})`,
        };
        err(e);
      }
    };
    oReq.onerror = (e) => {
      err(e);
    };
    const loadedValue = 100;
    if (progress !== null) {
      oReq.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentage = Math.round(e.loaded * loadedValue / e.total);
          progress(percentage);
        }
      };
      oReq.upload.onload = () => {
        progress(loadedValue);
      };
      oReq.upload.onerror = () => {
        progress(0);
      };
    }
    const url = `${ROOT_URL}${route}`;
    oReq.open(method, url);
    if (receiveBinary) {
      oReq.responseType = 'blob';
    }
    if (sendBinary) {
      const data = new FormData();
      if (Array.isArray(body)) {
        body.forEach((file) => data.append('content', file));
      } else {
        data.append('content', body);
      }
      oReq.send(data);
    } else {
      oReq.setRequestHeader('Content-Type', 'application/json');
      oReq.send(body);
    }
  }

  isService (file) {
    return typeof file.isService !== 'undefined';
  }
}
