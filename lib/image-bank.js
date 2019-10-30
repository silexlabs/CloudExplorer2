const express = require('express');

// constants
const BAD_REQUEST_STATUS = 400;
const banks = [];

// init router
const router = new express.Router();
  router.get(`/image-banks/`, (req, res) => {
    res.json(banks.map(({name, displayName}) => {return {name, displayName}}));
  });
  router.get(`/image-banks/:name/random`, (req, res) => {
    const {name} = req.params;
    const bank = banks.find(b => b.name === name);
    if(!bank) {
      res.status(BAD_REQUEST_STATUS).send('Unknown image bank ' + name);
    } else {
      bank.random()
      .then(result => res.json(result))
      .catch(err => res.status(BAD_REQUEST_STATUS).send(err.message))
    }
  });
  router.get(`/image-banks/:name`, (req, res) => {
    const {query} = req.query;
    const {name} = req.params;
    if(!query /*|| query.length < 2*/) {
      res.status(BAD_REQUEST_STATUS).send('Query is required');
    } else {
      const bank = banks.find(b => b.name === name);
      if(!bank) {
        res.status(BAD_REQUEST_STATUS).send('Unknown image bank ' + name);
      } else {
        bank.search(query)
        .then(result => res.json(result))
        .catch(err => res.status(BAD_REQUEST_STATUS).send(err.message))
      }
    }
  });

module.exports.getRouter = function() {
  return router
}

/**
 * add an image bank: add a route for search, use the callback to return a result for a request
 * @param router  express router
 * @param name    the name of the image bank, e.g. `unsplash`
 * @param search  the function called on each query, has to return a promise
 */
module.exports.add = function add({name, displayName, search, random}) {
  banks.push({name, displayName, search, random});
}


/**
 * @return search function for the image bank
 */
module.exports.unsplash = function({ accessKey, appName, offlineTestPath }) {
  function formatUnsplashResult(json) {
    return {
      total: json.total,
      pages: json.total_pages,
      results: formatUnsplashList(json.results),
    }
  }
  function formatUnsplashList(json) {
    return json.map(image => {return {
      name: `${image.user.name.toLowerCase().replace(/ /g, '-')}-${image.id}-unsplash.jpg`,
      isDir: false,
      mime: 'image/jpeg',
      modified: image.updated_at,
      width: image.width,
      height: image.height,
      url: image.urls.regular,
      urls: {
        big: image.urls.regular,
        small: image.urls.raw + '&fm=jpg&q=80&w=255&fit=max',
      },
      attribution: `Photo by <a href="${image.user.links.html}">${image.user.name}</a> on <a href="https://unsplash.com/?utm_source=${appName}&utm_medium=referral">Unsplash</a>`,
    }});
  }
  if(offlineTestPath) {
    console.info('Unsplash: found offline test path', offlineTestPath)
    return {
      random: () => Promise.resolve(require(offlineTestPath).search.results)
        .then(formatUnsplashList),
      search: (query) => Promise.resolve(require(offlineTestPath).search)
        .then(formatUnsplashResult),
    };
  }
  if(!accessKey || !appName) throw 'Unsplash bank image requires options: accessKey, appName.';
  const fetch = require('node-fetch');
  global.fetch = fetch;
  const Unsplash = require('unsplash-js').default;
  const {toJson} = require('unsplash-js');
  const unsplash = new Unsplash({ accessKey })
  return {
    random: () => unsplash.photos.listPhotos(1, 50)
      .then(toJson)
      .then(formatUnsplashList),
    search: (query) => unsplash.search.photos(query, 1, 50)
      .then(toJson)
      .then(formatUnsplashResult),
  };
}

