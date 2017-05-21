import React from 'react';
import ReactDom from 'react-dom';
import ModalDialog from './ModalDialog';
import UnifileService from './UnifileService';

export default class KeyboardNav extends React.Component {
  constructor() {
    super();
    window.addEventListener("keydown", event => {
      switch (event.code) {
        case "ArrowDown":
          if(this.props.selection.length > 0) {
            const idx = this.props.files.findIndex(file => file.name === this.props.selection[0].name);
            if(idx + 1 < this.props.files.length) {
              this.props.onChange([this.props.files[idx + 1]]);
            }
          }
          else {
            this.props.onChange([this.props.files[0]]);
          }
        break;
        case "ArrowUp":
          if(this.props.selection.length > 0) {
            const idx = this.props.files.findIndex(file => file.name === this.props.selection[0].name);
            if(idx - 1 >= 0) {
              this.props.onChange([this.props.files[idx - 1]]);
            }
          }
          else {
            this.props.onChange([this.props.files.length - 1]);
          }
        break;
        case "Enter":
          const file = this.props.selection[0];
          if(file && (file.isDir || UnifileService.isService(file))) {
            this.props.onEnter(file);
          }
          else if(this.props.selection.length > 0) {
            this.props.onPick(this.props.selection);
          }
          else return; // do not handle the key event
        break;
        case "Escape":
          this.props.onCancel();
        break;
        default:
        return; // do not handle the key event
      }
      // Consume the event to avoid it being handled twice
      event.preventDefault();
    }, true);
  }
  render() {
    return <div />;
  }
}
