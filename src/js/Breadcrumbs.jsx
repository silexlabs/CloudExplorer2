import React from 'react';
import ReactDom from 'react-dom';

export default class Breadcrumbs extends React.Component {
  goto(idx) {
    this.props.onEnter(this.props.path.slice(0, idx));
  }
  render() {
    let idx = 1;
    const markup = this.props.path.map(folderName => <li
      data-idx={ idx }
      key={ idx++ }
      onClick={e => this.goto(parseInt(e.target.getAttribute('data-idx')))}
      className="folder">
      <i className="icon"></i>
      {folderName}
    </li>);
    return <section><ul className="breadcrumbs">
      <li className="home" onClick={e => this.goto(0) }>
        <i className="icon"></i>
      </li>
      {markup}
    </ul></section>;
  }
}
