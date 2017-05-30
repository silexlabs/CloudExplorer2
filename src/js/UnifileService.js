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
    return UnifileService.call(`${path[0]}/put/${path.slice(1).join('/')}`, 'PUT', JSON.stringify({content: data}));
  }
  read(path) {
    return UnifileService.call(`${path[0]}/get/${path.slice(1).join('/')}`, 'GET');
  }
  getPath(path) {
    return `${path.slice(1).join('/')}`;
  }
  getUrl(path) {
    return `${UnifileService.ROOT_URL}${path[0]}/get/${path.slice(1).join('/')}`;
  }
  getServices() {
    return UnifileService.call(`services`);
  }
  ls(path = null) {
    let pathToLs = path || this.currentPath;
    if(pathToLs.length > 0) {
      return UnifileService.call(`${pathToLs[0]}/ls/${pathToLs.slice(1).join('/')}`)
      .then((res) => {
        sessionStorage.setItem(this.getStorageKey(path), JSON.stringify(res));
        return res;
      });
    }
    else {
      return this.getServices()
      .then(res => {
        sessionStorage.setItem(this.getStorageKey(path), JSON.stringify(res));
        return res;
      });
    }
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
    const absPath = relative ? this.currentPath.concat(path) : path;
    return UnifileService.call(`${absPath[0]}/rm/${absPath.slice(1).join('/')}`, 'DELETE');
  }
  batch(path, actions){
    return UnifileService.call(`${path[0]}/batch/`, 'POST', JSON.stringify(actions))
  }
  mkdir(path, relative=false) {
    const absPath = relative ? this.currentPath.concat(path) : path;
    return UnifileService.call(`${absPath[0]}/mkdir/${absPath.slice(1).join('/')}`, 'PUT');
  }
  rename(name, newName) {
    const absPath = this.currentPath.concat([name]);
    const absNewPath = this.currentPath.slice(1).concat([newName]);
    return UnifileService.call(`${absPath[0]}/mv/${absPath.slice(1).join('/')}`,
      'PATCH',
      JSON.stringify({
        'destination': absNewPath.join('/'),
      })
    );
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
  static call(route, method = 'GET', body = '') {
    return new Promise((resolve, reject) => {
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
              reject(e);
              return;
            }
          }
          resolve(res);
        }
        else {
          console.info('error in the request response with status', oReq.status, e);
          reject(e);
        }
      };
      oReq.onerror = function(e) {
        console.info('error for the request', e);
        reject(e);
      };
      const url = `${UnifileService.ROOT_URL}${route}`;
      oReq.open(method, url);
      oReq.setRequestHeader('Content-Type', 'application/json');
      oReq.send(body);
    });
  }
  static isService(file) {
    return typeof(file.isLoggedIn) !== 'undefined';
  }
}
