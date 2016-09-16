import React from 'react';
import ReactDom from 'react-dom';

export default class ButtonBar extends React.Component {
  render() {
    this.allowCreateFolder = this.props.path.length > 0;
    this.allowReload = this.props.path.length > 0;

    return <section className="button-bar">
      <ul>
        <li onClick={() => this.allowCreateFolder && this.props.onCreateFolder()} className={this.allowCreateFolder ? "enabled" : "disabled" }>Create Folder</li>
        <li onClick={() => this.allowReload && this.props.onReload()} className={this.allowReload ? "enabled" : "disabled" }>Reload</li>
      </ul>
    </section>;
  }
}
