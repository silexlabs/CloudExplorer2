import React from 'react';
import ReactDom from 'react-dom';
import FileListItem  from './FileListItem';
import UnifileService from './UnifileService';

export default class Files extends React.Component {
  state = {
    createFolderMode: false,
    renameFileMode: false,
    renameFileData: {},
  }
  static DBLCLICK_DELAY_MS = 300;
  lastClickedEl = null
  lastClickedTime = Date.now();
  /**
   * called directly by owner class
   */
  isInputMode() {
    return this.state.createFolderMode || this.state.renameFileMode;
  }
  /**
   * called directly by owner class
   */
  cancelInputMode() {
    this.setState({
      createFolderMode: false,
      renameFileMode: false,
    });
  }
  /**
   * called directly by owner class
   */
  getNewDirName() {
    return new Promise((resolve, reject) => {
      this.setState({
        createFolderMode: true,
        renameFileMode: false,
      });
      this.onGetNewFolderName = name => {
        this.setState({
          createFolderMode: false,
        });
        resolve(name);
      };
    });
  }
  /**
   * called directly by owner class
   */
  getNewName(name) {
    return new Promise((resolve, reject) => {
      this.setState({
        createFolderMode: false,
        renameFileMode: true,
        renameFileData: {
          name: name,
          newName: name,
        }
      });
      this.onGetNewFileName = newName => {
        this.setState({
          renameFileMode: false,
        });
        resolve(newName);
      };
    });
  }
  isDoubleClick(element) {
    const now = Date.now();
    if(element === this.lastClickedEl && now - this.lastClickedTime < Files.DBLCLICK_DELAY_MS) {
      this.lastClickedEl = null;
      return true;
    }
    this.lastClickedEl = element;
    this.lastClickedTime = now;
    return false;
  }
  select(e, file) {
    e.preventDefault();
    e.stopPropagation();
    const multiple = e.ctrlKey || e.shiftKey;
    if(this.isDoubleClick(file)) {
      if(file.isDir || UnifileService.isService(file)) this.props.onEnter(file);
      else this.props.onPick(this.props.selection);
    }
    else {
      const selection = multiple && this.props.multiple ? this.props.selection : [];
      this.props.onChange(selection.concat(file));
    }
  }
  render() {
    let list = [];
    if(this.state.createFolderMode) {

      list.push(<li
        key="newFolder"
        className="selected folder"
      >
        <input type="text"
          onBlur={e => this.onGetNewFolderName(e.target.value)}
          onKeyPress={e => {
            if(e.key === 'Enter') this.onGetNewFolderName(e.target.value)
          }}
          placeholder="New Folder Name"
          autoFocus
        />
      </li>);
    }
    // each file has the extension in its export default class name
    let dotIdx;
    list = list.concat(this.props.files.map(file => <li
        onClick={e => this.select(e, file)}
      key={file.name}
      className={this.props.selection.find(selected => selected.name === file.name) ? 'selected' : ''}>
      {
        this.state.renameFileMode && file.name === this.state.renameFileData.name ?
          <input type="text"
            onBlur={e => this.onGetNewFileName(e.target.value)}
            onKeyPress={e => {
              if(e.key === 'Enter') this.onGetNewFileName(e.target.value)
            }}
            value={this.state.renameFileData.newName}
            onChange={e => this.setState({renameFileData: {
              name: file.name,
              newName: e.target.value,
            }})}
            autoFocus
          />
        : <FileListItem
            file={file}
            path={this.props.path}
            onRename={() => this.props.onRename(file)}
            onDelete={() => this.props.onDelete(file)}
            downloadUrl={this.props.getDownloadUrl(file)}
          >{file.displayName || file.name}</FileListItem>
      }
    </li>));
    return <section><ul className="files">{list}</ul></section>;
  }
}
