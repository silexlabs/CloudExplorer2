import PropTypes from 'prop-types';
import React from 'react';
import UnifileService from './UnifileService';

export default class KeyboardNav extends React.Component {
	static propTypes = {
		files: PropTypes.arrayOf(PropTypes.object).isRequired,
		onCancel: PropTypes.func.isRequired,
		onChange: PropTypes.func.isRequired,
		onEnter: PropTypes.func.isRequired,
		onPick: PropTypes.func.isRequired,
		selection: PropTypes.arrayOf(PropTypes.object).isRequired
	}

	constructor () {
		super();
		window.addEventListener('keydown', (event) => {
			switch (event.code) {
				case 'ArrowDown':
					if (this.props.selection.length > 0) {
						const idx = this.props.files.findIndex((file) => file.name === this.props.selection[0].name);
						if (idx + 1 < this.props.files.length) {
							this.props.onChange([this.props.files[idx + 1]]);
						}
					} else {
						this.props.onChange([this.props.files[0]]);
					}
					break;
				case 'ArrowUp':
					if (this.props.selection.length > 0) {
						const idx = this.props.files.findIndex((file) => file.name === this.props.selection[0].name);
						if (idx - 1 >= 0) {
							this.props.onChange([this.props.files[idx - 1]]);
						}
					} else {
						this.props.onChange([this.props.files.length - 1]);
					}
					break;
				case 'Enter': {
					const [file] = this.props.selection;
					if (file && (file.isDir || UnifileService.isService(file))) {
						this.props.onEnter(file);
					} else if (this.props.selection.length > 0) {
						this.props.onPick(this.props.selection);
					}
					// Do not handle the key event (it may be used by save as dialog)
					return;
				}
				case 'Escape':
					this.props.onCancel();
					break;
				default:
					// Do not handle the key event
					return;
			}
			// Consume the event to avoid it being handled twice
			event.preventDefault();
		}, true);
	}

	render () {
		return <div />;
	}
}
