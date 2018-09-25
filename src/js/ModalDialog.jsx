import 'babel-polyfill';
import React from 'react';

export default class ModalDialog extends React.Component {
  static instance;

  static getInstance () {
    return ModalDialog.instance;
  }

  state = {
    // Hidden, prompt
    inputText: '',
    message: <h2 />,
    mode: 'hidden'
  }


  componentDidMount () {
    ModalDialog.instance = this;
  }

  cbk = null;

  OK_LABEL = 'Ok';

  CANCEL_LABEL = 'Cancel';

  alert (message, cbk = null) {
    this.cbk = cbk;
    this.setState({
      message,
      mode: 'alert'
    });
  }

  prompt (message, inputText, cbk = null, cancelCbk = null) {
    this.cbk = cbk;
    this.cancelCbk = cancelCbk;
    this.setState({
      inputText,
      message,
      mode: 'prompt'
    });
  }

  confirm (message, cbk = null, cancelCbk = null) {
    this.cancelCbk = cancelCbk;
    this.cbk = cbk;
    this.setState({
      message,
      mode: 'confirm'
    });
  }

  ok () {
    this.setState({mode: 'hidden'});
    if (this.cbk) {
      this.cbk(this.state.inputText);
    }
    this.cbk = null;
  }

  cancel () {
    this.setState({mode: 'hidden'});
    if (this.cancelCbk) {
      this.cancelCbk();
    }
    this.cbk = null;
    this.cancelCbk = null;
  }

  isOpened () {
    return this.state.mode !== 'hidden';
  }

  render () {
    if (this.state.mode !== 'hidden') {
      let markup = null;
      if (this.state.mode === 'prompt') {
        markup = (
          <input
            onChange={(e) => this.setState({inputText: e.target.value})}
            value={this.state.inputText}
          />
        );
      }
      return (
        <section className="modal-dialog">
          <div className="dialog-bg" />
          <div className="dialog-content">
            {this.state.message}
            {markup}
            <section className="button-bar">
              <ul>
                <li
                  className="enabled"
                  onClick={() => this.ok()}
                >
                  <span className="button-icon fa fa-check fa-1x" />
                  <span>{this.OK_LABEL}</span>
                </li >
                { this.state.mode === 'alert'
                  ? ''
                  : (
                    <li
                      className="enabled"
                      onClick={() => this.cancel()}
                    >
                      <span className="button-icon fa fa-ban fa-1x" />
                      <span>{this.CANCEL_LABEL}</span>
                    </li >
                  )}
              </ul>
            </section>
          </div>
        </section>
      );
    }
    return null;
  }
}
