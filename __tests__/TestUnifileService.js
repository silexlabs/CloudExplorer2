jest.dontMock('react')
jest.dontMock('react-dom')
jest.dontMock('react-addons-test-utils')

jest.unmock('../src/js/UnifileService');


describe('UnifileService', () => {
  it('ls success', async () => {
    const jsonObject = [{
      "bytes": 1234,
      "modified": "2016-05-07T22:10:31",
      "name": "README.md",
      "isDir": false
    }, {
      "modified": "2016-05-07T22:10:31",
      "name": "test",
      "isDir": true
    }];
    Object.defineProperty(XMLHttpRequest.prototype, 'responseText', {
      get: function() {
        return JSON.stringify(jsonObject);
      }
    });
    XMLHttpRequest.prototype.open = jest.fn(function(method, url) {
      this.onload();
    });
    const UnifileService = require('../src/js/UnifileService').default;
    const srv = new UnifileService('http://localhost:8080/dist/');
    await srv.ls('ftp')
      .then(data => expect(data).toEqual(jsonObject))
      .catch(e => fail(`There has been an error: ${e}`));
  });
  it('ls error', async () => {
    const jsonObject = {
      "success": true,
      "files": []
    };
    XMLHttpRequest.prototype.open = jest.fn(function(method, url) {
      this.onerror({});
    });
    const UnifileService = require('../src/js/UnifileService').default;
    const srv = new UnifileService('http://localhost:8080/dist/');
    await srv.ls('ftp')
      .then(data => fail(`There should have been an error`))
      .catch(e => expect(e).not.toBe(null))
  });
  afterEach(() => {
    XMLHttpRequest.prototype.open.mockClear();
  });
});
