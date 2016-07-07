import React from 'react';
import ReactDom from 'react-dom';
import ModalDialog from './ModalDialog';
import ButtonBar from './ButtonBar';
import ButtonConfirm from './ButtonConfirm';
import Files from './Files';
import Breadcrumbs from './Breadcrumbs';
import ServiceSelector from './ServiceSelector';
import UnifileService from './UnifileService';

export default class CloudExplorer extends React.Component {
  INITIAL_STATE = {
    services: this.props.services,
    service: null,
    path: [],
    selection: [],
    files: [],
    pickFolder: false,
  };
  srv = new UnifileService('./')
  state = JSON.parse(JSON.stringify(this.INITIAL_STATE))
  reload() {
    this.srv.ls(this.state.service).then((files) => {
      this.setState({
        files: files,
        selection: [],
      });
    });
  }
  setService(service) {
    this.setState({
      service: service,
      path: [],
      selection: [],
      files: [],
    }, () => this.reload());
  }
  cd(path) {
    this.srv.cd(this.state.service, path)
    .then(path => {
      this.setState({
        path: path,
        files: [],
        selection: [],
      }, () => this.reload());
    })
    .catch(e => {
      console.error('ERROR:', e);
    });
  }
  cancel() {
    this.setState(JSON.parse(JSON.stringify(this.INITIAL_STATE)), () => this.props.onCancel());
  }
  render() {
    return <div>
    <h2>Services:</h2>
      <ServiceSelector
        service={this.state.service}
        services={this.state.services}
        onChange={(selection) => this.setService(selection)}
      />
      <h2>Buttons:</h2>
      <ButtonBar
        service={this.state.service}
        selection={this.state.selection}
        onRename={(newName) => console.dir(`rename "${this.state.selection[0].name}" to "${newName}"`)}
        onCreateFolder={(newName) => console.log(`create the folder "${newName}" in "${this.state.path.join('/')}"`)}
        onReload={() => this.reload()}
        onDownload={() => console.log(`Download`, this.state.selection)}
        onUpload={() => console.log('Upload', this.state.selection, this.state.path.join('/'))}
        onDelete={() => console.log('Delete', this.state.selection)}
      />
      <ButtonConfirm
        service={this.state.service}
        selection={this.state.selection}
        pickFolder={this.state.pickFolder}
        onPick={() => this.props.onPick(this.state.selection)}
        onEnter={folder => this.cd(this.state.path.concat(folder.name))}
        onCancel={() => this.cancel()}
      />
      <h2>Breadcrumbs:</h2>
      <Breadcrumbs
        service={this.state.service}
        path={this.state.path}
        onEnter={path => this.cd(path)}
      />
      <h2>Files:</h2>
      <Files
        path={this.state.path}
        selection={this.state.selection}
        files={this.state.files}
        onChange={(selection) => this.setState({selection: selection})}
      />
      <h2>Dialogs:</h2>
      <ModalDialog />
    </div>;
  }
}
