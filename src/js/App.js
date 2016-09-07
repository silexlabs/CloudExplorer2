import React from 'react';
import ReactDom from 'react-dom';
import CloudExplorer from './CloudExplorer';

// TODO Call a list route of the server
const SERVICES = ['FTP', 'Dropbox', 'GitHub', 'RemoteStorage'];
const STORAGE_KEY_PATH = 'CloudExplorer.path';

/**
 * @class in charge of the history and init of the main CloudExplorer component
 */
class App extends React.Component {
  hash = null
  state = {
    path: [],
    pickFolder: false,
    onCancel: null,
    onPick: null,
    onError: null,
  }
  loadHistory() {
    const path = localStorage.getItem(STORAGE_KEY_PATH);
    if(path && path !== this.state.path) {
      this.setState({
        path: JSON.parse(path),
      });
    }
  }
  onChange(path) {
    if(path !== this.state.path) {
      this.setState({
        path: path,
      });
    }
    localStorage.setItem(STORAGE_KEY_PATH, JSON.stringify(path));
  }
  componentWillMount() {
    this.loadHistory();
  }
  ////////////////////
  // API
  ////////////////////
  constructor() {
    super();
    window.ce = this;
  }
  openFile() {
    return new Promise((resolve, reject) => {
      this.setState({
        pickFolder: false,
        multiple: false,
        inputName: false,
        onCancel: () => resolve(null),
        onPick: files => resolve(files[0]),
        onSave: null,
        onError: e => reject(e),
      });
    });
  }
  openFiles() {
    return new Promise((resolve, reject) => {
      this.setState({
        pickFolder: false,
        multiple: true,
        inputName: false,
        onCancel: () => resolve(null),
        onPick: files => resolve(files),
        onSave: null,
        onError: e => reject(e),
      });
    });
  }
  openFolder() {
    return new Promise((resolve, reject) => {
      this.setState({
        pickFolder: true,
        multiple: false,
        inputName: false,
        onCancel: () => resolve(null),
        onPick: files => resolve(files[0]),
        onSave: null,
        onError: e => reject(e),
      });
    });
  }
  saveFile(data) {
    return new Promise((resolve, reject) => {
      console.info('TODO: only if a selection, use UnifileService.write');
    });
  }
  saveAsFile(defaultFileName) {
    return new Promise((resolve, reject) => {
      this.setState({
        pickFolder: false,
        multiple: false,
        inputName: true,
        defaultFileName: defaultFileName,
        onCancel: () => resolve(null),
        onPick: null,
        onSave: fileName => resolve(fileName),
        onError: e => reject(e),
      });
    });
  }
  render() {
    return <CloudExplorer
      services={SERVICES.map(service => {
        return {
          name: service,
          mime: 'application/json',
          isDir: true,
        }
      })}
      path={this.state.path}
      onCancel={() => this.state.onCancel ? this.state.onCancel() : ''}
      onError={(e) => this.state.onError ? this.state.onError(e) : ''}
      onSave={fileName => this.state.onSave ? this.state.onSave(fileName) : ''}
      onPick={selection => this.state.onPick ? this.state.onPick(selection) : ''}
      onCd={path => this.onChange(path)}
      pickFolder={this.state.pickFolder}
      multiple={this.state.multiple}
      inputName={this.state.inputName}
      defaultFileName={this.state.defaultFileName}
    />;
  }
}

ReactDom.render(
  <App />,
  document.getElementById('cloud-explorer')
);
