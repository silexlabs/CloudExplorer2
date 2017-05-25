import React from 'react';
import ReactDom from 'react-dom';

const STORAGE_KEY_LS_CACHE = 'CloudExplorer.lsCache';

export default class UnifileService {
  static ROOT_URL = window.location.origin + '/';
  currentPath = [];
  constructor(path) {
    this.currentPath = path;
  }
  getStorageKey(path) {
    return `${STORAGE_KEY_LS_CACHE}('${path.join('/')}')`;
  }
  write(data, path) {
    return new Promise((resolve, reject) => {
      UnifileService.call(`${path[0]}/put/${path.slice(1).join('/')}`, (res) => resolve(res), (e) => reject(e), 'PUT', JSON.stringify({content: data}));
    });
  }
  read(path) {
    return new Promise((resolve, reject) => {
      UnifileService.call(`${path[0]}/get/${path.slice(1).join('/')}`, (res) => resolve(res), (e) => reject(e), 'GET');
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
        UnifileService.call(`${pathToLs[0]}/ls/${pathToLs.slice(1).join('/')}`, (res) => {
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
            console.log('success', path, service);
            this.currentPath = path;
            resolve(this.currentPath);
          })
          .catch(e => {
            console.log('error', e);
            reject(e);
          });
      }
      else {
        this.currentPath = path;
        resolve(this.currentPath);
      }
    });
  }
  upload(file, onProgress) {
    return new Promise((resolve, reject) => {
      const absPath = this.currentPath.concat([file.name]);
      const formData = new FormData();
      const fileReader = new FileReader();
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (e) => {
        console.log('progress');
        if (e.lengthComputable) {
          const percentage = Math.round((e.loaded * 100) / e.total);
          onProgress(percentage);
        }
      }, false);
      xhr.upload.addEventListener("load", (e) => {
        console.log('load');
        onProgress(100);
      }, false);
      xhr.upload.addEventListener("error", (e) => {
        console.log('error');
        onProgress(0);
        reject(e);
      }, false);

      xhr.addEventListener('readystatechange',(e) => {
        // FIXME handle error cases
        if(xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200){
          resolve();
        }
      });
      xhr.open("PUT", `${UnifileService.ROOT_URL}${absPath[0]}/put/${absPath.slice(1).join('/')}`);
      xhr.setRequestHeader('X-Requested-With','XMLHttpRequest');
      fileReader.onload = (evt) => {
        formData.append("uploads", evt.target.result);
        xhr.send(formData);
      };
      fileReader.readAsBinaryString(file);
    });
  }
  auth(service) {
    return new Promise((resolve, reject) => {
      let req = new XMLHttpRequest();
      req.open('POST', '/' + service + '/authorize', false);
      req.send();
      if(req.responseText) {
        console.log('auth returned', req.responseText);
        let win = window.open(req.responseText);
        win.addEventListener('unload', () => {
          console.log('closed?', win.closed);
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
    console.log('closed?', win.closed);
    if(win.closed) {
      this.authEnded(service, resolve, reject);
    }
    else setTimeout(() => {
      this.startPollingAuthWin(win, service, resolve, reject);
    }, 200);
  }
  static call(route, cbk, err, method = 'GET', body = '') {
    const oReq = new XMLHttpRequest();
    oReq.onload = function(e) {
      if(oReq.status === 200) {
        let res = this.responseText;
        const contentType = oReq.getResponseHeader("Content-Type")
        if(contentType && contentType.indexOf('json') >= 0) {
          try {
            res = JSON.parse(this.responseText);
          }
          catch(e) {
            console.info('an error occured while parsing JSON response', e);
            err(e);
            return;
          }
        }
        cbk(res);
      }
      else {
        console.info('error in the request response with status', oReq.status, e);
        err(e);
      }
    };
    oReq.onerror = function(e) {
      console.info('error for the request', e);
      err(e);
    };
    const url = `${UnifileService.ROOT_URL}${route}`;
    oReq.open(method, url);
    oReq.setRequestHeader('Content-Type', 'application/json');
    oReq.send(body);
  }
  static isService(file) {
    return typeof(file.isLoggedIn) != 'undefined';
  }
}
