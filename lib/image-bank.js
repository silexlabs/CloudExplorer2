const express = require('express');

// Constants
const BAD_REQUEST_STATUS = 400;
const banks = [];

// Init router
const router = new express.Router();
router.get('/image-banks/', (req, res) => {
  res.json(banks.map(({name, displayName}) => ({
    name,
    displayName
  })));
});
router.get('/image-banks/:name/random', (req, res) => {
  const {name} = req.params;
  const bank = banks.find((b) => b.name === name);
  if (!bank) {
    res.status(BAD_REQUEST_STATUS).send(`Unknown image bank ${name}`);
  } else {
    bank.random()
    .then((result) => res.json(result))
    .catch((err) => res.status(BAD_REQUEST_STATUS).send(err.message));
  }
});
router.get('/image-banks/:name', (req, res) => {
  const {query} = req.query;
  const {name} = req.params;
  if (!query /* || query.length < 2*/) {
    res.status(BAD_REQUEST_STATUS).send('Query is required');
  } else {
    const bank = banks.find((b) => b.name === name);
    if (!bank) {
      res.status(BAD_REQUEST_STATUS).send(`Unknown image bank ${name}`);
    } else {
      bank.search(query)
      .then((result) => res.json(result))
      .catch((err) => {
        res.status(BAD_REQUEST_STATUS).send(err.message);
      });
    }
  }
});

module.exports.getRouter = function () {
  return router;
};

/**
 * Add an image bank: add a route for search, use the callback to return a result for a request
 * @param router  express router
 * @param name    the name of the image bank, e.g. `unsplash`
 * @param search  the function called on each query, has to return a promise
 */
module.exports.add = function add ({name, displayName, search, random}) {
  banks.push({name,
    displayName,
    search,
    random});
};


/**
 * @return search function for the image bank
 */
module.exports.unsplash = function ({accessKey, appName, offlineTestPath}) {
  function formatUnsplashResult (json) {
    if (json.errors && json.errors.length) {
      throw new Error(json.errors.join('\n'))
    }
    const response = json.response ? json.response : json; // no idea why unsplash routes `search` and `photos` responses are diferent
    return {
      total: response.total,
      pages: response.total_pages,
      results: formatUnsplashList(response.results.response ? response.results.response : response.results),
    };
  }
  function formatUnsplashList (json) {
    return json.map((image) => ({
      name: `${image.user.name.toLowerCase().replace(/ /g, '-')}-${image.id}-unsplash.jpg`,
      isDir: false,
      mime: 'image/jpeg',
      modified: image.updated_at,
      width: image.width,
      height: image.height,
      url: image.urls.regular,
      urls: {
        big: image.urls.regular,
        small: `${image.urls.raw}&fm=jpg&q=80&w=255&fit=max`,
      },
      attribution: {
        content: `Photo by <a href="${image.user.links.html}">${image.user.name}</a> on <a href="https://unsplash.com/?utm_source=${appName}&utm_medium=referral" target="_blank">Unsplash</a>`,
        message: `Crediting isn’t required, but is appreciated and allows photographers to gain exposure. Copy the text below or <a href="https://unsplash.com/?modal={%22tag%22: %22CreditBadge%22, %22value%22: {%22userId%22: %22${image.user.id}%22}}" target="_blank">embed a credit badge</a>.`,
      },
    }));
  }
  if (offlineTestPath) {
    console.info('Unsplash: found offline test path', offlineTestPath);
    return {
      random: () => Promise.resolve(require(offlineTestPath).search)
      .then(formatUnsplashResult),
      search: (query) => Promise.resolve(require(offlineTestPath).search)
      .then(formatUnsplashResult),
    };
  }
  if (!accessKey || !appName) throw 'Unsplash bank image requires options: accessKey, appName.';
  const fetch = require('node-fetch');
  global.fetch = fetch;
  const { createApi } = require('unsplash-js');
  const unsplash = createApi({
    accessKey,
  });

  return {
    random: () => unsplash.photos.getRandom({
      count: 50,
    })
    .then((json) => ({
      total: json.length,
      pages: 1,
      results: json,
    }))
    .then(formatUnsplashResult),
    search: (query) => unsplash.search.getPhotos({
      query,
      perPage: 50,
    })
    .then(formatUnsplashResult),
  };
};

