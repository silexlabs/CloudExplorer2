import '@babel/polyfill';

import UnifileService from './UnifileService';

function getCurrentDriveFromUrl() {
  return window.location.search
    .substr(1)
    .split('&')
    .map(str => str.split('='))
    .filter(([key, value]) => key === 'currentDrive')
    .map(([key, value]) => value)[0]
}

export default class extends UnifileService {
  isBeaker = typeof beaker !== 'undefined';
  currentDrive = window.location.protocol === 'hyper:' ?
    window.location.hostname : getCurrentDriveFromUrl();
  checkBeakerMissing (path) {
    if (!this.isBeaker &&
      path.length &&
      path[0] === 'hyperdrive')
      throw new Error('You need Beaker browser to browse hyperdrives');
  }
  async getHyperdrivePath (path) {
    if (!this.currentDrive) this.currentDrive = (await beaker.shell.selectDriveDialog({
      title: 'Select Your Website',
      buttonLabel: 'Select',
      writable: true,
    })).split('/')[2];
    return 'hyper://' + this.currentDrive + '/' + path.slice(1).join('/');
  }
  getUrl (path) {
    return 'hyper://' + this.currentDrive + '/' + path.slice(1).join('/');
  }

  async read (path) {
    this.checkBeakerMissing(path)
    if (!this.isBeaker) return super.read(path);

    return beaker
      .hyperdrive
      .readFile(await this.getHyperdrivePath(path), 'binary');
  }

  async ls (path = null) {
    this.checkBeakerMissing(path)
    if (!this.isBeaker) return super.ls(path)

    if(path.length) {
      const files = await beaker
      .hyperdrive
      .readdir(await this.getHyperdrivePath(path), {
        includeStats: true,
      });
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
    this.checkBeakerMissing(path)
    if (!this.isBeaker) return super.mkdir(path, relative)

    const absPath = relative ? this.currentPath.concat(path) : path;
    return beaker
    .hyperdrive
    .mkdir(await this.getHyperdrivePath(absPath));
  }

  async rename (name, newName) {
    this.checkBeakerMissing(this.currentPath)
    if (!this.isBeaker) return super.rename(name, newName)

    return beaker
    .hyperdrive
    .rename(
      await this.getHyperdrivePath(this.currentPath.concat(name)),
      await this.getHyperdrivePath(this.currentPath.concat(newName))
    );
  }

  async cd (path) {
    this.checkBeakerMissing(path)
    if (!this.isBeaker) return super.cd(path)

    this.currentPath = path;
    return this.currentPath;
  }

  async upload (path, files, progress = null) {
    this.checkBeakerMissing(path)
    if (!this.isBeaker) return super.upload(path, files, progress);

    return Promise.all(files.map(async file => beaker
      .hyperdrive
      .writeFile(await this.getHyperdrivePath(path.concat(file.name)), await file.arrayBuffer())
    ));
  }

  async delete (path, files) {
    this.checkBeakerMissing(path)
    if (!this.isBeaker) return super.delete(path, files);

    return Promise.all(files.map(async file => file.name === 'rmdir' ? beaker
        .hyperdrive
        .rmdir(await this.getHyperdrivePath(['hyperdrive'].concat(file.path.split('/'))))
      : beaker
        .hyperdrive
        .unlink(await this.getHyperdrivePath(['hyperdrive'].concat(file.path.split('/'))))
    ))
  }
}
