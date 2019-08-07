import PropTypes from 'prop-types';
import React from 'react';

export default class FilesDropZone extends React.Component {
  static propTypes = {onDrop: PropTypes.func.isRequired}

  componentDidMount () {
    document.body.addEventListener('dragover', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.div.classList.add('show-drop-zone');
    }, false);
    document.body.addEventListener('dragenter', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.div.classList.add('show-drop-zone');
    }, false);
    document.body.addEventListener('dragleave', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.div.classList.remove('show-drop-zone');
    }, false);
    document.body.addEventListener('drop', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.div.classList.remove('show-drop-zone');
      const {files} = e.dataTransfer;
      this.onDrop(files);
    }, false);
  }

  DROP_LABEL = 'Drop files here! Or click here to select files';

  /*
   * Converts the FileList object into an array
   * then calls the onDrop prop
   */
  onDrop (files) {
    const fileArray = [];
    for (let idx = 0; idx < files.length; idx++) {
      fileArray.push(files[idx]);
    }
    this.props.onDrop(fileArray);
  }

  render () {
    return (
      <div
        className={`upload button${this.props.disabled ? ' disabled' : ''}`}
        onClick={() => this.input.click()}
        ref={(c) => (this.div = c)}
      >
        <input
          disabled={this.props.disabled}
          multiple
          onChange={(e) => this.onDrop(e.target.files)}
          ref={(c) => (this.input = c)}
          style={{display: 'none'}}
          type="file"
        />
        {this.DROP_LABEL}
      </div>
    );
  }
}
