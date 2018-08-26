import Breadcrumbs from './Breadcrumbs';
import ButtonBar from './ButtonBar';
import ButtonConfirm from './ButtonConfirm';
import Files from './Files';
import FilesDropZone from './FilesDropZone';
import KeyboardNav from './KeyboardNav';
import ModalDialog from './ModalDialog';
import PropTypes from 'prop-types';
import React from 'react';
import UnifileService from './UnifileService';

/**
 * Class which binds the UI and the Unifile service all together
 */
export default class CloudExplorer extends React.Component {

  static propTypes = {
    defaultFileName: PropTypes.string,
    inputName: PropTypes.bool,
    multiple: PropTypes.bool,
    onCancel: PropTypes.func.isRequired,
    onCd: PropTypes.func.isRequired,
    onPick: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    onSelection: PropTypes.func.isRequired,
    path: PropTypes.arrayOf(PropTypes.string).isRequired,
    pickFolder: PropTypes.bool.isRequired,
    selection: PropTypes.arrayOf(PropTypes.object).isRequired
  }

  static defaultProps = {
    defaultFileName: null,
    inputName: false,
    multiple: false
  }

  constructor (props) {
    super(props);
    this.unifile = new UnifileService(this.props.path);
    this.state = JSON.parse(JSON.stringify(this.INITIAL_STATE));
  }

  /*
   * /////////////////////////////////////////
   * React component's methods
   * /////////////////////////////////////////
   */

  componentDidMount () {
    this.initInputProps(this.props);
  }

  componentWillReceiveProps (newProps) {

    /*
     * Check if the new props are different from the state
     * This will be false when the parent component changes
     * The props because we called onCd
     */
    if (newProps.path.join('/') !== this.props.path.join('/')) this.initInputProps(newProps, this.props);
    this.unifile.setExtensions(newProps.extensions);
  }

  initInputProps (newProps, oldProps) {
    this.setState({loading: true});
    this.unifile.cd(newProps.path)
    .then(() => {
      this.ls();
    })
    .catch((e) => {
      if (oldProps && oldProps.path) {
        this.props.onCd(oldProps.path);
      }
      this.onUnifileError(e);
    });
  }

  ERROR_MESSAGE = 'An error occured';

  ERROR_DETAILS = 'This operation failed with the following error message: ';

  BULLET_POINT = '- ';

  UPLOAD_ERROR_MESSAGE = 'I did not manage to upload the files: ';

  BUTTONS_TITLE = 'Buttons';

  BREADCRUMBS_TITLE = 'Breadcrumbs';

  DIALOG_TITLE = 'Dialogs';

  // Initial state for the react component
  INITIAL_STATE = {
    // Flag the current folder is was cached,
    cached: false,
    files: [],
    loading: false,
    uploadingFiles: []
  };


  /*
   * /////////////////////////////////////////
   * Utils methods
   * /////////////////////////////////////////
   */

  /*
   * Handle unifile errors
   * if message is not provided, it will display e.message
   * message can be a react template or a string
   */
  onUnifileError (err = {}, message = null) {

    /*
     * Make sure that e is not null,
     * This happens when unifile returns a null error (empty body)
     */
    const e = err || {};
    console.error('Error from unifile', e);

    // Take action depending on the error code
    switch (e.code) {
      case 'EACCES':
        // Go back to /
        this.cd([]);
        break;
      default: {
        // Display a modal with an error message
        const finalMessage = message || e.message || 'Unknown error';
        ModalDialog.getInstance().alert((
          <section>
            <h2>{this.ERROR_MESSAGE}</h2>
            <p>{this.ERROR_DETAILS}</p><strong>{ finalMessage }</strong>
          </section>
        ));
      }
    }

  }

  /*
   * /////////////////////////////////////////
   * Cloud Explorer internal API used by the App class
   * /////////////////////////////////////////
   */

  ls (disableCache = false) {
    const hasCache = disableCache ? false : this.unifile.lsHasCache(this.props.path);
    const cache = this.unifile.lsGetCache(this.props.path);
    this.setState({
      cached: hasCache,
      files: hasCache ? cache : this.state.files,
      loading: true
    }, () => {
      const {path} = this.props;
      this.unifile.ls(path).then((files) => {
        // Check that we did not CD during loading
        if (this.props.path === path) {
          this.setState({
            cached: false,
            files,
            loading: false
          });
          // the first display, single service mode, try to enter
          // this is useful when CE is used by hosting companies to display the user files, and the user has logged in their system
          if(!this.initDone && files.length === 1 &&
            UnifileService.isService(files[0]) &&
            files[0].isLoggedIn === true) {
            // enter the only service since we are logged in
            this.unifile.cd([files[0].name])
              .then(path => {
                this.props.onCd(path);
              });
          }
          this.initDone = true;
        }
      })
      .catch((e) => this.onUnifileError(e));
    });
  }

  delete (file) {
    const files = file ? [file] : this.props.selection;
    const batch = files.map((f) => ({
      name: f.isDir ? 'rmdir' : 'unlink',
      path: UnifileService.getPath(this.props.path.concat([f.name]))
    }));
    return this.unifile.delete(this.props.path, batch)
    .then(() => {
      this.ls();
    })
    .catch((e) => this.onUnifileError(e));
  }

