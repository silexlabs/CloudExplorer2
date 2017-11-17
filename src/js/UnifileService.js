const STORAGE_KEY_LS_CACHE = 'CloudExplorer.lsCache';

const POLLING_FREQUENCY = 200;
const OK_STATUS = 200;

const nameMap = new Map();

export default class UnifileService {

	static ROOT_URL = `${window.location.origin}/`;

	currentPath = [];

	extensions = null;

	constructor (path) {
		this.currentPath = path;
	}

	setExtensions (extensions) {
		this.extensions = extensions;
	}

	static getStorageKey (path) {
		return `${STORAGE_KEY_LS_CACHE}('${path.join('/')}')`;
	}

	static write (data, path, progress = null) {
		return new Promise((resolve, reject) => {
			UnifileService.call(
				`${path[0]}/put/${path.slice(1).join('/')}`,
				(res) => resolve(res), (e) => reject(e), 'PUT', data, progress, false, true
			);
		});
	}

	static read (path) {
		return new Promise((resolve, reject, progress = null) => {
			UnifileService.call(
				`${path[0]}/get/${path.slice(1).join('/')}`,
				(res) => resolve(res), (e) => reject(e), 'GET', '', progress, true
			);
		});
	}

	static getPath (path) {
		return `${path.slice(1).join('/')}`;
	}

	static getUrl (path) {
		return `${UnifileService.ROOT_URL}${path[0]}/get/${path.slice(1).join('/')}`;
	}

	static getServices () {
		return new Promise((resolve, reject) => {
			UnifileService.call('services', (services) => {
				services.forEach((service) => {
					nameMap.set(service.name, service.displayName);
				});
				resolve(services);
			}, (e) => reject(e));
		});
	}

	ls (path = null) {
		return new Promise((resolve, reject) => {
			const pathToLs = path || this.currentPath;
			if (pathToLs.length > 0) {
				const filters = this.extensions ? `?extensions=${this.extensions.join(',')}` : '';
				UnifileService.call(`${pathToLs[0]}/ls/${pathToLs.slice(1).join('/')}${filters}`, (res) => {
					sessionStorage.setItem(this.constructor.getStorageKey(path), JSON.stringify(res));
					resolve(res);
				}, (e) => reject(e));
			} else {
				this.constructor.getServices().then((res) => {
					sessionStorage.setItem(this.constructor.getStorageKey(path), JSON.stringify(res));
					resolve(res);
				});
			}
		});
	}

	lsHasCache (path = null) {
		return Boolean(sessionStorage.getItem(this.constructor.getStorageKey(path)));
	}

	lsGetCache (path = null) {
		try {
			const cached = sessionStorage.getItem(this.constructor.getStorageKey(path));
			if (cached) {
				return JSON.parse(cached);
			}
		} catch (e) {
			console.error('Cache is unavailable');
		}
		return [];
	}

	rm (path, relative = false) {
		return new Promise((resolve, reject) => {
			const absPath = relative ? this.currentPath.concat(path) : path;
			UnifileService.call(
				`${absPath[0]}/rm/${absPath.slice(1).join('/')}`,
				(res) => resolve(res), (e) => reject(e), 'DELETE'
			);
		});
	}

	static batch (path, actions) {
		return new Promise((resolve, reject) => {
			UnifileService.call(`${path[0]}/batch/`, resolve, reject, 'POST', JSON.stringify(actions));
		});
	}

	mkdir (path, relative = false) {
		return new Promise((resolve, reject) => {
			const absPath = relative ? this.currentPath.concat(path) : path;
			UnifileService.call(
				`${absPath[0]}/mkdir/${absPath.slice(1).join('/')}`,
				(res) => resolve(res), (e) => reject(e), 'PUT'
			);
		});
	}

	rename (name, newName) {
		return new Promise((resolve, reject) => {
			const absPath = this.currentPath.concat([name]);
			const absNewPath = this.currentPath.slice(1).concat([newName]);
			UnifileService.call(
				`${absPath[0]}/mv/${absPath.slice(1).join('/')}`,
				(res) => resolve(res), (e) => reject(e),
				'PATCH',
				JSON.stringify({destination: absNewPath.join('/')})
			);
		});
	}

