import "babel-polyfill";
import React from 'react';
import ReactDom from 'react-dom';

export default class ModalDialog extends React.Component {
  static instance;
  static getInstance() {
    return ModalDialog.instance;
  }
  state = {
    mode: 'hidden', // hidden, prompt
    message: <h2></h2>,
    inputText: '',
  }
  cbk: null
  componentDidMount() {
    ModalDialog.instance = this;
  }
  alert(message, cbk=null) {
    this.cbk = cbk;
    this.setState({
      mode: 'alert',
      message: message,
    });
  }
  prompt(message, inputText, cbk=null) {
    this.cbk = cbk;
    this.setState({
      mode: 'prompt',
      message: message,
      inputText: inputText,
    });
  }
  confirm(message, cbk=null) {
    this.cbk = cbk;
    this.setState({
      mode: 'confirm',
      message: message,
    });
  }
  ok() {
    this.setState({mode: 'hidden'});
    if(this.cbk) this.cbk(this.state.inputText);
    this.cbk = null;
  }
  cancel() {
    this.setState({mode: 'hidden'});
    this.cbk = null;
  }
  isOpened() {
    return this.state.mode !== 'hidden';
  }
  render() {
    if(this.state.mode != 'hidden') {
      var markup = null;
      if(this.state.mode === 'prompt') {
        markup = <input onChange={(e) => this.setState({inputText: e.target.value})} value={this.state.inputText} />;
      }
      return <section className="modal-dialog">
        <div className="dialog-bg"></div>;
        <div className="dialog-content">
          {this.state.message}
          {markup}
          <section className="button-bar"><ul>
            <li className="enabled" onClick={() => this.ok()}>
              <span className="button-icon fa fa-check fa-1x"></span>
              <span>Ok</span>
            </li >
	    { this.state.mode === 'alert' ? '' :
              <li className="enabled" onClick={() => this.cancel()}>
                <span className="button-icon fa fa-ban fa-1x"></span>
                <span>Cancel</span>
              </li >
            }
          </ul></section></div>
        </section>;
    }
    return null;
  }
}
