import React from 'react';
import ReactDom from 'react-dom';
import ModalDialog from './ModalDialog';
import ButtonBar from './ButtonBar';
import ButtonConfirm from './ButtonConfirm';
import Files from './Files';
import KeyboardNav from './KeyboardNav';
import FilesDropZone from './FilesDropZone';
import FilesUploader from './FilesUploader';
import Breadcrumbs from './Breadcrumbs';
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
  srv = new UnifileService('./', this.props.services, this.props.path)
  state = JSON.parse(JSON.stringify(this.INITIAL_STATE))
  ls(disableCache=false) {
    const hasCache = disableCache ? false : this.srv.lsHasCache(this.props.path);
    const cache = this.srv.lsGetCache(this.props.path);
    this.setState({
      selection: [],
      files: hasCache ? cache : this.state.files,
      loading: !hasCache,
    }, () => {
      const path = this.props.path;
      this.srv.ls(path).then((files) => {
        // check that we did not CD during loading
        if(this.props.path === path) {
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
      this.props.path.concat([this.state.selection[0].name]))
    );
  }
  delete() {
    let batch = this.state.selection.map(file => {
      return {name: 'unlink', path: this.props.path.concat([file.name]).join('/')}
    });
    return this.srv.batch(this.props.path, batch)
    .then(results => {
      this.ls();
    })
    .catch(e => console.error('ERROR:', e));
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
        this.srv.mkdir(name, true).then(() => this.ls(true));
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
          this.srv.rename(name, newName)
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
    // the props because we called onCd
    if(newProps.path.join('/') !== this.props.path.join('/')) {
      this.initInputProps(newProps, this.props);
    }
  }
  initInputProps(newProps, opt_oldProps) {
    this.setState({
      selection: [],
      loading: true,
    });
    this.srv.cd(newProps.path)
    .then(path => {
      this.ls();
    })
    .catch(e => {
      console.error('ERROR:', e);
      if(opt_oldProps && opt_oldProps.path) this.props.onCd(opt_oldProps.path);
    });
  }
  render() {
    return <div className={this.state.loading ? 'loading' : ''}>
      <div className="services panel">
        <h2>Services</h2>
      </div>
      <div className="buttons panel">
        <h2>Buttons</h2>
        <ButtonBar
          selection={this.state.selection}
          path={this.props.path}
          onRename={() => this.rename(this.state.selection[0].name)}
          onCreateFolder={() => this.mkdir()}
          onReload={() => this.ls()}
          onDownload={() => this.download()}
          onDelete={() => this.delete()}
        />
        <ButtonConfirm
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
          path={this.props.path}
          onEnter={path => this.cd(path)}
        />
      </div>
      <div className="files panel">
        <h2>Files</h2>
        <Files
          ref={c => this.filesComponent = c}
          path={this.props.path}
          services={this.props.services}
          selection={this.state.selection}
          files={this.state.files}
          onChange={(selection) => this.setState({selection: selection})}
          onEnter={folder => this.cd([folder.name], true)}
          onPick={(file) => this.props.onPick(file)}
        />
        <KeyboardNav
          selection={this.state.selection}
          files={this.state.files}
          onChange={(selection) => this.setState({selection: selection})}
          onEnter={folder => this.cd([folder.name], true)}
          onPick={(file) => this.props.onPick(file)}
          onCancel={() => this.cancel()}
        />
      </div>
      <div className="upload">
        <FilesDropZone
          onDrop={files => this.setState({uploadingFiles: this.state.uploadingFiles.concat(files)})}
        />
        <FilesUploader
          files={this.state.uploadingFiles}
          upload={(file, onProgress, onSuccess, onError) => this.srv.upload(file, onProgress)
            .then(() => {
              onSuccess();
              this.ls();
            })
            .catch(onError)}
        />
      </div>

      <div className="dialogs panel">
        <h2>Dialogs</h2>
        <ModalDialog />
      </div>
    </div>;
  }
}
