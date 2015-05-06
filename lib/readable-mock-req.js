'use strict';

var httpMethods = require('methods');
var Readable = require('readable-stream/readable');
var inherits = require('util').inherits;

function populateObjArr(srcObj, destObj, destArr) {
  Object.keys(srcObj).forEach(function (key) {
    var val = srcObj[key];
    if (val !== undefined) {
      val += '';
      destObj[key.toLowerCase()] = val;
      destArr.push(key);
      destArr.push(val);
    }
  });
}

function canHaveBody(mock) {
  return ['GET', 'HEAD', 'DELETE'].indexOf(mock.method) === -1;
}

var HTTP_VERSION_REGEXP = /^(\d+)\.(\d+)$/;

/**
 * @constructor
 * @param {string} [method=GET] HTTP method
 * @param {url} [url=/] URL
 * @param {object} [props={}] Additional properties, like `headers`
 */
function MockRequest(method, url, props) {
  if (!(this instanceof MockRequest)) {
    return new MockRequest(method, url, props);
  }

  var mock = this;

  Readable.call(mock);

  mock.connection = mock.socket = mock.client = mock.statusCode = mock.statusMessage = null;

  props = props || {};

  Object.keys(props).forEach(function (key) {
    mock[key] = props[key];
  });

  mock.url = url || '/';

  if (typeof method === 'string' && method) {
    mock.method = method.toUpperCase();
  }
  if (!mock.method || httpMethods.indexOf(mock.method.toLowerCase()) === -1) {
    mock.method = 'GET';
  }

  var ver = props.httpVersion;
  var verMatch = typeof ver === 'string' ? ver.match(HTTP_VERSION_REGEXP) : null;
  if (verMatch === null) {
    mock.httpVersion = '1.1';
    mock.httpVersionMajor = mock.httpVersionMinor = 1;
  } else {
    mock.httpVersionMajor = parseInt(verMatch[1], 10);
    mock.httpVersionMinor = parseInt(verMatch[2], 10);
  }

  mock.headers = {};
  mock.rawHeaders = [];
  populateObjArr(props.headers || {}, mock.headers, mock.rawHeaders);

  mock.trailers = {};
  mock.rawTrailers = [];
  function populateTrailersOnEnd() {
    if (props.trailers) {
      mock.trailers = {};
      mock.rawTrailers = [];
      populateObjArr(props.trailers, mock.trailers, mock.rawTrailers);
    }
  }

  if (!canHaveBody(mock)) {
    mock.push(null);
    populateTrailersOnEnd();
  } else {
    mock.once('end', populateTrailersOnEnd);
  }
}

inherits(MockRequest, Readable);

/**
 * See [http.IncomingMessage#setTimeout](https://nodejs.org/api/http.html#http_message_settimeout_msecs_callback)
 */
MockRequest.prototype.setTimeout = function (msecs, callback) {
  setTimeout(callback, msecs);
};

/**
 * Set the source stream, the mock will pass through all data and events
 *
 * @param {object} src Readable stream
 */
MockRequest.prototype._setSource = function (src) {
  var mock = this;

  if (!canHaveBody(mock)) {
    throw new Error('Cannot pipe data into a GET/HEAD/DELETE mock request');
  }

  if (!(src instanceof Readable)) {
    throw new TypeError('source must be a readable stream');
  }

  mock._read = function (size) {
    mock.push(src.read(size));
  };

  function onClose() {
    mock.emit('close');
    endStream();
  }

  function onError(err) {
    mock.emit('error', err);
    endStream();
  }

  function endStream() {
    src.removeListener('end', endStream);
    src.removeListener('close', onClose);
    src.removeListener('error', onError);
  }

  src.once('end', endStream);
  src.once('close', onClose);
  src.once('error', onError);
};

module.exports = MockRequest;
