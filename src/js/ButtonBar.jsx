import React from 'react';
import ReactDom from 'react-dom';

export default class ButtonBar extends React.Component {
  render() {
    this.allowCreateFolder = this.props.path.length > 0;
    this.allowReload = this.props.path.length > 0;

    return <section className="button-bar">
      <ul>
        <li onClick={() => this.allowCreateFolder && this.props.onCreateFolder()} className={this.allowCreateFolder ? "enabled" : "disabled" }>
          <span className="button-icon fa-stack">
            <span className="fa fa-folder-o fa-stack-1x"></span>
            <span className="fa fa-plus-circle badge fa-stack-1x"></span>
          </span>
          <span>Create Folder</span></li>
        <li onClick={() => this.allowReload && this.props.onReload()} className={this.allowReload ? "enabled" : "disabled" }>
        <span className="button-icon fa fa-refresh fa-1x"></span>
        <span>Reload</span></li>
      </ul>
    </section>;
  }
}
