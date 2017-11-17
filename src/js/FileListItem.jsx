import ModalDialog from './ModalDialog';
import PropTypes from 'prop-types';
import React from 'react';
import UnifileService from './UnifileService';

export default class FileListItem extends React.Component {
	static propTypes = {
		children: PropTypes.string.isRequired,
		downloadUrl: PropTypes.string.isRequired,
		file: PropTypes.shape({name: PropTypes.string.isRequired}).isRequired,
		onDelete: PropTypes.func.isRequired,
		onRename: PropTypes.func.isRequired,
		path: PropTypes.arrayOf(PropTypes.string).isRequired
	}

	static getClassName (file, isService, mime) {
		const className = (() => {
			if (file.upload) {
				return ' fa-gear';
			} else if (file.isDir || isService) {
				return ' folder';
			}
			return ' file';
		})();

		return `icon${className}${file.isLoggedIn
			? ' loggedin'
			: ''
		}${mime ? ` ${mime}` : ''}`;
	}

	CONFIRMATION_MESSAGE = 'Are you sure you want to delete this file?';

	CONFIRMATION_FILENAME = 'This file is about to be deleted: ';

	DOWNLOAD_LABEL = 'Download';

	DELETE_LABEL = 'Delete';

	RENAME_LABEL = 'Rename';

	delete () {
		ModalDialog.getInstance().confirm(
			<section>
				<h2>{this.CONFIRMATION_MESSAGE}</h2>
				<p>{this.CONFIRMATION_FILENAME}</p><p><strong>{ this.props.file.name }</strong></p>
			</section>,
			this.props.onDelete
		);
	}

	rename () {
		this.props.onRename();
	}

	render () {
		const {file} = this.props;
		const isService = UnifileService.isService(file);
		this.allowDownload = !file.upload && this.props.path.length > 0 && !file.isDir && !isService;
		this.allowDelete = !file.upload && this.props.path.length > 0 && !isService;
		this.allowRename = !file.upload && this.props.path.length > 0 && !isService;
		const mime = isService
			? ' application json'
			: file.mime && file.mime.replace(/\//g, ' ');
		return (
			<section className={
				`file-list-item${
					file.upload ? ` uploading progress-${file.upload.progress}` : ''}`
			}
			>
				<i className={this.constructor.getClassName(file, isService, mime)} />
				<label>{this.props.children}</label>
				<ul className="inline-button-bar">
					<li>{
						this.allowDownload
							? (
								<a
									className={this.allowDelete ? 'enabled' : 'disabled'}
									href={this.props.downloadUrl}
									target="_blank"
								>{this.DOWNLOAD_LABEL}
								</a>
							)
							: ''
					}
					</li>
					<li
						className={this.allowDelete ? 'enabled' : 'disabled'}
						onClick={() => this.allowDelete && this.delete()}
					>{this.DELETE_LABEL}
					</li>
					<li
						className={this.allowRename ? 'enabled' : 'disabled'}
						onClick={() => this.allowRename && this.rename()}
					>{this.RENAME_LABEL}
					</li>
				</ul>
			</section>);
	}
}
