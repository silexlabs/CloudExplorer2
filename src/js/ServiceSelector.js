import React from 'react';
import ReactDom from 'react-dom';

export default class ServiceSelector extends React.Component {
  select(e) {
    this.props.onChange(e.target.getAttribute('data-name'));
  }
  render() {
    var list = this.props.services.map(service => <li
      data-name={service}
      key={service}
      onClick={(e) => this.select(e)}
      className={this.props.service === service ? 'selected' : ''}>
      {service}
    </li>);
    return <section><ul className="services">{list}</ul></section>;
  }
}
