import '@babel/polyfill';

/**
 * Endpoint of the API is defined by the router
 * It depends where the router is "attached"
 * It can be found in ".." of the cloud-explorer.html
 * /abc/def/cloud-explorer/cloud-explorer.html => /abc/def/
 */
export const ROOT_URL = `${window.location.href
.split('/')
.slice(0, -2)
.join('/')}/`;


