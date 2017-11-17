import PropTypes from 'prop-types';
import React from 'react';

export default class Breadcrumbs extends React.Component {
  static propTypes = {
    onEnter: PropTypes.func.isRequired,
    path: PropTypes.arrayOf(PropTypes.string).isRequired
  }

  goto (idx) {
    this.props.onEnter(this.props.path.slice(0, idx));
  }

  render () {
    let idx = 1;
    const markup = this.props.path.map((folderName) => (
      <li
        className="folder"
        data-idx={idx}
        key={idx++}
        onClick={(e) => this.goto(parseInt(e.target.getAttribute('data-idx'), 10))}
      >
        <i className="icon" />
        {folderName}
      </li>
    ));
    return (
      <section>
        <ul className="breadcrumbs">
          <li
            className="home"
            onClick={() => this.goto(0)}
          >
            <i className="icon" />
          </li>
          {markup}
        </ul>
      </section>
    );
  }
}
