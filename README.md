# CloudExplorer2

Manage your users' cloud services from your application.

![screenshot from 2017-10-04 11-09-53](https://user-images.githubusercontent.com/715377/31186578-a357a146-a8f4-11e7-8650-f95d16f643b0.png)

There is [a live demo here](https://demo.cloud-explorer.org/ce/cloud-explorer/)

## Install

```
$ npm install --save cloud-explorer
```

## Use

Here is an example on how to use Cloud Explorer's router to expose an API used by the front end to list files, read and write - [see this file for a complete example](https://github.com/silexlabs/CloudExplorer2/blob/main/lib/index.js)

```js
// before this create an express application

const CloudExplorer = require('cloud-explorer');

const router = new Router({
  dropbox: {
    clientId: '8lxz0i3aeztt0im',
    clientSecret: 'twhvu6ztqnefkh6',
    redirectUri: `${rootUrl}/ce/dropbox/oauth_callback`,
    state: 'abcd'
  },
  ftp: {redirectUri: `${rootUrl}/ce/ftp/signin`},
});

app.use('/ce', router);
```

There is also an [example of use in Silex website builder here](https://github.com/silexlabs/Silex/blob/develop/dist/server/CloudExplorerRouter.js).

And here is an easy way to run a local ftp for tests: `npx ftp-srv ftp://0.0.0.0:2121 --root .`

### Client side

For a complete example see the dist folder.

On the client side, the HTML:

```html
<iframe id="ceIFrame" class="container" src="/ce/cloud-explorer/cloud-explorer.html" />
```

And the Javascript:

```javascript
const ce = document.querySelector('#ceIFrame').contentWindow.ce;
ce.showThumbnails(true);
ce.openFile(['.jpg', '.jpeg', '.png', '.gif'])
.then(fileInfo => {
    if(fileInfo) alert('you chose:' + fileInfo.path);
    else alert('you canceled');
})
.catch(e => alert('an error occured: ' + e.message));
```

In order to know what are the possible options, please [read the code](./src/js/App.jsx)

### Server side config

When creating CE2 router, your app can pass it options, please see the example in `lib/index.js`. This is how you are supposed to enable or disable cloud services, or features.

Also you can add custom services and image banks, for this you can use the methods of the Router class: `addService` and `addImageBank`.

Notes:

* if you enable only one service, CE2 will be in "single service" mode and the user will not be presented the list of services but directly enters the only service (if logged in).

### API

You can use only CE2 API, it makes Dropbox, FTP, SFTP, Webdav protocols accessible over HTTPS

| Method | Path | Params | Description | Example |
| -- | -- | -- | -- | -- |
| GET | `/services` |  | List all installed services (Dropbox, FTP...) | `curl 'http://localhost:6805/ce/services'` returns `[{"isDir":true,"isService":true,"mime":"application/json","name":"github","isLoggedIn":false,"isOAuth":true,"displayName":"GitHub","icon":"../assets/github.png","description":"Edit files from your GitHub repository."},{"isDir":true,"isService":true,"mime":"application/json","name":"dropbox","isLoggedIn":false,"isOAuth":true,"displayName":"Dropbox","icon":"../assets/dropbox.png","description":"Edit files from your Dropbox."},{"isDir":true,"isService":true,"mime":"application/json","name":"ftp","isLoggedIn":false,"isOAuth":false,"displayName":"FTP","icon":"../assets/ftp.png","description":"Edit files on a web FTP server."},{"isDir":true,"isService":true,"mime":"application/json","name":"fs","isLoggedIn":true,"isOAuth":false,"username":"lexoyo","displayName":"Your Computer","icon":"","description":"Edit files on your local drive."}]` |
| POST | `/:connector/authorize` | Connector name (dropbox, ftp, sftp, webdav...) | Get the URL to redirecto the user to for oauth flow | `` |
| POST | `/:connector/logout` | Connector name | Logout | `` |
| GET | `/\/(.*)\/ls\/(.*)/` | Connector name, path | List folder content | `curl 'http://localhost:6805/ce/ftp/ls/' -H 'UNIFILE_FTP_HOST: localhost' -H 'UNIFILE_FTP_TOKEN: demo' -H 'UNIFILE_FTP_PORT: 2121' -H 'UNIFILE_FTP_USER: demo'` returns `[{"size":0,"modified":"2001-03-01T12:30:00.000Z","name":"upload","isDir":true,"mime":"application/directory"},{"size":0,"modified":"2022-12-01T23:00:00.000Z","name":"download","isDir":true,"mime":"application/directory"}]` |
| GET  | `/\/(.*)\/get\/(.*)/` | Connector name, path | Get the content of a file | `curl 'http://localhost:6805/ce/ftp/get/path/to/test.png' -H 'UNIFILE_FTP_HOST: localhost' -H 'UNIFILE_FTP_TOKEN: demo' -H 'UNIFILE_FTP_PORT: 2121' -H 'UNIFILE_FTP_USER: demo'
` returns the content of test.png |
| POST  | `/\/(.*)\/upload\/(.*)/` | Connector name, path | Upload file(s) to the server | `curl 'http://localhost:6805/ce/ftp/upload/' -X POST -H 'UNIFILE_FTP_HOST: localhost' -H 'UNIFILE_FTP_PASSWORD: demo' -H 'UNIFILE_FTP_TOKEN: nothing' -H 'UNIFILE_FTP_PORT: 2121' -H 'UNIFILE_FTP_USER: demo'  -H 'Content-Type: multipart/form-data; boundary=---------------------------2814941533969992343925519265' --data-binary $'-----------------------------2814941533969992343925519265\r\nContent-Disposition: form-data; name="content"; filename="croix.svg"\r\nContent-Type: image/svg+xml\r\n\r\n-----------------------------2814941533969992343925519265--\r\n'` |
| DELETE | `/\/(.*)\/rm\//` | Connector name, files to delete | Delete file(s) | `curl 'http://localhost:6805/ce/ftp/rm/' -X DELETE -H 'Content-Type: application/json' -H 'UNIFILE_FTP_HOST: localhost' -H 'UNIFILE_FTP_PASSWORD: demo' -H 'UNIFILE_FTP_TOKEN: nothing' -H 'UNIFILE_FTP_PORT: 2121' -H 'UNIFILE_FTP_USER: demo' --data-binary '[{"name":"unlink","path":"tmp/croix.svg"}]'` |
| PUT  |  |  | mkdir |  |
| GET  | `\/(.*)\/stat\/(.*)/` |  |  |  |
| TODO  |  |  |  |  |
| TODO  |  |  |  |  |
| TODO  |  |  |  |  |
| TODO  |  |  |  |  |
| TODO  |  |  |  |  |
| TODO  |  |  |  |  |
| TODO  |  |  |  |  |

#### Cookies or headers

Authentication uses cookie session or can be set from headers. The headers starting with `UNIFILE_` are recognized and expected to be `UNIFILE_{connector}_{key}_{value}`, e.g. `curl 'http://localhost:6805/ce/ftp/ls/' -H 'UNIFILE_FTP_HOST: localhost' -H 'UNIFILE_FTP_TOKEN: demo' -H 'UNIFILE_FTP_PORT: 21' -H 'UNIFILE_FTP_USER: demo'`


## Dev setup

To contribute to Cloud Explorer, clone this repo and build:

```
$ git clone github:silexlabs/CloudExplorer2
$ cd CloudExplorer2
$ npm i
$ npm run build
```

This will compile the JS files from `src/` with [ReactJS](https://facebook.github.io/react/) and [Babel](https://babeljs.io/). The generated files will go in `dist/`.

You can serve `dist` on `http://localhost:6805` with

```
$ npm start
```

And then access the demo app on `http://localhost:6805/ce/cloud-explorer/`

## Docs

Please feel free to ask in the issues, and contribute docs in the wiki.

For now, the best way to know the API is to [take a look at the `App` class which exposes all CE methods here](https://github.com/silexlabs/CloudExplorer2/blob/main/src/js/App.jsx#L106).

## Env vars

CE is configured with environment variables:

| Name | Default | Description |
| -- | -- | -- |
| PORT | 6805 | |
| SERVER_PATH | '' | Example: '/a-path' |
| SERVER_URL | http://localhost:${port}${rootPath} | |
| DROPBOX_APP_ID | undefined | |
| DROBOX_APP_SECRET | undefined | |
| DROPBOX_APP_REDIRECT | undefined | |
| GITHUB_APP_ID | undefined | |
| GITHUB_APP_SECRET | undefined | |
| GITHUB_APP_REDIRECT | undefined | |
| UNSPLASH_ACCESS_KEY | undefined | |
| UNSPLASH_APP_NAME | undefined | |
| UNSPLASH_OFFLINE_TEST_PATH | undefined | |
| ENABLE_HYPERDRIVE | undefined | "true" or anything else |

