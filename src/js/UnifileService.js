import React from 'react';
import ReactDom from 'react-dom';

const STORAGE_KEY_LS_CACHE = 'CloudExplorer.lsCache';

export default class UnifileService {
  static ROOT_URL = window.location.origin + '/';
  currentPath = [];
  extensions = null;
  constructor(path) {
    this.currentPath = path;
  }
  setExtensions(extensions) {
    this.extensions = extensions;
  }
  getStorageKey(path) {
    return `${STORAGE_KEY_LS_CACHE}('${path.join('/')}')`;
  }
  write(data, path, progress = null) {
    return new Promise((resolve, reject) => {
      UnifileService.call(`${path[0]}/put/${path.slice(1).join('/')}`, res => resolve(res), e => reject(e), 'PUT', data, progress, false, true);
    });
  }
  read(path) {
    return new Promise((resolve, reject, progress = null) => {
      UnifileService.call(`${path[0]}/get/${path.slice(1).join('/')}`, res => resolve(res), e => reject(e), 'GET', '', progress, true);
    });
  }
  getPath(path) {
    return `${path.slice(1).join('/')}`;
  }
  getUrl(path) {
    return `${UnifileService.ROOT_URL}${path[0]}/get/${path.slice(1).join('/')}`;
  }
  getServices() {
    return new Promise((resolve, reject) => {
      UnifileService.call(`services`, resolve, (e) => reject(e));
    });
  }
  ls(path = null) {
    return new Promise((resolve, reject) => {
      let pathToLs = path || this.currentPath;
      if(pathToLs.length > 0) {
        const filters = this.extensions ? '?extensions=' + this.extensions.join(',') : '';
        UnifileService.call(`${pathToLs[0]}/ls/${pathToLs.slice(1).join('/')}${filters}`, (res) => {
          sessionStorage.setItem(this.getStorageKey(path), JSON.stringify(res));
          resolve(res);
        }, (e) => reject(e));
      }
      else {
        this.getServices().then(res => {
          sessionStorage.setItem(this.getStorageKey(path), JSON.stringify(res));
          resolve(res);
        });
      }
    });
  }
  lsHasCache(path = null) {
    return !!sessionStorage.getItem(this.getStorageKey(path));
  }
  lsGetCache(path = null) {
    try {
      const cached = sessionStorage.getItem(this.getStorageKey(path));
      if(cached) {
        return JSON.parse(cached);
      }
    }
    catch(e) {}
    return [];
  }
  rm(path, relative=false) {
    return new Promise((resolve, reject) => {
      const absPath = relative ? this.currentPath.concat(path) : path;
      UnifileService.call(`${absPath[0]}/rm/${absPath.slice(1).join('/')}`, (res) => resolve(res), (e) => reject(e), 'DELETE');
    });
  }
  batch(path, actions){
    return new Promise((resolve, reject) => {
      UnifileService.call(`${path[0]}/batch/`, resolve, reject, 'POST', JSON.stringify(actions))
    });
  }
  mkdir(path, relative=false) {
    return new Promise((resolve, reject) => {
      const absPath = relative ? this.currentPath.concat(path) : path;
      UnifileService.call(`${absPath[0]}/mkdir/${absPath.slice(1).join('/')}`, (res) => resolve(res), (e) => reject(e), 'PUT');
    });
  }
  rename(name, newName) {
    return new Promise((resolve, reject) => {
      const absPath = this.currentPath.concat([name]);
      const absNewPath = this.currentPath.slice(1).concat([newName]);
      UnifileService.call(
        `${absPath[0]}/mv/${absPath.slice(1).join('/')}`,
        (res) => resolve(res), (e) => reject(e),
        'PATCH',
        JSON.stringify({
          'destination': absNewPath.join('/'),
        })
      );
    });
  }
  cd(path) {
    return new Promise((resolve, reject) => {
      if(path.length === 1 && path[0] !== this.currentPath[0]) {
        this.auth(path[0])
          .then(service => {
            this.currentPath = path;
            resolve(this.currentPath);
          })
          .catch(e => {
            console.error('error when trying to authenticate', e);
            reject(e);
          });
      }
      else {
        this.currentPath = path;
        resolve(this.currentPath);
      }
    });
  }
  upload(file, progress = null) {
    return new Promise((resolve, reject) => {
      const absPath = this.currentPath.concat([file.name]);
      this.write(file, absPath).then(response => resolve(response)).catch(e => reject(e), progress);
    });
  }
  auth(service) {
    return new Promise((resolve, reject) => {
      let req = new XMLHttpRequest();
      req.open('POST', '/' + service + '/authorize', false);
      req.send();
      if(req.responseText) {
        let win = window.open(req.responseText);
        win.addEventListener('unload', () => {
          win.onunload = null;
          this.startPollingAuthWin(win, service, resolve, reject);
        });
      }
      else this.authEnded(service, resolve, reject);
    });
  }
  authEnded(service, resolve, reject) {
    this.ls([service])
      .then(res => resolve(service))
      .catch(e => reject(e));
  }
  startPollingAuthWin(win, service, resolve, reject) {
    if(win.closed) {
      this.authEnded(service, resolve, reject);
    }
    else setTimeout(() => {
      this.startPollingAuthWin(win, service, resolve, reject);
    }, 200);
  }
  static getJsonBody(oReq) {
    try {
      return JSON.parse(oReq.responseText);
    }
    catch(e) {
      console.error('an error occured while parsing JSON response', e);
      return null;
    }
  }
  static call(route, cbk, err, method = 'GET', body = '', progress = null, receiveBinary = false, sendBinary=false) {
    const oReq = new XMLHttpRequest();
    oReq.onload = function(event) {
      if(oReq.status === 200) {
        const contentType = oReq.getResponseHeader("Content-Type")
        if(contentType && contentType.indexOf('json') >= 0) {
          const res = UnifileService.getJsonBody(oReq);
          if(res != null) cbk(res);
        }
        else if(oReq.response != '') {
          if(oReq.response instanceof Blob) cbk(oReq.response);
          else {
            // convert to blob if needed
            // this happens on heroku not locally
            cbk(new Blob([oReq.response.toString()]));
          }
        }
        else {
          console.log('empty response body');
          cbk(null);
        }
      }
      else {
        // unifile should set the error object in the response body
        const e = UnifileService.getJsonBody(oReq);
        console.error('error in the request response with status', oReq.status, e);
        err(e);
      }
    };
    oReq.onerror = function(e) {
      error.info('error for the request', e);
      err(e);
    };
    if(progress != null) {
      const dispatcher = (() => {
        if(sendBinary) return oReq.upload;
        return oReq;
      });
      dispatcher.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percentage = Math.round((e.loaded * 100) / e.total);
          progress(percentage);
        }
      }, false);
      dispatcher.upload.addEventListener("load", (e) => {
        progress(100);
      }, false);
      dispatcher.upload.addEventListener("error", (e) => {
        progress(0);
        reject(e);
      }, false);
    }
    const url = `${UnifileService.ROOT_URL}${route}`;
    oReq.open(method, url);
    if(receiveBinary) oReq.responseType = "blob";
    if(sendBinary) {
      const data = new FormData();
      data.append('content', body);
      oReq.send(data);
    }
    else {
      oReq.setRequestHeader('Content-Type', 'application/json');
      oReq.send(body);
    }
  }
  static isService(file) {
    return typeof(file.isLoggedIn) != 'undefined';
  }
}
