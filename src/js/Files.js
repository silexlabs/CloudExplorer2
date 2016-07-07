import React from 'react';
import ReactDom from 'react-dom';

export default class Files extends React.Component {
  select(e) {
    const selection = e.ctrlKey ? this.props.selection : [];
    const file = this.props.files[parseInt(e.target.getAttribute('data-idx'))];
    this.props.onChange(selection.concat(file));
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
      className={(this.props.selection.includes(file) ? 'selected' : '') + ' ' + (file.is_dir ? 'folder' : 'file') + ' ' + (dotIdx = file.name.lastIndexOf('.') > 0 ? file.name.substr(dotIdx + 1) : 'no-ext')}>
      {file.name}
    </li>);
    return <section><ul className="files">{list}</ul></section>;
  }
}
