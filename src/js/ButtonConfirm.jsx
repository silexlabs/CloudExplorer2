import PropTypes from 'prop-types';
import React from 'react';

export default class ButtonConfirm extends React.Component {
  static propTypes = {
    defaultFileName: PropTypes.string,
    inputName: PropTypes.bool,
    onCancel: PropTypes.func.isRequired,
    onPick: PropTypes.func,
    onSave: PropTypes.func.isRequired,
    path: PropTypes.arrayOf(PropTypes.string),
    pickFolder: PropTypes.bool.isRequired,
    selection: PropTypes.arrayOf(PropTypes.object).isRequired
  }

  static defaultProps = {
    defaultFileName: null,
    inputName: false
  }

  constructor () {
    super();
    this.input = {};
  }

  componentWillReceiveProps (newProps) {
    if (this.input && newProps.defaultFileName !== this.props.defaultFileName) {
      this.input.value = newProps.defaultFileName;
    }
  }

  OK_LABEL = 'Ok';

  CANCEL_LABEL = 'Cancel';

  // Select folder with click on the folder
  isSelectingDir () {
    return this.props.selection.length &&
      this.props.pickFolder === this.props.selection[0].isDir;
  }

  isInASelectableDir () {
    // Select folder with enter the folder and click ok
    return this.props.selection.length === 0 &&
      this.props.pickFolder &&
      this.props.path &&
      this.props.path.length > 0;
  }

  isInputNameValid () {
    // Input file name / save as
    return this.props.inputName &&
      this.props.defaultFileName &&
      this.props.defaultFileName.length > 0;
  }

  render () {
    this.allowPick =
      this.isSelectingDir() ||
      this.isInASelectableDir() ||
      this.isInputNameValid();

    return (
      <section className="button-confirm button-bar">
        {
          this.props.inputName ? (
            <div>
              <input
                autoFocus
                defaultValue={this.props.defaultFileName}
                onChange={(e) => {
                  if (e.target.value.length > 0) {
                    this.pickBtn.classList.add('enabled');
                    this.pickBtn.classList.remove('disabled');
                  } else {
                    this.pickBtn.classList.remove('enabled');
                    this.pickBtn.classList.add('disabled');
                  }
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') this.props.onSave(e.target.value);
                }}
                placeholder="File name"
                ref={(c) => {
                  this.input = c;
                }}
                type="text"
              />
            </div>)
            : <div />
        }
        <ul>
          <li
            className={
              this.allowPick || (this.props.inputName && this.input.value.length) ? 'enabled' : 'disabled'
            }
            onClick={() => {

              /*
               * Pick the selection or the current folder
               * For the current folder, we call `onPick([]);`
               */
              if (this.props.inputName) this.props.onSave(this.input.value);
              else if (this.allowPick) {
                this.props.onPick(this.props.selection);
              }
            }}
            ref={(c) => {
              this.pickBtn = c;
            }}
          >
            <span className="button-icon fa fa-check fa-1x" />
            <span>{this.OK_LABEL}</span>
          </li>
          <li
            className="enabled"
            onClick={() => this.props.onCancel()}
          >
            <span className="button-icon fa fa-ban fa-1x" />
            <span>{this.CANCEL_LABEL}</span>
          </li>
        </ul>
      </section>);
  }
}
