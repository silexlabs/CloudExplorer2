import React from 'react';
import ReactDom from 'react-dom';
import CloudExplorer from './CloudExplorer';

// TODO Call a list route of the server
const SERVICES = ['FTP', 'Dropbox', 'GitHub', 'RemoteStorage'];
const STORAGE_KEY_PATH = 'CloudExplorer.path';

/**
 * @class in charge of the history and init of the main CloudExplorer component
 */
class App extends React.Component {
  hash = null
  state = {
    path: [],
  }
  loadHistory() {
    const path = localStorage.getItem(STORAGE_KEY_PATH);
    if(path && path !== this.state.path) {
      this.setState({
        path: JSON.parse(path),
      });
    }
  }
  onChange(path) {
    if(path !== this.state.path) {
      this.setState({
        path: path,
      });
    }
    localStorage.setItem(STORAGE_KEY_PATH, JSON.stringify(path));
  }
  componentWillMount() {
    this.loadHistory();
  }
  render() {
    return <CloudExplorer
      services={SERVICES.map(service => {
        return {
          name: service,
          mime: 'application/json',
          isDir: true,
        }
      })}
      path={this.state.path}
      onCancel={() => console.log('CloudExplorer: Canceled')}
      onPick={(selection) => console.log('CloudExplorer: Picked', selection)}
      onCd={(path) => this.onChange(path)}
      pickFolder={false}
    />;
  }
}

ReactDom.render(
  <App />,
  document.getElementById('cloud-explorer')
);
