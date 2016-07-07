import React from 'react';
import ReactDom from 'react-dom';
import ModalDialog from './ModalDialog';

export default class ButtonBar extends React.Component {
  delete() {
    ModalDialog.getInstance().confirm(<section>
        <p>Are you sure you want to delete these files?</p>
        <ul>{this.props.selection.map((file, idx) => <li key={ idx }>{ file.name }</li>)}</ul>
      </section>,
      this.props.onDelete);
  }
  rename() {
    ModalDialog.getInstance().prompt(<p>Name:</p>, this.props.selection[0].name, this.props.onRename);
  }
  createFolder() {
    ModalDialog.getInstance().prompt(<p>Name:</p>, '', this.props.onCreateFolder);
  }
  render() {
    this.allowDownload = this.props.service && this.props.selection.length === 1 && !this.props.selection[0].is_dir;
    this.allowDelete = this.props.service && this.props.selection.length > 0;
    this.allowDuplicate = this.props.service && this.props.selection.length > 0 && !this.props.selection[0].is_dir;
    this.allowRename = this.props.service && this.props.selection.length === 1;
    this.allowUpload = this.props.service;
    this.allowCreateFolder = this.props.service;
    this.allowReload = this.props.service;

    return <section className="button-bar">
      <ul>
        <li onClick={() => this.allowUpload && this.props.onUpload()} className={this.allowUpload ? "enabled" : "disabled" }>Upload</li>
        <li onClick={() => this.allowDownload && this.props.onDownload()} className={this.allowDownload ? "enabled" : "disabled"}>Download</li>
        <li onClick={() => this.allowDelete && this.delete()} className={this.allowDelete ? "enabled" : "disabled"}>Delete</li>
        <li onClick={() => this.allowDuplicate && this.props.onDuplicate()} className={this.allowDuplicate ? "enabled" : "disabled"}>Duplicate</li>
        <li onClick={() => this.allowRename && this.rename()} className={this.allowRename ? "enabled" : "disabled"}>Rename</li>
        <li onClick={() => this.allowCreateFolder && this.createFolder()} className={this.allowCreateFolder ? "enabled" : "disabled" }>Create Folder</li>
        <li onClick={() => this.allowReload && this.props.onReload()} className={this.allowReload ? "enabled" : "disabled" }>Reload</li>
      </ul>
    </section>;
  }
}
