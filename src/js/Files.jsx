import FileListItem from './FileListItem';
import PropTypes from 'prop-types';
import React from 'react';

const DBLCLICK_DELAY_MS = 300;

export default class Files extends React.Component {
  static propTypes = {
    files: PropTypes.arrayOf(PropTypes.object).isRequired,
    unifile: PropTypes.object.isRequired,
    getDownloadUrl: PropTypes.func.isRequired,
    getThumbnailUrl: PropTypes.func.isRequired,
    multiple: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
    onDelete: PropTypes.func,
    onEnter: PropTypes.func,
    onLogout: PropTypes.func,
    onPick: PropTypes.func,
    onRename: PropTypes.func,
    path: PropTypes.arrayOf(PropTypes.string),
    selection: PropTypes.arrayOf(PropTypes.object).isRequired,
    thumbnailMode: PropTypes.bool,
  }

  static defaultProps = {multiple: false}

  state = {
    createFolderMode: false,
    renameFileData: {},
    renameFileMode: false,
    lastClickedEl: null,
    lastClickedTime: Date.now(),
  }

  /*
   * Called directly by owner class
   */
  isInputMode () {
    return this.state.createFolderMode || this.state.renameFileMode;
  }


  /*
   * Called directly by owner class
   */
  cancelInputMode () {
    this.setState({
      createFolderMode: false,
      renameFileMode: false
    });
  }


  /*
   * Called directly by owner class
   */
  getNewDirName () {
    return new Promise((resolve) => {
      this.setState({
        createFolderMode: true,
        renameFileMode: false
      });
      this.onGetNewFolderName = (name) => {
        this.setState({createFolderMode: false});
        resolve(name);
      };
    });
  }


  /*
   * Called directly by owner class
   */
  getNewName (name) {
    return new Promise((resolve) => {
      this.setState({
        createFolderMode: false,
        renameFileData: {
          name,
          newName: name
        },
        renameFileMode: true
      });
      this.onGetNewFileName = (newName) => {
        this.setState({renameFileMode: false});
        resolve(newName);
      };
    });
  }

  isDoubleClick (element) {
    const now = Date.now();
    if (element === this.state.lastClickedEl && now - this.state.lastClickedTime < DBLCLICK_DELAY_MS) {
      this.setState({lastClickedEl: null});
      return true;
    }
    this.setState({lastClickedEl: element,
      lastClickedTime: now});
    return false;
  }

  select (e, file) {
    e.stopPropagation();
    const multiple = e.ctrlKey || e.shiftKey;
    if (this.isDoubleClick(file)) {
      if (file.isDir || this.props.unifile.isService(file)) {
        this.props.onEnter(file);
      } else {
        this.props.onPick(this.props.selection);
      }
    } else {
      const selection = multiple && this.props.multiple ? this.props.selection : [];
      this.props.onChange(selection.concat(file));
    }
  }

  render () {
    let list = [];
    if (this.state.createFolderMode) {

      list.push((
          <li
            className="selected folder"
            key="newFolder"
        >
              <input
                autoFocus
                className="file-name-input"
                onBlur={(e) => this.onGetNewFolderName(e.target.value)}
                onKeyPress={(e) => {
              if (e.key === 'Enter') {
                this.onGetNewFolderName(e.target.value);
              }
            }}
                placeholder="New Folder Name"
                type="text"
          />
          </li>
      ));
    }
    // Each file has the extension in its export default class name
    const pathStr = this.props.path ? this.props.path.join('/') : '';
    list = list.concat(this.props.files
    // Filter the uploading files to other folders
    .filter((file) => !file.upload || file.upload.path.join('/') === pathStr)
    // Build the <ul> list
    .map((file) => ((
        <li
          className={this.props.selection.find((selected) => selected.name === file.name) ? 'selected' : ''}
          key={file.name + (file.upload ? '-uploading' : '')}
          onClick={(e) => this.select(e, file)}
      >
            {
          this.state.renameFileMode && file.name === this.state.renameFileData.name
            ? (
                <input
                  autoFocus
                  className="file-name-input"
                  onBlur={(e) => this.onGetNewFileName(e.target.value)}
                  onChange={(e) => this.setState({
                  renameFileData: {
                    name: file.name,
                    newName: e.target.value
                  }
                })}
                  onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    this.onGetNewFileName(e.target.value);
                  }
                }}
                  type="text"
                  value={this.state.renameFileData.newName}
              />
            )
            : (
                <FileListItem
                  unifile={this.props.unifile}
                  downloadUrl={this.props.getDownloadUrl(file)}
                  getThumbnailUrl={(file) => this.props.getThumbnailUrl(file)}
                  file={file}
                  onDelete={() => this.props.onDelete(file)}
                  onRename={() => this.props.onRename(file)}
                  onLogout={(service) => this.props.onLogout(service)}
                  path={this.props.path}
                  thumbnailMode={this.props.thumbnailMode}
              >{file.displayName || file.name}
                </FileListItem>
            )
        }
        </li>
    ))));
    return <section><ul className={`files${this.props.thumbnailMode ? ' thumbnail-mode' : ''}`}>{list}</ul></section>;
  }
}
