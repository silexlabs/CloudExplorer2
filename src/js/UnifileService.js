import React from 'react';
import ReactDom from 'react-dom';

export default class UnifileService {
  currentPath = [];
  rootUrl = null;
  constructor(rootUrl) {
    this.rootUrl = rootUrl;
  }
  ls(service, path = null) {
    return new Promise((resolve, reject) => {
      let pathToLs = path || this.currentPath;
      this.call(`ls.json?${service}/ls${pathToLs.join('/')}`, (res) => resolve(res), (e) => reject(e));
    });
  }
  cd(service, path, relative=false) {
    return new Promise((resolve, reject) => {
      if(relative) this.currentPath.push(path);
      else this.currentPath = path;
      resolve(this.currentPath);
    });
  }
  call(route, cbk, err) {
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
    console.log('GET', url);
    oReq.open('GET', url);
    oReq.send();
  }
}
