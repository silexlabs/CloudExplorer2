import React from 'react';
import ReactDom from 'react-dom';
import CloudExplorer from './CloudExplorer';

const SERVICES = ['FTP', 'Dropbox', 'GitHub'];

/**
 * @class in charge of the history and init of the main CloudExplorer component
 */
class App extends React.Component {
  hash = null
  state = {
    service: null,
    path: [],
  }
  loadHistory(hash) {
    if(hash === this.hash) return;
    this.hash = hash;
    var hashArr = hash.substring(1).split('/');
    this.setState({
      service: hashArr.length > 0 ? hashArr.shift() : '',
      path: hashArr.length && hashArr[0] != '' ? hashArr : [],
    });
  }
  saveHistory(service, path) {
    this.hash = '#' + service + '/' + path.join('/');
    window.location.hash = this.hash;
    this.setState({
      service: service,
      path: path,
    });
  }
  componentWillMount() {
    window.addEventListener('hashchange', (event) => {
      this.loadHistory(event.newURL.substring(event.newURL.indexOf('#')));
    });
    this.loadHistory(window.location.hash);
  }
  render() {
    return <CloudExplorer
      services={SERVICES}
      service={this.state.service}
      path={this.state.path}
      onCancel={() => console.log('CloudExplorer: Canceled')}
      onPick={(selection) => console.log('CloudExplorer: Picked', selection)}
      onCd={(path) => this.saveHistory(this.state.service, path)}
      onService={(service) => this.saveHistory(service, this.state.path)}
    />;
  }
}

ReactDom.render(
  <App />,
  document.getElementById('cloud-explorer')
);
