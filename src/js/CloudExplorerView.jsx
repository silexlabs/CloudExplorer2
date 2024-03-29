import Breadcrumbs from './Breadcrumbs';
import ButtonBar from './ButtonBar';
import Files from './Files';
import FilesDropZone from './FilesDropZone';
import ModalDialog from './ModalDialog';
import PropTypes from 'prop-types';
import React from 'react';
import MainView from './MainView';

/**
 * Class which binds the UI and the Unifile service all together
 */
export default class extends React.Component {

  static propTypes = {
    unifile: PropTypes.object.isRequired,
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
    selection: PropTypes.arrayOf(PropTypes.object).isRequired,
    thumbnailMode: PropTypes.bool,
    onThumbnailMode: PropTypes.func.isRequired,
  }

  static defaultProps = {
    defaultFileName: null,
    inputName: false,
    multiple: false
  }

  constructor (props) {
    super(props);
    this.state = JSON.parse(JSON.stringify(this.INITIAL_STATE));
  }

  /*
   * /////////////////////////////////////////
   * Constants
   * /////////////////////////////////////////
   */

  ERROR_MESSAGE = 'An error occured';

  LOGGEDOUT_ERROR_MESSAGE = 'You are not logged in.';

  LOGGEDOUT_DETAILS = 'Click ok to proceed to login';

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
    initDone: false,
    loading: false,
    uploadingFiles: [],
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
    const httpForbiddenCode = 403;

    // Take action depending on the error code
    switch (e.code) {
      case 'EACCES':
      case httpForbiddenCode:
        ModalDialog.getInstance().confirm(
          (
              <section>
                  <h2>{this.LOGGEDOUT_ERROR_MESSAGE}</h2>
                  <p>{ this.LOGGEDOUT_DETAILS }</p>
              </section>
          ), () => {
          // Ok, to restart the service must do this.cd() must know the service name.
            this.props.unifile.auth(this.props.path[0])
            .catch(() => this.cd([]))
            .then(() => this.ls());
          }, () => {

            /*
             * Cancel
             * Go back to /
             */
            this.cd([]);
          }
        );
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
    const hasCache = disableCache ? false : this.props.unifile.lsHasCache(this.props.path);
    const cache = this.props.unifile.lsGetCache(this.props.path);
    this.setState({
      cached: hasCache,
      files: hasCache ? cache : this.state.files,
      loading: true
    }, () => {
      const {path} = this.props;
      this.props.unifile.ls(path).then((files) => {

        /*
         * Single service mode: at init, when there is only 1 service and the
         * user is logged in, try to enter the service
         * This is useful when CE is used by hosting companies to display the
         * user files, and the user has logged in their system
         */
        const singleServiceMode = !this.state.initDone && files.length === 1 &&
          this.props.unifile.isService(files[0]) &&
          files[0].isLoggedIn === true;
        // Check that we did not CD during loading
        if (this.props.path === path) {
          this.setState({
            cached: false,
            files,
            loading: singleServiceMode,
          }, () => {
            if (singleServiceMode) {
              // Enter the only service since we are logged in
              this.props.unifile.cd([files[0].name])
              .then((filePath) => {
                this.props.onCd(filePath);
              });
            }
            this.setState({initDone: true});
          });
        }
      })
      .catch((e) => this.onUnifileError(e));
    });
  }

  delete (file) {
    const files = file ? [file] : this.props.selection;
    const batch = files.map((f) => ({
      name: f.isDir ? 'rmdir' : 'unlink',
      path: this.props.unifile.getPath(this.props.path.concat([f.name]))
    }));
    return this.props.unifile.delete(this.props.path, batch)
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
        this.props.unifile.mkdir(name, true)
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
          this.props.unifile.rename(name, newName)
          .then(() => {
            this.ls();
          })
          .catch((e) => this.onUnifileError(e));
        });
      }
    });
  }

  logout (service) {
    return this.props.unifile.logout(service)
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
    this.props.unifile.upload(this.props.path, uploads, (progress) => {
      // TODO: upload progress
    })
    .then(() => {
      this.ls();
    })
    .catch((e) => {
      console.error('Error uploading file', e);
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
    return <MainView
      unifile={this.props.unifile}
      buttonBar={<ButtonBar
        onCreateFolder={() => this.mkdir()}
        onReload={() => this.ls(true)}
        onThumbnailMode={(thumbnailMode) => this.props.onThumbnailMode(thumbnailMode)}
        thumbnailMode={this.props.thumbnailMode}
        path={this.props.path}
        selection={this.props.selection}
      />}
      breadcrumbs={<Breadcrumbs
        onEnter={(path) => this.cd(path)}
        path={this.props.path}
      />}
      filesDropZone={<FilesDropZone
        disabled={this.props.path.length === 0}
        onDrop={(files) => this.upload(files)}
      />}
      cancelInputMode = {() => this.filesComponent.cancelInputMode()}
      isInputMode = {() => this.filesComponent.isInputMode()}
      filesComponent={<Files
        unifile={this.props.unifile}
        files={this.state.files.concat(this.state.uploadingFiles)}
        getDownloadUrl={(file) => (!file.upload && this.props.path.length > 0 && !file.isDir && !this.props.unifile.isService(file) ? this.props.unifile.getUrl(this.props.path.concat([file.name])) : null)}
        getThumbnailUrl={(file) => (file.isDir ? this.props.unifile.getIconUrl([this.props.path[0]], '.folder') : this.props.unifile.getIconUrl(this.props.path, file.name)) }
        multiple={this.props.multiple}
        onChange={(s) => this.props.onSelection(s)}
        onDelete={(file) => this.delete(file)}
        onLogout={(service) => this.logout(service)}
        onEnter={(folder) => this.cd([folder.name], true)}
        onPick={(file) => this.props.onPick(file)}
        onRename={(file) => this.rename(file.name)}
        path={this.props.path}
        ref={(c) => (this.filesComponent = c)}
        selection={this.props.selection}
        thumbnailMode={this.props.thumbnailMode}
      />}
      loading={this.state.loading}
      cached={this.state.cached}
      files={this.state.files}
      defaultFileName={this.props.defaultFileName}
      inputName={this.props.inputName}
      onCancel={() => this.cancel()}
      onPick={(file) => this.props.onPick(file)}
      onSave={(fileName) => this.props.onSave(fileName)}
      path={this.props.path}
      pickFolder={this.props.pickFolder}
      selection={this.props.selection}
      onSelection={(s) => this.props.onSelection(s)}
      onEnter={(folder) => this.cd([folder.name], true)}
    />;
  }
}

