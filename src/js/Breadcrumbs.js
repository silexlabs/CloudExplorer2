import React from 'react';
import ReactDom from 'react-dom';
import UnifileService from './UnifileService'

export default class Breadcrumbs extends React.Component {
  goto(idx) {
    this.props.onEnter(this.props.path.slice(0, idx));
  }
  render() {
    const markup = this.props.path.map((folderName, idx) => <li
      data-idx={ idx }
      key={ idx }
      onClick={e => this.goto(parseInt(e.target.getAttribute('data-idx')))}
      className="folder">
      <i className="icon"></i>
      {idx === 0 ? UnifileService.getDisplayName(folderName) : folderName}
      </li>);
    return <section><ul className="breadcrumbs">
      <li className="home" onClick={e => this.goto(0) }>
      <i className="icon"></i>
      </li>
      {markup}
      </ul></section>;
  }
}
