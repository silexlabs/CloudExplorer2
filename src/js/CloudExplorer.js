import React from 'react';
import ReactDom from 'react-dom';
import ModalDialog from './ModalDialog';
import ButtonBar from './ButtonBar';
import ButtonConfirm from './ButtonConfirm';
import Files from './Files';
import KeyboardNav from './KeyboardNav';
import FilesDropZone from './FilesDropZone';
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
  unifile = new UnifileService(this.props.path)
  state = JSON.parse(JSON.stringify(this.INITIAL_STATE))
  ls(disableCache=false) {
    const hasCache = disableCache ? false : this.unifile.lsHasCache(this.props.path);
    const cache = this.unifile.lsGetCache(this.props.path);
    this.setState({
      selection: [],
      files: hasCache ? cache : this.state.files,
      loading: !hasCache,
    }, () => {
      const path = this.props.path;
      this.unifile.ls(path).then((files) => {
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
  download(file) {
    window.open(this.unifile.getUrl(
      this.props.path.concat([file.name]))
    );
  }
  delete(opt_file) {
    const files = opt_file ? [opt_file] : this.state.selection;
    let batch = files.map(file => {
      return {
        name: file.isDir ? 'rmdir' : 'unlink',
        path: this.unifile.getPath(this.props.path.concat([file.name])),
      }
    });
    return this.unifile.batch(this.props.path, batch)
    .then(results => {
      this.ls();
    })
    .catch(e => {
      console.error('ERROR:', e);
      if(this.props.onError) this.props.onError(e);
    });
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
        this.unifile.mkdir(name, true).then(() => this.ls(true));
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
          this.unifile.rename(name, newName)
          .then(res => {
            this.ls();
          })
          .catch(e => {
            console.error('ERROR:', e);
            if(this.props.onError) this.props.onError(e);
          });
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
    this.unifile.cd(newProps.path)
    .then(path => {
      this.ls();
    })
    .catch(e => {
      console.error('ERROR:', e);
      if(opt_oldProps && opt_oldProps.path) this.props.onCd(opt_oldProps.path);
      if(this.props.onError) this.props.onError(e);
    });
  }
  upload(files) {
    var i = 0;
    var uploads = files.map(file => {
      file.upload = {
        error: null,
        progress: 0
      };
      this.unifile.upload(file, progress => {
        console.log('progress', progress);
        file.upload.progress = progress;
        this.forceUpdate();
      })
      .then( () => {
        console.log('done uploading file', file);
        file.upload.progress = 1;
        var deleted = file;
        this.setState({uploadingFiles: this.state.uploadingFiles.filter(file=>{file != deleted;})});
        this.ls();
      })
      .catch( e => {
        console.log('error uploading file', e);
        file.upload.error = e;
        this.forceUpdate();
      });
      i++;
      return file;
    });

    this.setState({uploadingFiles: this.state.uploadingFiles.concat(uploads)});

  }
  render() {
    return <div className={"root " + (this.state.loading ? 'loading' : '')}>
      <div className="buttons panel">
        <h2>Buttons</h2>
        <ButtonBar
          selection={this.state.selection}
          path={this.props.path}
          onCreateFolder={() => this.mkdir()}
          onReload={() => this.ls()}
        />
        <ButtonConfirm
          selection={this.state.selection}
          path={this.props.path}
          pickFolder={this.props.pickFolder}
          inputName={this.props.inputName}
          defaultFileName={this.props.defaultFileName}
          onSave={fileName => this.props.onSave(fileName)}
          onPick={(file) => this.props.onPick(file)}
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
        <Files
          ref={c => this.filesComponent = c}
          path={this.props.path}
          selection={this.state.selection}
          files={this.state.files.concat(this.state.uploadingFiles)}
          multiple={this.props.multiple}
          onDownload={file => this.download(file)}
          onDelete={file => this.delete(file)}
          onRename={file => this.rename(file.name)}
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
          onCancel={() => {
            if(this.dialog.isOpened()) {
              this.dialog.cancel();
            }
            else if (this.filesComponent.isInputMode()) {
              this.filesComponent.cancelInputMode();
            }
            else {
              this.cancel();
            }
          }}
        />
      </div>
      <div className="upload panel">
        <FilesDropZone
          onDrop={files => this.upload(files)}
        />
      </div>

      <div className="dialogs panel">
        <h2>Dialogs</h2>
        <ModalDialog
          ref={c => this.dialog = c}
        />
      </div>
    </div>;
  }
}
