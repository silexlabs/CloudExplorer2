import React from 'react';
import ReactDom from 'react-dom';

const STORAGE_KEY_LS_CACHE = 'CloudExplorer.lsCache';

export default class UnifileService {
  currentPath = [];
  rootUrl = null;
  constructor(rootUrl) {
    this.rootUrl = rootUrl;
  }
  getStorageKey(service, path) {
    return `${STORAGE_KEY_LS_CACHE}('${service}', '${path.join('/')}')`;
  }
  ls(service, path = null) {
    return new Promise((resolve, reject) => {
      let pathToLs = path || this.currentPath;
      this.call(`${service}/ls/${pathToLs.join('/')}`, (res) => {
        sessionStorage.setItem(this.getStorageKey(service, path), JSON.stringify(res));
        resolve(res);
      }, (e) => reject(e));
    });
  }
  lsHasCache(service, path = null) {
    return !!sessionStorage.getItem(this.getStorageKey(service, path));
  }
  lsGetCache(service, path = null) {
    try {
      const cached = sessionStorage.getItem(this.getStorageKey(service, path));
      if(cached) {
        return JSON.parse(cached);
      }
    }
    catch(e) {}
    return [];
  }
  rm(service, path, relative=false) {
    return new Promise((resolve, reject) => {
      const absPath = relative ? this.currentPath.concat(path) : path;
      this.call(`${service}/rm/${absPath.join('/')}`, (res) => resolve(res), (e) => reject(e), 'DELETE');
    });
  }
  mkdir(service, path, relative=false) {
    return new Promise((resolve, reject) => {
      const absPath = relative ? this.currentPath.concat(path) : path;
      this.call(`${service}/mkdir/${absPath.join('/')}`, (res) => resolve(res), (e) => reject(e), 'PUT');
    });
  }
  rename(service, name, newName) {
    return new Promise((resolve, reject) => {
      const absPath = this.currentPath.concat([name]);
      const absNewPath = this.currentPath.concat([newName]);
      this.call(
        `${service}/mv/${absPath.join('/')}`,
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
      this.currentPath = path;
      resolve(this.currentPath);
    });
  }
  upload(service, file, onProgress) {
      console.log('aaa', this.currentPath)
    return new Promise((resolve, reject) => {
      const absPath = this.currentPath.concat([file.name]);
      const reader = new FileReader();
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percentage = Math.round((e.loaded * 100) / e.total);
          onProgress(percentage);
        }
      }, false);
      xhr.upload.addEventListener("load", (e) =>{
        onProgress(100);
        resolve();
      }, false);
      xhr.upload.addEventListener("error", (e) =>{
        onProgress(0);
        reject(e);
      }, false);
      xhr.open("PUT", `${this.rootUrl}${service}/put/${absPath.join('/')}`);
      xhr.setRequestHeader('Content-Type', 'application/octet-stream');
      reader.onload = (evt) => {
        xhr.send(evt.target.result);
      };
      reader.readAsBinaryString(file);
    });
  }
  getUrl(service, path) {
    return `${service}/get/${path.join('/')}`;
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
