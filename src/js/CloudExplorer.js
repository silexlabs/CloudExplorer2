import React from 'react';
import ReactDom from 'react-dom';
import ModalDialog from './ModalDialog';
import ButtonBar from './ButtonBar';
import ButtonConfirm from './ButtonConfirm';
import Files from './Files';
import Breadcrumbs from './Breadcrumbs';
import ServiceSelector from './ServiceSelector';
import UnifileService from './UnifileService';

/**
 * @class which binds the UI and the Unifile service all together
 */
export default class CloudExplorer extends React.Component {
  INITIAL_STATE = {
    service: null,
    path: [],
    selection: [],
    files: [],
    pickFolder: false,
  };
  srv = new UnifileService('./', this.props.service, this.props.path)
  state = JSON.parse(JSON.stringify(this.INITIAL_STATE))
  reload() {
    this.srv.ls(this.state.service, this.state.path).then((files) => {
      this.setState({
        files: files,
        selection: [],
      });
    });
  }
  download() {
    window.open(this.srv.getUrl(this.state.service, this.state.path.concat([this.state.selection[0].name])));
  }
  delete() {
    Promise.all(this.state.selection.map(file => {
      return this.srv.rm(this.state.service, this.state.path.concat([file.name]));
    })).then(results => {
      // FIXME: prompt the result here
      this.reload();
    })
    .catch(e => console.error('ERROR:', e));
  }
  setService(service) {
    this.setState({
      service: service,
      path: [],
      selection: [],
      files: [],
    }, () => {
      this.reload();
      this.props.onService(this.state.service);
    });
  }
  cd(path, relative=false) {
    this.srv.cd(this.state.service, path, relative)
    .then(path => {
      this.setState({
        path: path,
        files: [],
        selection: [],
      }, () => {
        this.reload();
        this.props.onCd(this.state.path);
      });
    })
    .catch(e => console.error('ERROR:', e));
  }
  rename(name, newName) {
    console.log('ccccc');
    this.srv.rename(this.state.service, name, newName)
    .then(res => {
      console.log('reloaded', res);
      // FIXME: prompt the result here
      this.reload();
    })
    .catch(e => console.error('ERROR:', e));
  }
  cancel() {
    this.setState(JSON.parse(JSON.stringify(this.INITIAL_STATE)), () => this.props.onCancel());
  }
  componentDidMount() {
    this.initInputProps(this.props);
  }
  componentWillReceiveProps(newProps) {
    // check if the new props are different from the state
    // this will be false when the parent component changes
    // the props because we called onService or onCd
    if(newProps.path.join('/') !== this.state.path.join('/') ||
      newProps.service !== this.state.service) {
      this.initInputProps(newProps);
    }
  }
  initInputProps(newProps) {
    this.setState({
      service: newProps.service,
      path: newProps.path,
      selection: [],
      files: [],
    }, () => {
      this.reload();
    });
  }
  render() {
    return <div>
      <div className="services panel">
        <h2>Services</h2>
        <ServiceSelector
          service={this.state.service}
          services={this.props.services}
          onChange={(selection) => this.setService(selection)}
        />
      </div>
      <div className="buttons panel">
        <h2>Buttons</h2>
        <ButtonBar
          service={this.state.service}
          selection={this.state.selection}
          onRename={(newName) => this.rename(this.state.selection[0].name, newName)}
          onCreateFolder={(newName) => console.log(`create the folder "${newName}" in "${this.state.path.join('/')}"`)}
          onReload={() => this.reload()}
          onDownload={() => this.download()}
          onUpload={() => console.log('Upload', this.state.selection, this.state.path.join('/'))}
          onDelete={() => this.delete()}
        />
        <ButtonConfirm
          service={this.state.service}
          selection={this.state.selection}
          path={this.state.path}
          pickFolder={this.state.pickFolder}
          onPick={() => this.props.onPick(this.state.selection)}
          onEnter={folder => this.cd([folder.name], true)}
          onUp={() => this.cd(this.state.path.slice(0, -1), false)}
          onCancel={() => this.cancel()}
        />
      </div>
      <div className="breadcrumbs panel">
        <h2>Breadcrumbs</h2>
        <Breadcrumbs
          service={this.state.service}
          path={this.state.path}
          onEnter={path => this.cd(path)}
        />
      </div>
      <div className="files panel">
        <h2>Files</h2>
        <Files
          path={this.state.path}
          selection={this.state.selection}
          files={this.state.files}
          onChange={(selection) => this.setState({selection: selection})}
          onEnter={folder => this.cd([folder.name], true)}
          onPick={(file) => this.props.onPick(file)}
        />
      </div>
      <div className="dialogs panel">
        <h2>Dialogs</h2>
        <ModalDialog />
      </div>
    </div>;
  }
}
