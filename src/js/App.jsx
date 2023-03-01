import React from 'react';
import ReactDom from 'react-dom';

import BeakerService from './BeakerService';
import CloudExplorerView from './CloudExplorerView';
import * as ImageBankService from './ImageBankService';
import ImageBankView from './ImageBankView';
import Tabs from './Tabs';

const STORAGE_KEY_PATH = 'CloudExplorer.path';

// Titles
const TITLE_OPEN_FILE = 'Select a file';
const TITLE_OPEN_FILES = 'Select file(s)';
const TITLE_OPEN_FOLDER = 'Select a folder';
const TITLE_SAVE_AS = 'Save as...';

/**
 * Class in charge of the history and init of the main CloudExplorer component
 */
class App extends React.Component {
  static focusInput

  static focus () {
    if (!App.focusInput) {
      App.focusInput = document.createElement('input');

      // Hide the focus input and attach it to the DOM
      App.focusInput.style.left = '-1000px';
      App.focusInput.style.position = 'absolute';
      document.body.appendChild(App.focusInput);
    }

    /*
     * SetTimeout because we might need to wait for a click to finish bubbling
     * e.g. when edit text, the UI layer is hidden, click on the stage => focus on the stage iframe
     */
    setTimeout(() => {
      App.focusInput.focus();
      App.focusInput.blur();
      document.getSelection().removeAllRanges();
    }, 0);
  }

  createBlob (path, file) {
    if (file.url) {
      // Case of an absolute URL (probably an image bank?
      return {...file};
    }
    return {...file,
      folder: this.state.unifile.getPath(path),
      path: this.state.unifile.getPath(path.concat(file.name)),
      service: path[0],
      url: this.state.unifile.getUrl(path.concat(file.name))};

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
    // get the list of image banks
    this.getImageBanks().then((imageBanks) => {
      this.setState({imageBanks});
    });
    // start with the path in local storage
    const path = localStorage.getItem(STORAGE_KEY_PATH) ?? '[]';
    this.state.path = JSON.parse(path);
  }

  state = {
    unifile: new BeakerService([]),
    imageBanks: [],
    extensions: [],
    onCancel: null,
    onError: null,
    onPick: null,
    path: [],
    inputName: false,
    pickFolder: false,
    selection: [],
    thumbnailMode: false,
    title: '',
  }

