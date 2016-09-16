import React from 'react';
import ReactDom from 'react-dom';
import FileListItem  from './FileListItem';

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
  select(file, multiple) {
    if(this.isDoubleClick(file)) {
      if(file.isDir) this.props.onEnter(file);
      else this.props.onPick(file);
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
        data-idx={idx++}
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
      key={file.name}
      className={(this.props.selection.includes(file) ? 'selected' : '') + ' ' + (file.isDir ? 'folder' : 'file') + ' ' + file.mime.replace(/\//g, ' ')}>
      <i className={"icon " + (file.isDir ? 'folder' : 'file') + ' ' + file.mime.replace(/\//g, ' ')}></i>
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
            onSelect={multiple => this.select(file, multiple)}
            file={file}
            path={this.props.path}
            onRename={() => this.props.onRename(file)}
            onDelete={() => this.props.onDelete(file)}
            onDownload={() => this.props.onDownload(file)}
          >{file.name}</FileListItem>
      }
    </li>));
    return <section><ul className="files">{list}</ul></section>;
  }
}
