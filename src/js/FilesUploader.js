import React from 'react';
import ReactDom from 'react-dom';

export default class FilesUploader extends React.Component {
  state = {
    progress: {},
  }
  loaders = []
  getIdForFile(file) {
    return file.name + file.size;
  }
  removeFile(file) {
    this.loaders[this.getIdForFile(file)] = 'done';
  }
  componentWillReceiveProps(nextProps) {
    nextProps.files.forEach(file => {
      if(!this.loaders[this.getIdForFile(file)]) {
        this.props.upload(file, percent => {
          const progress = this.state.progress;
          progress[this.getIdForFile(file)] = percent;
          this.setState({
            progress: progress,
          })
        }, () => {
          this.removeFile(file);
        }, e => {
          // TODO: display the error's text to the user
          console.error('Error uploading file', file, e);
          this.removeFile(file);
          const progress = this.state.progress;
          progress[this.getIdForFile(file)] = -1;
          this.setState({
            progress: progress,
          })
        });
        this.loaders[this.getIdForFile(file)] = 'in-progress';
      }
    });
  }
  render() {
    const list = this.props.files.map(file => {
      return <li
        className={
          `progress-${Math.round(this.state.progress[this.getIdForFile(file)] / 10)}
           ${this.loaders[this.getIdForFile(file)]}`
        }
        key={this.getIdForFile(file)}
      >
        {file.name}
      </li>;
    });
    return <ul>{list}</ul>;
  }
}
