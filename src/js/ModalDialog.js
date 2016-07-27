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
  prompt(message, inputText, cbk) {
    this.cbk = cbk;
    this.setState({
      mode: 'prompt',
      message: message,
      inputText: inputText,
    });
  }
  confirm(message, cbk) {
    this.cbk = cbk;
    this.setState({
      mode: 'confirm',
      message: message,
    });
  }
  ok() {
    this.setState({mode: 'hidden'});
    this.cbk(this.state.inputText);
    this.cbk = null;
  }
  render() {
    if(this.state.mode != 'hidden') {
      var markup = null;
      if(this.state.mode === 'prompt') {
        markup = <input onChange={(e) => this.setState({inputText: e.target.value})} value={this.state.inputText} />;
      }
      return <section className="modal-dialog">
        {this.state.message}
        {markup}
        <button onClick={() => this.ok()}>Ok</button>
      </section>;
    }
    return null;
  }
}
