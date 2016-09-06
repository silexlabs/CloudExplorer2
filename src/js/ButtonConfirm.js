import React from 'react';
import ReactDom from 'react-dom';
import ModalDialog from './ModalDialog';

export default class ButtonConfirm extends React.Component {
  render() {
    this.allowPick = this.props.path.length > 0 && this.props.selection.length === 1 && this.props.pickFolder === this.props.selection[0].is_dir;
    this.allowEnter = this.props.path.length > 0 && this.props.selection.length === 1 && this.props.selection[0].is_dir;
    this.allowUp = this.props.path.length > 0 && this.props.path.length > 0;
    return <section className="button-confirm">
      <ul>
        <li onClick={(e) => this.allowPick && this.props.onPick(this.props.selection[0])} className={this.allowPick ? "enabled" : "disabled"}>Ok</li>
        <li onClick={(e) => this.allowEnter && this.props.onEnter(this.props.selection[0])} className={this.allowEnter ? "enabled" : "disabled"}>Enter</li>
        <li onClick={(e) => this.allowUp && this.props.onUp(this.props.selection[0])} className={this.allowUp ? "enabled" : "disabled"}>Up</li>
        <li onClick={(e) => this.props.onCancel()} className="enabled">Cancel</li>
      </ul>
    </section>;
  }
}
