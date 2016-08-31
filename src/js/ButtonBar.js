import React from 'react';
import ReactDom from 'react-dom';
import ModalDialog from './ModalDialog';

export default class ButtonBar extends React.Component {
  delete() {
    ModalDialog.getInstance().confirm(<section>
        <h2>Are you sure you want to delete these files?</h2>
        <ul>{this.props.selection.map((file, idx) => <li key={ idx }>{ file.name }</li>)}</ul>
      </section>,
      this.props.onDelete);
  }
  rename() {
    this.props.onRename(this.props.selection[0].name);
  }
  render() {
    this.allowDownload = this.props.service && this.props.selection.length === 1 && !this.props.selection[0].is_dir;
    this.allowDelete = this.props.service && this.props.selection.length > 0;
    this.allowRename = this.props.service && this.props.selection.length === 1;
    this.allowCreateFolder = this.props.service;
    this.allowReload = this.props.service;

    return <section className="button-bar">
      <ul>
        <li onClick={() => this.allowDownload && this.props.onDownload()} className={this.allowDownload ? "enabled" : "disabled"}>Download</li>
        <li onClick={() => this.allowDelete && this.delete()} className={this.allowDelete ? "enabled" : "disabled"}>Delete</li>
        <li onClick={() => this.allowRename && this.rename()} className={this.allowRename ? "enabled" : "disabled"}>Rename</li>
        <li onClick={() => this.allowCreateFolder && this.props.onCreateFolder()} className={this.allowCreateFolder ? "enabled" : "disabled" }>Create Folder</li>
        <li onClick={() => this.allowReload && this.props.onReload()} className={this.allowReload ? "enabled" : "disabled" }>Reload</li>
      </ul>
    </section>;
  }
}
