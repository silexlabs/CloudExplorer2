import React from 'react';
import ReactDom from 'react-dom';

export default class FilesDropZone extends React.Component {
  componentDidMount() {
    document.body.addEventListener("dragover", e => {
      e.stopPropagation();
      e.preventDefault();
      this.div.classList.add('show-drop-zone');
    }, false);
    document.body.addEventListener("dragenter", e => {
      e.stopPropagation();
      e.preventDefault();
      this.div.classList.add('show-drop-zone');
    }, false);
    document.body.addEventListener("dragleave", e => {
      e.stopPropagation();
      e.preventDefault();
      this.div.classList.remove('show-drop-zone');
    }, false);
    document.body.addEventListener("drop", e => {
      e.stopPropagation();
      e.preventDefault();
      this.div.classList.remove('show-drop-zone');
      const files = e.dataTransfer.files;
      this.onDrop(files);
    }, false);
  }
  /**
   * converts the FileList object into an array
   * then calls the onDrop prop
   */
  onDrop(files) {
    const fileArray = [];
    for(let idx=0; idx < files.length; idx++) fileArray.push(files[idx]);
    this.props.onDrop(fileArray);
  }
  render() {
    return <div
      ref={c => this.div = c}
      onClick={e => this.input.click()}
    >
      <input
        ref={c => this.input = c}
        type="file" multiple style={{display:"none"}}
        onChange={e => this.onDrop(e.target.files)}
      />
      Drop files here!
      Or click here to select files
    </div>;
  }
}
