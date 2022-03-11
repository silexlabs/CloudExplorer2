import PropTypes from 'prop-types';
import React from 'react';

export default class ButtonBar extends React.Component {
  static propTypes = {
    onCreateFolder: PropTypes.func.isRequired,
    onReload: PropTypes.func.isRequired,
    onThumbnailMode: PropTypes.func.isRequired,
    thumbnailMode: PropTypes.bool.isRequired,
    path: PropTypes.arrayOf(PropTypes.string).isRequired
  }

  CREATE_BUTTON_LABEL = 'Create Folder';

  RELOAD_BUTTON_LABEL = 'Reload';

  THUMBS_LABEL = 'Icons';

  NO_THUMBS_LABEL = 'List';

  render () {
    this.allowCreateFolder = this.props.path.length > 0;
    this.allowReload = this.props.path.length > 0;
    return (
        <section className="button-bar">
            <ul>
                <li
                  className={this.allowCreateFolder ? 'enabled' : 'disabled'}
                  onClick={() => this.allowCreateFolder && this.props.onCreateFolder()}
          >
                    <span className="button-icon fa-stack">
                        <span className="fa fa-folder-o fa-stack-1x" />
                        <span className="fa fa-plus-circle badge fa-stack-1x" />
                    </span>
                    <span>{this.CREATE_BUTTON_LABEL}</span>
                </li>
                <li
                  className={this.allowReload ? 'enabled' : 'disabled'}
                  onClick={() => this.allowReload && this.props.onReload()}
          >
                    <span className="button-icon fa fa-refresh fa-1x" />
                    <span>{this.RELOAD_BUTTON_LABEL}</span>
                </li>
                <li
                  className={this.props.thumbnailMode ? 'enabled' : 'disabled'}
                  onClick={() => this.props.onThumbnailMode(false) }
          >
                    <span className="button-icon fa fa-th-list fa-1x" />
                    <span>{this.NO_THUMBS_LABEL}</span>
                </li>
                <li
                  className={!this.props.thumbnailMode ? 'enabled' : 'disabled'}
                  onClick={() => this.props.onThumbnailMode(true) }
          >
                    <span className="button-icon fa fa-th fa-1x" />
                    <span>{this.THUMBS_LABEL}</span>
                </li>
            </ul>
        </section>);
  }
}
