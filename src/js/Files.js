import React from 'react';
import ReactDom from 'react-dom';

export default class Files extends React.Component {
  static DBLCLICK_DELAY_MS = 300;
  lastClickedEl = null
  lastClickedTime = Date.now();
  isDoubleClick(element) {
    const now = Date.now();
    if(element === this.lastClickedEl && now - this.lastClickedTime < Files.DBLCLICK_DELAY_MS) {
      this.lastClickedEl = null;
      return true;
    }
    this.lastClickedEl = element;
    this.lastClickedTime = now;
    return false;
  }
  select(e) {
    const file = this.props.files[parseInt(e.target.getAttribute('data-idx'))];
    if(this.isDoubleClick(e.target)) {
      if(file.is_dir) this.props.onEnter(file);
      else this.props.onPick(file);
    }
    else {
      const selection = e.ctrlKey ? this.props.selection : [];
      this.props.onChange(selection.concat(file));
    }
    e.preventDefault();
    e.stopPropagation();
  }
  render() {
    // each file has the extension in its export default class name
    let idx = 0;
    let dotIdx;
    const list = this.props.files.map(file => <li
      data-idx={idx++}
      key={file.name}
      onClick={(e) => this.select(e)}
      className={(this.props.selection.includes(file) ? 'selected' : '') + ' ' + (file.is_dir ? 'folder' : 'file') + ' ' + ((dotIdx = file.name.lastIndexOf('.')) > 0 ? file.name.substr(dotIdx + 1) : 'no-ext')}>
      {file.name}
    </li>);
    return <section><ul className="files">{list}</ul></section>;
  }
}
