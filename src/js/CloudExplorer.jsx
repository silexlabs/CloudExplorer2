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
  // initial state for the react component
  INITIAL_STATE = {
    files: [],
    loading: false,
    cached: false, // flag the current folder is was cached
    uploadingFiles: [],
  };
  // class attributes
  unifile = new UnifileService(this.props.path);
  state = JSON.parse(JSON.stringify(this.INITIAL_STATE));

  ///////////////////////////////////////////
  // Utils methods
  ///////////////////////////////////////////

  // handle unifile errors
  // if message is not provided, it will display e.message
  // message can be a react template or a string
  onUnifileError(err={}, message=null) {
    // make sure that e is not null,
    // this happens when unifile returns a null error (empty body)
    const e = err || {};
    console.error('Error from unifile', e);

    // take action depending on the error code
    switch(e.code) {
      case 'EACCES':
        // go back to /
        this.cd([]);
        // do not display an error message
        return;
    }

    // display a modal with an error message
    const finalMessage = message || e.message || 'Unknown error';
    ModalDialog.getInstance().alert(<section>
      <h2>An error occured</h2>
      <p>This operation failed with the following error message:</p><p><strong>{ finalMessage }</strong></p>
      </section>);
  }

  ///////////////////////////////////////////
  // Cloud Explorer internal API used by the App class
  ///////////////////////////////////////////

  ls(disableCache=false) {
    const hasCache = disableCache ? false : this.unifile.lsHasCache(this.props.path);
    const cache = this.unifile.lsGetCache(this.props.path);
    this.setState({
      files: hasCache ? cache : this.state.files,
      loading: true,
      cached: hasCache,
    }, () => {
      const path = this.props.path;
      this.unifile.ls(path).then((files) => {
        // check that we did not CD during loading
        if(this.props.path === path) {
          this.setState({
            files: files,
            loading: false,
            cached: false,
          });
        }
      })
      .catch(e => this.onUnifileError(e));
    });
  }
  delete(opt_file) {
    const files = opt_file ? [opt_file] : this.props.selection;
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
    .catch(e => this.onUnifileError(e));
  }
  cd(path, relative = false) {
    this.props.onCd(
      relative ? this.props.path.concat(path) : path
    );
  }
  mkdir() {
    this.props.onSelection([]);
    this.filesComponent.getNewDirName().then(name => {
      this.setState({
        loading: true,
      }, () => {
        this.unifile.mkdir(name, true)
        .then(() => this.ls(true))
        .catch(e => this.onUnifileError(e));
      });
    });
  }
  rename(name) {
    this.props.onSelection([]);
    this.filesComponent.getNewName(name).then(newName => {
      if(newName !== name) {
        this.setState({
          loading: true,
        }, () => {
          this.unifile.rename(name, newName)
          .then(res => {
            this.ls();
          })
    .catch(e => this.onUnifileError(e));
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
  removeFromUploadingFiles(file) {
    this.setState({uploadingFiles: this.state.uploadingFiles.filter(f=>f.upload.id != file.upload.id)});
  }
  upload(files) {
    const uploadedFilesWithError = [];
    const uploads = files.map(file => {
      file.upload = {
        error: null,
        progress: 0,
        path: this.props.path,
        id: '_' + Math.random().toString() + Date.now().toString(),
      };
      this.unifile.upload(file, progress => {
        console.log('progress', progress);
        file.upload.progress = progress;
        this.forceUpdate();
      })
      .then( () => {
        console.log('done uploading file', file);
        file.upload.progress = 1;
        this.removeFromUploadingFiles(file);
        this.ls();
      })
      .catch(e => {
        console.log('error uploading file', e);
        file.upload.error = e;
        this.forceUpdate();
        uploadedFilesWithError.push(file);
        const fileNamesInError = <ul>{ uploadedFilesWithError.map(file => <li>- {file.name}</li>) }</ul>;
        this.onUnifileError(null, <div><p>I did not manage to upload the files:</p>{fileNamesInError}<p>{ e ? e.message || e.code : '' }</p></div>);
        this.removeFromUploadingFiles(file);
      });
      return file;
    });

    this.setState({uploadingFiles: this.state.uploadingFiles.concat(uploads)});

  }

  ///////////////////////////////////////////
  // React component's methods
  ///////////////////////////////////////////

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
    this.unifile.setExtensions(newProps.extensions);
  }
  initInputProps(newProps, opt_oldProps) {
    this.setState({
      loading: true,
    });
    this.unifile.cd(newProps.path)
    .then(path => {
      this.ls();
    })
    .catch(e => {
      if(opt_oldProps && opt_oldProps.path) this.props.onCd(opt_oldProps.path);
      this.onUnifileError(e);
    });
  }

  render() {
    return <div className={"root" + (this.state.loading ? ' loading' : '') + (this.state.cached ? ' cached' : '')}>
      <div className="panel top-button-bar">
        <h2>Buttons</h2>
        <ButtonBar
          selection={this.props.selection}
          path={this.props.path}
          onCreateFolder={() => this.mkdir()}
          onReload={() => this.ls()}
        />
        <ButtonConfirm
          selection={this.props.selection}
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
          selection={this.props.selection}
          files={this.state.files.concat(this.state.uploadingFiles)}
          multiple={this.props.multiple}
          getDownloadUrl={file => this.unifile.getUrl(this.props.path.concat([file.name]))}
          onDelete={file => this.delete(file)}
          onRename={file => this.rename(file.name)}
          onChange={(selection) => this.props.onSelection(selection)}
          onEnter={folder => this.cd([folder.name], true)}
          onPick={(file) => this.props.onPick(file)}
        />
        <KeyboardNav
          focusElement={this.filesComponent}
          selection={this.props.selection}
          files={this.state.files}
          onChange={(selection) => this.props.onSelection(selection)}
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
