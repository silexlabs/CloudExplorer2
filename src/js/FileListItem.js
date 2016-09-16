import React from 'react';
import ReactDom from 'react-dom';
import ModalDialog from './ModalDialog';

export default class FileListItem extends React.Component {
  delete() {
    ModalDialog.getInstance().confirm(<section>
        <h2>Are you sure you want to delete this file?</h2>
        <p>{ this.props.file.name }</p>
      </section>,
      this.props.onDelete);
  }
  rename() {
    this.props.onRename();
  }
  select(e) {
    this.props.onSelect(e.ctrlKey || e.shiftKey);
    e.preventDefault();
    e.stopPropagation();
  }
  render() {
    this.allowDownload = this.props.path.length > 0 && !this.props.file.isDir;
    this.allowDelete = this.props.path.length > 0;
    this.allowRename = this.props.path.length > 0;

    return <section className="file-list-item">
      <label
        onClick={e => this.select(e)}
      >{this.props.children}</label>
      <ul className="inline-button-bar">
        <li onClick={() => this.allowDownload && this.props.onDownload()} className={this.allowDownload ? "enabled" : "disabled"}>Download</li>
        <li onClick={() => this.allowDelete && this.delete()} className={this.allowDelete ? "enabled" : "disabled"}>Delete</li>
        <li onClick={() => this.allowRename && this.rename()} className={this.allowRename ? "enabled" : "disabled"}>Rename</li>
      </ul>
    </section>;
  }
}
