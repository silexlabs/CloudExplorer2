import React from 'react';
import ReactDom from 'react-dom';

export default class ButtonConfirm extends React.Component {
  componentWillReceiveProps(newProps) {
    if(this.input && newProps.defaultFileName !== this.props.defaultFileName) {
      this.input.value = newProps.defaultFileName;
    }
  }
  render() {
    this.allowPick = 
      // select folder with click on the folder
      (this.props.selection.length &&
      this.props.pickFolder === this.props.selection[0].isDir) ||
      // select folder with enter the folder and click ok
      (this.props.selection.length === 0 &&
      this.props.pickFolder === true &&
      this.props.path.length > 0) ||
      // input file name / save as
      (this.props.inputName && this.props.defaultFileName && this.props.defaultFileName.length > 0);
    return <section className="button-confirm button-bar">
      {
        this.props.inputName ? <div>
          <input type="text"
            ref={c=>this.input=c}
            onKeyPress={e => {
              if(e.key === 'Enter')
                this.props.onSave(e.target.value);
            }}
            onChange={e => {
              if(e.target.value.length > 0) {
                this.pickBtn.classList.add('enabled');
                this.pickBtn.classList.remove('disabled');
              }
              else {
                this.pickBtn.classList.remove('enabled');
                this.pickBtn.classList.add('disabled');
              }
            }}
            placeholder="File name"
            autoFocus
            defaultValue={this.props.defaultFileName}
          />
        </div> : <div></div>
      }
      <ul>
        <li ref={c=>this.pickBtn=c}
          onClick={(e) => {
            if(this.props.inputName) this.props.onSave(this.input.value);
            // pick the selection or the current folder 
            // for the current folder, we call `onPick([]);`
            else if(this.allowPick) this.props.onPick(this.props.selection)
          }}
          className={
            this.allowPick || (this.props.inputName && this.input.value.length) ? "enabled" : "disabled"
          }
        >
          <span className="button-icon fa fa-check fa-1x"></span>
	  <span>Ok</span>
	</li>
        <li onClick={(e) => this.props.onCancel()} className="enabled">
          <span className="button-icon fa fa-ban fa-1x"></span>
	  <span>Cancel</span>
	</li>
      </ul>
    </section>;
  }
}