  cd (path, relative = false) {
    this.props.onCd(relative ? this.props.path.concat(path) : path);
  }

  mkdir () {
    this.props.onSelection([]);
    this.filesComponent.getNewDirName().then((name) => {
      this.setState({loading: true}, () => {
        this.unifile.mkdir(name, true)
        .then(() => this.ls(true))
        .catch((e) => this.onUnifileError(e));
      });
    });
  }

  rename (name) {
    this.props.onSelection([]);
    this.filesComponent.getNewName(name).then((newName) => {
      if (newName !== name) {
        this.setState({loading: true}, () => {
          this.unifile.rename(name, newName)
          .then(() => {
            this.ls();
          })
          .catch((e) => this.onUnifileError(e));
        });
      }
    });
  }

  logout(service) {
    return this.unifile.logout(service)
    .then(() => this.ls());
  }

  cancel () {
    this.setState(
      JSON.parse(JSON.stringify(this.INITIAL_STATE)),
      () => this.props.onCancel()
    );
  }

  removeFromUploadingFiles (files) {
    this.setState({
      uploadingFiles: this.state.uploadingFiles
      .filter((f) => files.every((file) => file.upload.id !== f.upload.id))
    });
  }

  upload (files) {
    const uploads = files.map((file) => {
      file.upload = {
        error: null,
        id: `_${Math.random().toString()}${Date.now().toString()}`,
        path: this.props.path,
        progress: 0
      };
      return file;
    });
    this.unifile.upload(this.props.path, uploads, (progress) => {
      console.log('progress', progress);
    })
    .then(() => {
      console.log('done uploading files', uploads);
      this.ls();
    })
    .catch((e) => {
      console.log('error uploading file', e);
      this.onUnifileError(
        null, (
          <div>
            <p>{this.UPLOAD_ERROR_MESSAGE}</p>
            <ul>{
              uploads.map((f) => (
                <li key={f.name}>
                  {this.BULLET_POINT}{f.name}
                </li>
              ))}
            </ul>
            <p>{ e ? e.message || e.code : '' }</p>
          </div>
        )
      );
    })
    .then(() => this.removeFromUploadingFiles(uploads));

    this.setState({uploadingFiles: this.state.uploadingFiles.concat(uploads)});

  }

  render () {
    return (
      <div
        className={`root${this.state.loading ? ' loading' : ''}${this.state.cached ? ' cached' : ''}`}
      >
        <div className="panel top-button-bar">
          <h2>{this.BUTTONS_TITLE}</h2>
          <ButtonBar
            onCreateFolder={() => this.mkdir()}
            onReload={() => this.ls(true)}
            path={this.props.path}
            selection={this.props.selection}
          />
          <ButtonConfirm
            defaultFileName={this.props.defaultFileName}
            inputName={this.props.inputName}
            onCancel={() => this.cancel()}
            onPick={(file) => this.props.onPick(file)}
            onSave={(fileName) => this.props.onSave(fileName)}
            path={this.props.path}
            pickFolder={this.props.pickFolder}
            selection={this.props.selection}
          />
        </div>
        <div className="breadcrumbs panel">
          <h2>{this.BREADCRUMBS_TITLE}</h2>
          <Breadcrumbs
            onEnter={(path) => this.cd(path)}
            path={this.props.path}
          />
        </div>
        <div className="files panel">
          <Files
            files={this.state.files.concat(this.state.uploadingFiles)}
            getDownloadUrl={(file) => UnifileService.getUrl(this.props.path.concat([file.name]))}
            multiple={this.props.multiple}
            onChange={(selection) => this.props.onSelection(selection)}
            onDelete={(file) => this.delete(file)}
            onLogout={(service) => this.logout(service)}
            onEnter={(folder) => this.cd([folder.name], true)}
            onPick={(file) => this.props.onPick(file)}
            onRename={(file) => this.rename(file.name)}
            path={this.props.path}
            ref={(c) => (this.filesComponent = c)}
            selection={this.props.selection}
          />
          <KeyboardNav
            files={this.state.files}
            focusElement={this.filesComponent}
            onCancel={() => {
              if (this.dialog.isOpened()) {
                this.dialog.cancel();
              } else if (this.filesComponent.isInputMode()) {
                this.filesComponent.cancelInputMode();
              } else {
                this.cancel();
              }
            }}
            onChange={(selection) => this.props.onSelection(selection)}
            onEnter={(folder) => this.cd([folder.name], true)}
            onPick={(file) => this.props.onPick(file)}
            selection={this.props.selection}
          />
        </div>
        <div className="upload panel">
          <FilesDropZone
            onDrop={(files) => this.upload(files)}
          />
        </div>

        <div className="dialogs panel">
          <h2>{this.DIALOG_TITLE}</h2>
          <ModalDialog
            ref={(c) => (this.dialog = c)}
          />
        </div>
      </div>);
  }
}
