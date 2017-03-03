import React from 'react';
import ReactDom from 'react-dom';

const STORAGE_KEY_LS_CACHE = 'CloudExplorer.lsCache';

export default class UnifileService {
  currentPath = [];
  rootUrl = null;
  constructor(rootUrl, services, path) {
    this.rootUrl = rootUrl;
    this.services = services;
    this.currentPath = path;
  }
  getStorageKey(path) {
    return `${STORAGE_KEY_LS_CACHE}('${path.join('/')}')`;
  }
  ls(path = null) {
    return new Promise((resolve, reject) => {
      let pathToLs = path || this.currentPath;
      if(pathToLs.length > 0) {
        this.call(`${pathToLs[0]}/ls/${pathToLs.slice(1).join('/')}`, (res) => {
          sessionStorage.setItem(this.getStorageKey(path), JSON.stringify(res));
          resolve(res);
        }, (e) => reject(e));
      }
      else {
        resolve(this.services);
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
      this.call(`${absPath[0]}/rm/${absPath.slice(1).join('/')}`, (res) => resolve(res), (e) => reject(e), 'DELETE');
    });
  }
  batch(path, actions){
    return new Promise((resolve, reject) => {
      this.call(`${path[0]}/batch/`, resolve, reject, 'POST', JSON.stringify(actions))
    });
  }
  mkdir(path, relative=false) {
    return new Promise((resolve, reject) => {
      const absPath = relative ? this.currentPath.concat(path) : path;
      this.call(`${absPath[0]}/mkdir/${absPath.slice(1).join('/')}`, (res) => resolve(res), (e) => reject(e), 'PUT');
    });
  }
  rename(name, newName) {
    return new Promise((resolve, reject) => {
      const absPath = this.currentPath.concat([name]);
      const absNewPath = this.currentPath.concat([newName]);
      this.call(
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
            console.log('success', service);
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
      xhr.open("PUT", `${this.rootUrl}${absPath[0]}/put/${absPath.slice(1).join('/')}`);
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
      let win = window.open(req.responseText);
      win.addEventListener('unload', () => {
        console.log('closed?', win.closed);
        win.onunload = null;
        this.startPollingAuthWin(win, service, resolve, reject);
      });
    });
  }
  startPollingAuthWin(win, service, resolve, reject) {
    console.log('closed?', win.closed);
    if(win.closed) {
      this.ls([service])
        .then(res => resolve(service))
        .catch(e => reject(e));
    }
    else setTimeout(() => {
      this.startPollingAuthWin(win, service, resolve, reject);
    }, 200);
  }
  getUrl(path) {
    return `${path[0]}/get/${path.slice(1).join('/')}`;
  }
  call(route, cbk, err, method = 'GET', body = '') {
    const oReq = new XMLHttpRequest();
    let isErr = false;
    oReq.onload = function(e) {
      if(!isErr) {
        try {
          cbk(JSON.parse(this.responseText));
        }
        catch(e) {
          console.error(e);
          err(e);
        }
      }
    };
    oReq.onerror = function(e) {
      console.error('ERROR', e);
      isErr = true;
      err(e);
    };
    const url = `${this.rootUrl}${route}`;
    oReq.open(method, url);
    oReq.setRequestHeader('Content-Type', 'application/json');
    oReq.send(body);
  }
}