  onChange (path) {
    if (path !== this.state.path) {
      // store the old path in case of error
      const oldPath = this.state.path;
      // apply the new path
      this.setState({
        path,
        selection: []
      }, () => {
        this.state.unifile.cd(path)
        .then(() => {
          this.cloudExplorer.ls()
        })
        .catch((e) => {
          this.state.onError(e);
          this.setState({ path: oldPath });
        });
      })
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
  onCloudExplorerReady (cloudExplorer) {
    this.cloudExplorer = cloudExplorer || this.cloudExplorer;
  }

  read (blob) {
    return this.state.unifile.read(this.constructor.fromBlobToPath(blob));
  }

  write (data, blob) {
    // Convert data to an Array of File
    const content = (Array.isArray(data) ? data : [data])
    .map((c) => {
      if (c.constructor === String) return new File([c], blob.path.split('/').pop(), {type: 'text/plain'});

      if (c instanceof File) return c;

      throw new Error('Invalid data. You must provide a String or a File');
    });
    return this.state.unifile.upload(this.constructor.fromBlobToPath(blob, true), content);
  }

  /*
   * //////////////////
   * API
   * //////////////////
   */
  thumbnailMode (show) {
    this.setState({thumbnailMode: show});
  }

  openFile (extensions = null) {
    return new Promise((resolve, reject) => {
      App.focus();
      this.setState({
        extensions,
        inputName: false,
        multiple: false,
        onCancel: () => resolve(null),
        onError: (e) => reject(e),
        onPick: (files) => resolve(this.createBlob(this.state.path, files[0])),
        onSave: null,
        pickFolder: false,
        selection: [],
        title: TITLE_OPEN_FILE,
      }, () => this.cloudExplorer.ls());
    });
  }

  openFiles (extensions = null) {
    return new Promise((resolve, reject) => {
      App.focus();
      this.setState({
        extensions,
        inputName: false,
        multiple: true,
        onCancel: () => resolve(null),
        onError: (e) => reject(e),
        onPick: (files) => resolve(files.map((file) => this.createBlob(this.state.path, file))),
        onSave: null,
        pickFolder: false,
        selection: [],
        title: TITLE_OPEN_FILES,
      }, () => this.cloudExplorer.ls());
    });
  }

  openFolder () {
    return new Promise((resolve, reject) => {
      App.focus();
      this.setState({
        extensions: [],
        inputName: false,
        multiple: false,
        onCancel: () => resolve(null),
        onError: (e) => reject(e),
        onPick: (files) => {
          if (files.length) {
            // Case of a selected folder in the current path
            resolve(this.createBlob(this.state.path, files[0]));
          } else if (this.state.path.length > 1) {
            // The user pressed "ok" to select the current folder
            const endOffset = -1;
            resolve(this.createBlob(this.state.path.slice(0, endOffset), {
              isDir: true,
              mime: 'application/octet-stream',
              name: this.state.path[this.state.path.length - 1]
            }));
          } else {
            // Same case but for the / folder (root)
            resolve(this.createBlob(this.state.path, {
              isDir: true,
              mime: 'application/octet-stream',
              name: ''
            }));
          }
        },
        onSave: null,
        pickFolder: true,
        selection: [],
        title: TITLE_OPEN_FOLDER,
      }, () => this.cloudExplorer.ls());
    });
  }

  saveAs (defaultFileName, extensions = null) {
    return new Promise((resolve, reject) => {
      App.focus();
      this.setState({
        defaultFileName,
        extensions,
        inputName: true,
        multiple: false,
        onCancel: () => resolve(null),
        onError: (e) => reject(e),
        onPick: null,
        onSave: (fileName) => resolve(this.createBlob(this.state.path, {name: fileName})),
        pickFolder: false,
        selection: [],
        title: TITLE_SAVE_AS,
      }, () => this.cloudExplorer.ls());
    });
  }

  reload (extensions) {
    this.setState({extensions}, () => this.cloudExplorer.ls());
    return Promise.resolve();
  }

  getImageBanks () {
    return ImageBankService.list();
  }

  getServices () {
    return this.state.unifile.getServices();
  }

  // The auth method has to be called on a click or keydown in order not to be blocked by the browser
  auth (serviceName) {
    return this.state.unifile.auth(serviceName);
  }

  getHideTabs () {
    return this.state.inputName || this.state.pickFolder || !this.state.extensions || !this.state.extensions.find((ext) => ext === '.jpg');
  }

  render () {
    // update extension filters (file ext)
    this.state.unifile.setExtensions(this.state.extensions);
    // render the UI
    return (
        <main>
            <h1>{ this.state.title }</h1>
            <Tabs
              hide={this.getHideTabs()}
              elements={[
            {name: 'user-files',
              displayName: 'Your images'}
          ].concat(this.state.imageBanks)}
        >
                {[
                    <CloudExplorerView
                      unifile={this.state.unifile}
                      key="CloudExplorerComponentKey"
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
                      thumbnailMode={this.state.thumbnailMode}
                      onThumbnailMode={(thumbnailMode) => this.setState({thumbnailMode})}
          />
        ]
          .concat(this.state.imageBanks.map((bank) => <ImageBankView
            unifile={this.state.unifile}
            key={bank.name}
            bankName={bank.name}
            selection={this.state.selection}
            onSelection={(selection) => this.onSelection(selection)}
            onCancel={() => (this.state.onCancel ? this.state.onCancel() : '')}
            onPick={(selection) => (this.state.onPick ? this.state.onPick(selection) : '')}
            onError={(e) => (this.state.onError ? this.state.onError(e) : '')}
          />))
        }
            </Tabs>
        </main>
    );
  }
}

ReactDom.render(
    <App />,
  document.getElementById('cloud-explorer')
);
