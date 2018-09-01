# CloudExplorer2

Manage your users' cloud services from your application.

![screenshot from 2017-10-04 11-09-53](https://user-images.githubusercontent.com/715377/31186578-a357a146-a8f4-11e7-8650-f95d16f643b0.png)


## Install

```
$ npm i
$ npm run build
```

This will compile the JS files from `src/` with [ReactJS](https://facebook.github.io/react/) and [Babel](https://babeljs.io/). The generated files will go in `dist/`.

You can serve `dist` on `http://localhost:6805` with

```
$ npm start
```

And then access the demo app on `http://localhost:6805/ce/cloud-explorer/`

This is what is done on heroku here: [a live demo](https://cloud-explorer2.herokuapp.com/ce/cloud-explorer/)

## Use

For a complete example see the dist folder.

On the client side, the HTML:

```html
<iframe id="ceIFrame" class="container" src="/ce/cloud-explorer/cloud-explorer.html" />
```

And the Javascript:

```javascript
const ce = document.querySelector('#ceIFrame').contentWindow.ce;
ce.openFile(['.jpg', '.jpeg', '.png', '.gif'])
.then(fileInfo => {
    if(fileInfo) alert('you chose:' + fileInfo.path);
    else alert('you canceled');
})
.catch(e => alert('an error occured: ' + e.message));
```

## Docs

Please feel free to ask in the issues, and contribute docs in the wiki.

For now, the best way to know the API is to [take a look at the `App` class which exposes all CE methods here](https://github.com/silexlabs/CloudExplorer2/blob/master/src/js/App.js#L77).

