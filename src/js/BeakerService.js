import '@babel/polyfill';

import DefaultUnifileService from './UnifileService';

// e.g. hyper://23549cb9935...7408604ec6a817006f53251/
//const HYPERDRIVE_URL = window.HYPERDRIVE_URL
const HYPERDRIVE_URL = 'hyper://23549cb9935fd7794f06e7a720b57ca03fdc8d0da7408604ec6a817006f53251/'

export default class BeakerService extends DefaultUnifileService {
  getHyperdrivePath(path) {
    console.log('getHyperdrivePath', {path})
    return path.join('/')
  }
  getUrl (path) {
    return this.getHyperdrivePath(path);
  }

  getServices () {
    console.log('getServices')
    return [{
      displayName: 'hyperdrive',
      isDir: true,
      isService: true,
      mime: 'application/json',
      name: HYPERDRIVE_URL,
      isLoggedIn: true,
    }];
  }

  read (path) {
    return Promise.reject('TODO read');
  }

  async ls (path = null) {
    console.log('ls', path)
    if(path.length) {
      const files = await beaker
      .hyperdrive
      .readdir(this.getHyperdrivePath(path), {
        includeStats: true,
      });
      console.log({files})
      return files.map(file => ({
        name: file.name,
        isDir: file.stat.isDirectory(),
        bytes: file.stat.size,
        modified: file.stat.mtime.toLocaleString(),
      }))
    } else {
      return this.getServices();
    }
  }

  async mkdir (path, relative = false) {
    const absPath = relative ? this.currentPath.concat(path) : path;
    console.log('mkdir', absPath)
    return beaker
    .hyperdrive
    .mkdir(this.getHyperdrivePath(absPath));
  }

  rename (name, newName) {
    return Promise.reject('TODO rename');
  }

  async cd (path) {
    this.currentPath = path;
    return this.currentPath;
  }

  upload (path, files, progress = null) {
    return Promise.reject('TODO upload')
  }

  delete (path, files) {
    return Promise.reject('TODO delete')
  }
}
