import {getPath, getUrl} from './UnifileService';
import CloudExplorer from './CloudExplorer';
import React from 'react';
import ReactDom from 'react-dom';

const STORAGE_KEY_PATH = 'CloudExplorer.path';

/**
 * Class in charge of the history and init of the main CloudExplorer component
 */
class App extends React.Component {

	static fromBlobToPath (blob) {
		return [
			blob.service,
			...blob.path.split('/').filter((file) => file !== '')
		];
	}

	constructor () {
		super();
		window.ce = this;
	}

	state = {
		extensions: [],
		onCancel: null,
		onError: null,
		onPick: null,
		path: [],
		pickFolder: false,
		selection: []
	}

	componentWillMount () {
		this.loadHistory();
	}

	onChange (path) {
		if (path !== this.state.path) {
			this.setState({
				path,
				selection: []
			});
		}
		localStorage.setItem(STORAGE_KEY_PATH, JSON.stringify(path));
	}

	onSelection (selection) {
		this.setState({
			defaultFileName: selection.length && !selection[0].isDir
				? selection[0].name
				: this.state.defaultFileName,
			selection
		});
	}

	/*
	 * //////////////////
	 * Class methods
	 * //////////////////
	 */
	hash = null;

	loadHistory () {
		const path = localStorage.getItem(STORAGE_KEY_PATH);
		if (path && path !== this.state.path) {
			this.setState({path: JSON.parse(path)});
		}
	}

	onCloudExplorerReady (cloudExplorer) {
		this.cloudExplorer = cloudExplorer || this.cloudExplorer;
	}

	createBlob (path, file) {
		return Object.assign({}, file, {
			folder: getPath(path),
			path: getPath(path.concat(file.name)),
			service: path[0],
			url: getUrl(path.concat(file.name))
		});
	}

	read (blob) {
		return this.cloudExplorer.unifile.read(this.fromBlobToPath(blob));
	}

	/*
	 * //////////////////
	 * API
	 * //////////////////
	 */
	openFile (extensions = null) {
		return new Promise((resolve, reject) => {
			this.setState({
				extensions,
				inputName: false,
				multiple: false,
				onCancel: () => resolve(null),
				onError: (e) => reject(e),
				onPick: (files) => resolve(this.createBlob(this.state.path, files[0])),
				onSave: null,
				pickFolder: false,
				selection: []
			}, () => this.cloudExplorer.ls());
		});
	}

	openFiles (extensions = null) {
		return new Promise((resolve, reject) => {
			this.setState({
				extensions,
				inputName: false,
				multiple: true,
				onCancel: () => resolve(null),
				onError: (e) => reject(e),
				onPick: (files) => resolve(files.map((file) => this.createBlob(this.state.path, file))),
				onSave: null,
				pickFolder: false,
				selection: []
			}, () => this.cloudExplorer.ls());
		});
	}

	openFolder () {
		return new Promise((resolve, reject) => {
			this.setState({
				extensions: [],
				inputName: false,
				multiple: false,
				onCancel: () => resolve(null),
				onError: (e) => reject(e),
				onPick: (files) => {
					if (files.length) {
						// Case of a selected folder in the current path
						resolve(this.createBlob(this.state.path, files[0]));
					} else if (this.state.path.length > 1) {
						// The user pressed "ok" to select the current folder
						resolve(this.createBlob(this.state.path.slice(0, -1), {
							isDir: true,
							mime: 'application/octet-stream',
							name: this.state.path[this.state.path.length - 1]
						}));
					} else {
						// Same case but for the / folder (root)
						resolve(this.createBlob(this.state.path, {
							isDir: true,
							mime: 'application/octet-stream',
							name: ''
						}));
					}
				},
				onSave: null,
				pickFolder: true,
				selection: []
			}, () => this.cloudExplorer.ls());
		});
	}

	saveAs (defaultFileName, extensions = null) {
		return new Promise((resolve, reject) => {
			this.setState({
				defaultFileName,
				extensions,
				inputName: true,
				multiple: false,
				onCancel: () => resolve(null),
				onError: (e) => reject(e),
				onPick: null,
				onSave: (fileName) => resolve(this.createBlob(this.state.path, {name: fileName})),
				pickFolder: false,
				selection: []
			}, () => this.cloudExplorer.ls());
		});
	}

	reload (extensions) {
		this.setState({extensions}, () => this.cloudExplorer.ls());
		return Promise.resolve();
	}

	getServices () {
		return this.cloudExplorer.unifile.getServices();
	}

	render () {
		return (
			<CloudExplorer
				defaultFileName={this.state.defaultFileName}
				extensions={this.state.extensions}
				inputName={this.state.inputName}
				multiple={this.state.multiple}
				onCancel={() => (this.state.onCancel ? this.state.onCancel() : '')}
				onCd={(path) => this.onChange(path)}
				onError={(e) => (this.state.onError ? this.state.onError(e) : '')}
				onPick={(selection) => (this.state.onPick ? this.state.onPick(selection) : '')}
				onSave={(fileName) => (this.state.onSave ? this.state.onSave(fileName) : '')}
				onSelection={(selection) => this.onSelection(selection)}
				path={this.state.path}
				pickFolder={this.state.pickFolder}
				ref={(c) => this.onCloudExplorerReady(c)}
				selection={this.state.selection}
			/>
		);
	}
}

ReactDom.render(
	<App />,
	document.getElementById('cloud-explorer')
);
