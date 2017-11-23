jest.dontMock('react');
jest.dontMock('react-dom');
jest.dontMock('react-addons-test-utils');

jest.unmock('../src/js/UnifileService');

const UnifileService = require('../src/js/UnifileService').default;

const OK_STATUS = 200;

describe('UnifileService', () => {
  it('ls success', async () => {
    const jsonObject = [
      {
        bytes: 1234,
        isDir: false,
        modified: '2016-05-07T22:10:31',
        name: 'README.md'
      },
      {
        isDir: true,
        modified: '2016-05-07T22:10:31',
        name: 'test'
      }
    ];
    Object.defineProperty(XMLHttpRequest.prototype, 'responseText', {
      get () {
        return JSON.stringify(jsonObject);
      }
    });
    Object.defineProperty(XMLHttpRequest.prototype, 'status', {
      get () {
        return OK_STATUS;
      }
    });
    XMLHttpRequest.prototype.open = jest.fn(function open () {
      this.onload();
    });
    XMLHttpRequest.prototype.getResponseHeader = jest.fn((header) => {
      if (header.toLowerCase() === 'content-type') return 'application/json';
      return '';
    });
    const srv = new UnifileService('http://localhost:8080/dist/');
    await srv.ls(['ftp'])
    .catch((e) => {
      fail(`There has been an error: ${e.message}`);
    })
    .then((data) => {
      expect(data).toEqual(jsonObject);
    });
  });
  it('ls error', async () => {
    XMLHttpRequest.prototype.open = jest.fn(function open () {
      this.onerror({});
    });
    const srv = new UnifileService('http://localhost:8080/dist/');
    await srv.ls('ftp')
    .then(() => fail('There should have been an error'))
    .catch((e) => expect(e).not.toBe(null));
  });
  afterEach(() => {
    XMLHttpRequest.prototype.open.mockClear();
  });
});
