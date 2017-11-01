import React from 'react';
import ReactDom from 'react-dom';
import ModalDialog from './ModalDialog';
import UnifileService from './UnifileService';

export default class FileListItem extends React.Component {
  delete() {
    ModalDialog.getInstance().confirm(<section>
        <h2>Are you sure you want to delete this file?</h2>
        <p>This file is about to be deleted:</p><p><strong>{ this.props.file.name }</strong></p>
      </section>,
      this.props.onDelete);
  }
  rename() {
    this.props.onRename();
  }
  render() {
    const file = this.props.file;
    const isService = UnifileService.isService(file);
    this.allowDownload = (!file.upload) && this.props.path.length > 0 && !file.isDir && !isService;
    this.allowDelete = (!file.upload) && this.props.path.length > 0 && !isService;
    this.allowRename = (!file.upload) && this.props.path.length > 0 && !isService;
    const mime = isService ? ' application json' : 
      file.mime && file.mime.replace(/\//g, ' ');
    return <section className={
			"file-list-item" +
			(file.upload ? ' uploading progress-' + file.upload.progress : '')
		}>
      <i className={
	      "icon" + 
	      (file.upload ? ' fa-gear' : (file.isDir || isService ? ' folder' : ' file')) + 
	      (file.isLoggedIn ? ' loggedin' : '') + // for services only
	      (mime ? ' ' + mime : '')
      }></i>
      <label>{this.props.children}</label>
      <ul className="inline-button-bar">
        <li>{
          this.allowDownload ? <a
          target="_blank"
          href={this.props.downloadUrl}
          className={this.allowDelete ? "enabled" : "disabled"}>Download</a> : ""
        }</li>
        <li onClick={() => this.allowDelete && this.delete()} className={this.allowDelete ? "enabled" : "disabled"}>Delete</li>
        <li onClick={() => this.allowRename && this.rename()} className={this.allowRename ? "enabled" : "disabled"}>Rename</li>
      </ul>
    </section>;
  }
}
