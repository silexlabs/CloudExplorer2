import React from 'react';
import ReactDom from 'react-dom';

export default class ButtonConfirm extends React.Component {
  render() {
    this.allowPick = (this.props.path.length > 0 &&
      this.props.selection.length &&
      this.props.pickFolder === this.props.selection[0].isDir) ||
      (this.props.inputName && this.props.defaultFileName && this.props.defaultFileName.length > 0);
    return <section className="button-confirm">
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
          />
        </div> : <div></div>
      }
      <ul>
        <li ref={c=>this.pickBtn=c}
          onClick={(e) => {
            if(this.props.inputName) this.props.onSave(this.input.value);
            else if(this.allowPick) this.props.onPick(this.props.selection[0])
          }}
          className={
            this.allowPick || (this.props.inputName && this.input.value.length) ? "enabled" : "disabled"
          }
        >Ok</li>
        <li onClick={(e) => this.props.onCancel()} className="enabled">Cancel</li>
      </ul>
    </section>;
  }
}
