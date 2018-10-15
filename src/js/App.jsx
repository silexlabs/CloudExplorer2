import CloudExplorer from './CloudExplorer';
import React from 'react';
import ReactDom from 'react-dom';
import UnifileService from './UnifileService';

const STORAGE_KEY_PATH = 'CloudExplorer.path';

/**
 * Class in charge of the history and init of the main CloudExplorer component
 */
class App extends React.Component {

  static createBlob (path, file) {
    return Object.assign({}, file, {
      folder: UnifileService.getPath(path),
      path: UnifileService.getPath(path.concat(file.name)),
      service: path[0],
      url: UnifileService.getUrl(path.concat(file.name))
    });
  }

  static fromBlobToPath (blob, folderPath = false) {
    const path = folderPath ? blob.folder : blob.path;
    return [
      blob.service,
      ...path.split('/').filter((file) => file !== '')
    ];
  }

  constructor () {
    super();
    window.ce = this;
  }

  state = {
    extensions: [],
    onCancel: null,
    onError: null,
    onPick: null,
    path: [],
    pickFolder: false,
    selection: []
  }

  componentWillMount () {
    this.loadHistory();
  }

  onChange (path) {
    if (path !== this.state.path) {
      this.setState({
        path,
        selection: []
      });
    }
    localStorage.setItem(STORAGE_KEY_PATH, JSON.stringify(path));
  }

  onSelection (selection) {
    this.setState({
      defaultFileName: selection.length && !selection[0].isDir
        ? selection[0].name
        : this.state.defaultFileName,
      selection
    });
  }

  /*
   * //////////////////
   * Class methods
   * //////////////////
   */
  hash = null;

  loadHistory () {
    const path = localStorage.getItem(STORAGE_KEY_PATH);
    if (path && path !== this.state.path) this.setState({path: JSON.parse(path)});
  }

  onCloudExplorerReady (cloudExplorer) {
    this.cloudExplorer = cloudExplorer || this.cloudExplorer;
  }

  read (blob) {
    return this.cloudExplorer.unifile.read(this.constructor.fromBlobToPath(blob));
  }

  write (data, blob) {
    // Convert data to an Array of File
    const content = (Array.isArray(data) ? data : [data])
    .map((c) => {
      if (c.constructor === String) return new File([c], blob.path.split('/').pop(), {type: 'text/plain'});

      if (c instanceof File) return c;

      throw new Error('Invalid data. You must provide a String or a File');
    });
    return this.cloudExplorer.unifile.upload(this.constructor.fromBlobToPath(blob, true), content);
  }

  /*
   * //////////////////
   * API
   * //////////////////
   */
  openFile (extensions = null) {
    return new Promise((resolve, reject) => {
      this.setState({
        extensions,
        inputName: false,
        multiple: false,
        onCancel: () => resolve(null),
        onError: (e) => reject(e),
        onPick: (files) => resolve(this.constructor.createBlob(this.state.path, files[0])),
        onSave: null,
        pickFolder: false,
        selection: []
      }, () => this.cloudExplorer.ls());
    });
  }

  openFiles (extensions = null) {
    return new Promise((resolve, reject) => {
      this.setState({
        extensions,
        inputName: false,
        multiple: true,
        onCancel: () => resolve(null),
        onError: (e) => reject(e),
        onPick: (files) => resolve(files.map((file) => this.constructor.createBlob(this.state.path, file))),
        onSave: null,
        pickFolder: false,
        selection: []
      }, () => this.cloudExplorer.ls());
    });
  }

  openFolder () {
    return new Promise((resolve, reject) => {
      this.setState({
        extensions: [],
        inputName: false,
        multiple: false,
        onCancel: () => resolve(null),
        onError: (e) => reject(e),
        onPick: (files) => {
          if (files.length) {
            // Case of a selected folder in the current path
            resolve(this.constructor.createBlob(this.state.path, files[0]));
          } else if (this.state.path.length > 1) {
            // The user pressed "ok" to select the current folder
            const endOffset = -1;
            resolve(this.constructor.createBlob(this.state.path.slice(0, endOffset), {
              isDir: true,
              mime: 'application/octet-stream',
              name: this.state.path[this.state.path.length - 1]
            }));
          } else {
            // Same case but for the / folder (root)
            resolve(this.constructor.createBlob(this.state.path, {
              isDir: true,
              mime: 'application/octet-stream',
              name: ''
            }));
          }
        },
        onSave: null,
        pickFolder: true,
        selection: []
      }, () => this.cloudExplorer.ls());
    });
  }

  saveAs (defaultFileName, extensions = null) {
    return new Promise((resolve, reject) => {
      this.setState({
        defaultFileName,
        extensions,
        inputName: true,
        multiple: false,
        onCancel: () => resolve(null),
        onError: (e) => reject(e),
        onPick: null,
        onSave: (fileName) => resolve(this.constructor.createBlob(this.state.path, {name: fileName})),
        pickFolder: false,
        selection: []
      }, () => this.cloudExplorer.ls());
    });
  }

  reload (extensions) {
    this.setState({extensions}, () => this.cloudExplorer.ls());
    return Promise.resolve();
  }

  getServices () {
    return UnifileService.getServices();
  }

  // The auth method has to be called on a click or keydown in order not to be blocked by the browser
  auth (serviceName) {
    return this.cloudExplorer.unifile.auth(serviceName);
  }

  render () {
    return (
      <CloudExplorer
        defaultFileName={this.state.defaultFileName}
        extensions={this.state.extensions}
        inputName={this.state.inputName}
        multiple={this.state.multiple}
        onCancel={() => (this.state.onCancel ? this.state.onCancel() : '')}
        onCd={(path) => this.onChange(path)}
        onError={(e) => (this.state.onError ? this.state.onError(e) : '')}
        onPick={(selection) => (this.state.onPick ? this.state.onPick(selection) : '')}
        onSave={(fileName) => (this.state.onSave ? this.state.onSave(fileName) : '')}
        onSelection={(selection) => this.onSelection(selection)}
        path={this.state.path}
        pickFolder={this.state.pickFolder}
        ref={(c) => this.onCloudExplorerReady(c)}
        selection={this.state.selection}
      />
    );
  }
}

ReactDom.render(
  <App />,
  document.getElementById('cloud-explorer')
);
