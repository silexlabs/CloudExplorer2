import React from 'react';
import ReactDom from 'react-dom';
import ModalDialog from './ModalDialog';
import UnifileService from './UnifileService';

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
    const file = this.props.file;
    const isService = UnifileService.isService(file);
    this.allowDownload = (!this.props.file.upload) && this.props.path.length > 0 && !this.props.file.isDir && !isService;
    this.allowDelete = (!this.props.file.upload) && this.props.path.length > 0 && !isService;
    this.allowRename = (!this.props.file.upload) && this.props.path.length > 0 && !isService;
    const mime = isService ? ' application json' : 
      file.mime && file.mime.replace(/\//g, ' ');
    return <section className="file-list-item">
      <i className={
	      "icon" + 
	      (file.isDir || isService ? ' folder' : ' file') + 
	      (file.isLoggedIn ? ' loggedin' : '') + // for services only
	      (mime ? ' ' + mime : '')
      }></i>
      <label
        onClick={e => this.select(e)}
      >{this.props.children}</label>
      <ul className="inline-button-bar">
        <li>{
          this.allowDownload ? <a
          download={file.name}
          href={file.name + this.props.path.join('/')}
          className={this.allowDelete ? "enabled" : "disabled"}>Downoad</a> : ""
        }</li>
        <li onClick={() => this.allowDelete && this.delete()} className={this.allowDelete ? "enabled" : "disabled"}>Delete</li>
        <li onClick={() => this.allowRename && this.rename()} className={this.allowRename ? "enabled" : "disabled"}>Rename</li>
      </ul>
    </section>;
  }
}