	cd (path) {
		return new Promise((resolve, reject) => {
			if (path.length === 1 && path[0] !== this.currentPath[0]) {
				this.auth(path[0])
				.then(() => {
					this.currentPath = path;
					resolve(this.currentPath);
				})
				.catch((e) => {
					console.error('error when trying to authenticate', e);
					reject(e);
				});
			} else {
				this.currentPath = path;
				resolve(this.currentPath);
			}
		});
	}

	upload (file, progress = null) {
		return new Promise((resolve, reject) => {
			const absPath = this.currentPath.concat([file.name]);
			this.constructor.write(file, absPath).then((response) => resolve(response))
			.catch((e) => reject(e), progress);
		});
	}

	auth (service) {
		return new Promise((resolve, reject) => {
			const req = new XMLHttpRequest();
			req.open('POST', `/${service}/authorize`, false);
			req.send();
			if (req.responseText) {
				const win = window.open(req.responseText);
				win.addEventListener('unload', () => {
					win.onunload = null;
					this.startPollingAuthWin({
						reject,
						resolve,
						service,
						win
					});
				});
			} else {
				this.authEnded(service, resolve, reject);
			}
		});
	}

	authEnded (service, resolve, reject) {
		this.ls([service])
		.then((res) => resolve(res))
		.catch((e) => reject(e));
	}

	startPollingAuthWin ({win, service, resolve, reject}) {
		if (win.closed) {
			this.authEnded(service, resolve, reject);
		} else {
			setTimeout(() => {
				this.startPollingAuthWin({
					reject,
					resolve,
					service,
					win
				});
			}, POLLING_FREQUENCY);
		}
	}

	static getJsonBody (oReq) {
		try {
			return JSON.parse(oReq.responseText);
		} catch (e) {
			console.error('an error occured while parsing JSON response', e);
			return null;
		}
	}

	/* eslint max-params: ["off"]*/
	static call (
		route, cbk, err,
		method = 'GET',
		body = '',
		progress = null,
		receiveBinary = false,
		sendBinary = false
	) {
		const oReq = new XMLHttpRequest();
		oReq.onload = function onload () {
			if (oReq.status === OK_STATUS) {
				const contentType = oReq.getResponseHeader('Content-Type');
				if (contentType && contentType.indexOf('json') >= 0) {
					const res = UnifileService.getJsonBody(oReq);
					if (res !== null) {
						cbk(res);
					}
				} else if (oReq.response === '') {
					cbk(null);
				} else if (oReq.response instanceof Blob) {
					cbk(oReq.response);
				} else {

					/*
					 * Convert to blob if needed
					 * this happens on heroku not locally
					 */
					cbk(new Blob([oReq.response.toString()]));
				}
			} else {
				// Unifile should set the error object in the response body
				const e = UnifileService.getJsonBody(oReq);
				console.error('error in the request response with status', oReq.status, e);
				err(e);
			}
		};
		oReq.onerror = function onerror (e) {
			console.error('error for the request', e);
			err(e);
		};
		if (progress !== null) {
			const dispatcher = () => {
				if (sendBinary) {
					return oReq.upload;
				}
				return oReq;
			};
			dispatcher.upload.addEventListener('progress', (e) => {
				if (e.lengthComputable) {
					const percentage = Math.round(e.loaded * 100 / e.total);
					progress(percentage);
				}
			}, false);
			dispatcher.upload.addEventListener('load', () => {
				progress(100);
			}, false);
			dispatcher.upload.addEventListener('error', () => {
				progress(0);
			}, false);
		}
		const url = `${this.ROOT_URL}${route}`;
		oReq.open(method, url);
		if (receiveBinary) {
			oReq.responseType = 'blob';
		}
		if (sendBinary) {
			const data = new FormData();
			data.append('content', body);
			oReq.send(data);
		} else {
			oReq.setRequestHeader('Content-Type', 'application/json');
			oReq.send(body);
		}
	}

	static isService (file) {
		return typeof file.isLoggedIn !== 'undefined';
	}
}
