import React from 'react';
import ReactDom from 'react-dom';

export default class ServiceSelector extends React.Component {
  select(e) {
    let service = e.target.getAttribute('data-name');
    let req = new XMLHttpRequest();
    req.open('POST', '/' + e.target.getAttribute('data-name') + '/authorize', false);
    req.send();
    let win = window.open(req.responseText);
    win.addEventListener('unload', () => {
      console.log('closed?', win.closed);
      win.onunload = null;
      this.startPolling(win, service);
    });
  }
  startPolling(win, service) {
    console.log('closed?', win.closed);
    if(win.closed) {
      // FIXME: check if we are connected to `service`
      this.props.onChange(service);
    }
    else setTimeout(() => {
      this.startPolling(win, service);
    }, 200);
  }
  render() {
    let list = this.props.services.map(service => <li
      data-name={service}
      key={service}
      onClick={(e) => this.select(e)}
      className={this.props.service === service ? 'selected' : ''}>
      {service}
    </li>);
    return <section><ul className="services">{list}</ul></section>;
  }
}
