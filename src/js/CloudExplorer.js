import React from 'react';
import ReactDom from 'react-dom';
import ModalDialog from './ModalDialog';
import ButtonBar from './ButtonBar';
import ButtonConfirm from './ButtonConfirm';
import Files from './Files';
import FilesDropZone from './FilesDropZone';
import FilesUploader from './FilesUploader';
import Breadcrumbs from './Breadcrumbs';
import ServiceSelector from './ServiceSelector';
import UnifileService from './UnifileService';

/**
 * @class which binds the UI and the Unifile service all together
 */
export default class CloudExplorer extends React.Component {
  INITIAL_STATE = {
    selection: [],
    files: [],
    loading: false,
    uploadingFiles: [],
  };
  srv = new UnifileService('./', this.props.service, this.props.path)
  state = JSON.parse(JSON.stringify(this.INITIAL_STATE))
  ls(disableCache=false) {
    const hasCache = disableCache ? false : this.srv.lsHasCache(this.props.service, this.props.path);
    const cache = this.srv.lsGetCache(this.props.service, this.props.path);
    this.setState({
      selection: [],
      files: hasCache ? cache : this.state.files,
      loading: !hasCache,
    }, () => {
      const service = this.props.service;
      const path = this.props.path;
      this.srv.ls(service, path).then((files) => {
        // check that we did not CD during loading
        if(this.props.service === service && this.props.path === path) {
          this.setState({
            files: files,
            selection: [],
            loading: false,
          });
        }
      });
    });
  }
  download() {
    window.open(this.srv.getUrl(
      this.props.service,
      this.props.path.concat([this.state.selection[0].name]))
    );
  }
  delete() {
    let batch = this.state.selection.map(file => {
      return {name: 'unlink', path: this.props.path.concat([file.name]).join('/')}
    });
    return this.srv.batch(this.props.service, batch)
    .then(results => {
      this.ls();
    })
    .catch(e => console.error('ERROR:', e));
  }
  setService(service) {
    this.props.onService(service);
  }
  cd(path, relative = false) {
    this.props.onCd(
      relative ? this.props.path.concat(path) : path
    );
  }
  mkdir() {
    this.filesComponent.getNewDirName().then(name => {
      this.setState({
        selection: [],
        loading: true,
      }, () => {
        this.srv.mkdir(this.props.service, name, true).then(() => this.ls(true));
      });
    });
  }
  rename(name) {
    this.filesComponent.getNewName(name).then(newName => {
      if(newName !== name) {
        this.setState({
          selection: [],
          loading: true,
        }, () => {
          this.srv.rename(this.props.service, name, newName)
          .then(res => {
            this.ls();
          })
          .catch(e => console.error('ERROR:', e));
        });
      }
    });
  }
  cancel() {
    this.setState(
      JSON.parse(JSON.stringify(this.INITIAL_STATE)),
      () => this.props.onCancel()
    );
  }
  componentDidMount() {
    this.initInputProps(this.props);
  }
  componentWillReceiveProps(newProps) {
    // check if the new props are different from the state
    // this will be false when the parent component changes
    // the props because we called onService or onCd
    if(newProps.path.join('/') !== this.props.path.join('/') ||
      newProps.service !== this.props.service) {
      this.initInputProps(newProps);
    }
  }
  initInputProps(newProps) {
    this.setState({
      selection: [],
      loading: true,
    });
    this.srv.cd(newProps.path)
    .then(path => {
      this.ls();
    })
    .catch(e => console.error('ERROR:', e));
  }
  render() {
    return <div className={this.state.loading ? 'loading' : ''}>
      <div className="services panel">
        <h2>Services</h2>
        <ServiceSelector
          service={this.props.service}
          services={this.props.services}
          onChange={(selection) => this.setService(selection)}
        />
      </div>
      <div className="buttons panel">
        <h2>Buttons</h2>
        <ButtonBar
          service={this.props.service}
          selection={this.state.selection}
          onRename={() => this.rename(this.state.selection[0].name)}
          onCreateFolder={() => this.mkdir()}
          onReload={() => this.ls()}
          onDownload={() => this.download()}
          onDelete={() => this.delete()}
        />
        <ButtonConfirm
          service={this.props.service}
          selection={this.state.selection}
          path={this.props.path}
          pickFolder={this.props.pickFolder}
          onPick={() => this.props.onPick(this.state.selection)}
          onEnter={folder => this.cd([folder.name], true)}
          onUp={() => this.cd(this.props.path.slice(0, -1), false)}
          onCancel={() => this.cancel()}
        />
      </div>
      <div className="breadcrumbs panel">
        <h2>Breadcrumbs</h2>
        <Breadcrumbs
          service={this.props.service}
          path={this.props.path}
          onEnter={path => this.cd(path)}
        />
      </div>
      <div className="files panel">
        <h2>Files</h2>
        <Files
          ref={c => this.filesComponent = c}
          path={this.props.path}
          selection={this.state.selection}
          files={this.state.files}
          onChange={(selection) => this.setState({selection: selection})}
          onEnter={folder => this.cd([folder.name], true)}
          onPick={(file) => this.props.onPick(file)}
        />
      </div>
      <div className="upload">
        <FilesDropZone
          onDrop={files => this.setState({uploadingFiles: this.state.uploadingFiles.concat(files)})}
        />
        <FilesUploader
          files={this.state.uploadingFiles}
          upload={(file, onProgress, onSuccess, onError) => this.srv.upload(this.props.service, file, onProgress).then(onSuccess).catch(onError)}
        />
      </div>

      <div className="dialogs panel">
        <h2>Dialogs</h2>
        <ModalDialog />
      </div>
    </div>;
  }
}
