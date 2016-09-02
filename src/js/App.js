import React from 'react';
import ReactDom from 'react-dom';
import CloudExplorer from './CloudExplorer';

// TODO Call a list route of the server
const SERVICES = ['FTP', 'Dropbox', 'GitHub', 'RemoteStorage'];
const STORAGE_KEY_SERVICE = 'CloudExplorer.service';
const STORAGE_KEY_PATH = 'CloudExplorer.path';

/**
 * @class in charge of the history and init of the main CloudExplorer component
 */
class App extends React.Component {
  hash = null
  state = {
    service: null,
    path: [],
  }
  loadHistory() {
    const service = localStorage.getItem(STORAGE_KEY_SERVICE);
    const path = localStorage.getItem(STORAGE_KEY_PATH);
    console.log('loadHistory', this.state.service, this.state.path, service, path);
    if(service && path
      && (service !== this.state.service || path !== this.state.path)) {
      this.setState({
        service: service,
        path: JSON.parse(path),
      });
    }
  }
  onChange(service, path) {
    if(service !== this.state.service || path !== this.state.path) {
      console.log('onChange', this.state.service, this.state.path, service, path);
      this.setState({
        service: service,
        path: path,
      });
    }
    localStorage.setItem(STORAGE_KEY_SERVICE, service);
    localStorage.setItem(STORAGE_KEY_PATH, JSON.stringify(path));
  }
  componentWillMount() {
    console.log('mounting');
    this.loadHistory();
  }
  render() {
    console.log('render', this.state.service, this.state.path);
    return <CloudExplorer
      services={SERVICES}
      service={this.state.service}
      path={this.state.path}
      onCancel={() => console.log('CloudExplorer: Canceled')}
      onPick={(selection) => console.log('CloudExplorer: Picked', selection)}
      onCd={(path) => this.onChange(this.state.service, path)}
      onService={(service) => this.onChange(service, this.state.path)}
      pickFolder={false}
    />;
  }
}

ReactDom.render(
  <App />,
  document.getElementById('cloud-explorer')
);
