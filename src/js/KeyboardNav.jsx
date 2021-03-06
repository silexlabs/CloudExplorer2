import PropTypes from 'prop-types';
import React from 'react';

export default class KeyboardNav extends React.Component {
  static propTypes = {
    files: PropTypes.arrayOf(PropTypes.object).isRequired,
    unifile: PropTypes.object.isRequired,
    onCancel: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
    onEnter: PropTypes.func.isRequired,
    onPick: PropTypes.func.isRequired,
    selection: PropTypes.arrayOf(PropTypes.object).isRequired
  }

  componentDidMount () {
    window.addEventListener('keydown', this.keyDownCbk, true);
  }

  componentWillUnmount () {
    window.removeEventListener('keydown', this.keyDownCbk, true);
  }

  constructor () {
    super();
    this.keyDownCbk = (event) => this.keyDown(event);
  }

  keyDown (event) {
    const sourceTagName = event.target.tagName.toLowerCase();
    if (sourceTagName === 'input' || sourceTagName === 'textarea') {
      return;
    }
    switch (event.code) {
      case 'ArrowDown':
      case 'ArrowRight':
        if (this.props.selection.length > 0) {
          const idx = this.props.files.findIndex((file) => file.name === this.props.selection[0].name);
          if (idx + 1 < this.props.files.length) {
            this.props.onChange([this.props.files[idx + 1]]);
          }
        } else {
          this.props.onChange([this.props.files[0]]);
        }
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        if (this.props.selection.length > 0) {
          const idx = this.props.files.findIndex((file) => file.name === this.props.selection[0].name);
          if (idx - 1 >= 0) {
            this.props.onChange([this.props.files[idx - 1]]);
          }
        } else {
          this.props.onChange([this.props.files.length - 1]);
        }
        break;
      case 'Enter': {
        const [file] = this.props.selection;
        if (file && (file.isDir || this.props.unifile.isService(file))) {
          this.props.onEnter(file);
        } else if (this.props.selection.length > 0) {
          this.props.onPick(this.props.selection);
        } else if (this.props.pickFolder) {
          this.props.onPick(this.props.selection);
        }
        // Do not handle the key event (it may be used by save as dialog)
        return;
      }
      case 'Escape':
        this.props.onCancel();
        break;
      default:
      // Do not handle the key event
        return;
    }
    // Consume the event to avoid it being handled twice
    event.preventDefault();
  }

  render () {
    return <div />;
  }
}
