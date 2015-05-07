'use strict';

var httpMethods = require('methods');
var Readable = require('readable-stream/readable');
var isReadable = require('is-readable-stream');
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

  if (props.source !== undefined) {
    mock._setSource(props.source);
  }
}

inherits(MockRequest, Readable);

/**
 * See
 * [http.IncomingMessage#setTimeout](https://nodejs.org/api/http.html#http_message_settimeout_msecs_callback)
 */
MockRequest.prototype.setTimeout = function (msecs, callback) {
  setTimeout(callback, msecs);
};

/**
 * Set the source, the mock will pass through all data and events. When using a source stream, do
 * not override `_read()`!
 *
 * @param {object|string|Buffer} src Readable stream, string or Buffer
 */
MockRequest.prototype._setSource = function (src) {
  var mock = this;

  if (!canHaveBody(mock)) {
    throw new Error('Cannot pipe data into a GET/HEAD/DELETE request mock');
  }

  if (src === null || typeof src === 'string' || Buffer.isBuffer(src)) {
    if (src !== null) {
      mock.push(src);
    }
    return mock.push(null);
  } else if (!isReadable(src)) {
    throw new TypeError('src must be a string, Buffer or readable stream');
  }

  // Await first read attempt on the mock
  var waiting = false;
  var listeningOnReadable = false;

  mock._read = function () {
    var buf;
    var reads = 0;
    var interrupted = waiting = false;
    // Read as much as we can get from the source until the mock's buffer is full
    while ((buf = src.read()) !== null) {
      reads++;
      if (!mock.push(buf)) {
        interrupted = true;
        break;
      }
    }

    if (reads === 0 && !interrupted) {
      waiting = true;

      if (!listeningOnReadable) {
        listeningOnReadable = true;
        src.on('readable', onReadable);
      }
    }
  };

  function onReadable() {
    // Do nothing when nobody asked for the data
    if (waiting) {
      mock._read();
    }
  }

  function onEnd() {
    mock.push(null);
    removeListeners();
  }

  function onClose() {
    mock.push(null);
    mock.emit('close');
    removeListeners();
  }

  function onError(err) {
    mock.emit('error', err);
    removeListeners();
  }

  function removeListeners() {
    src.removeListener('readable', onReadable);
    src.removeListener('end', onEnd);
    src.removeListener('close', onClose);
    src.removeListener('error', onError);
  }

  src.once('end', onEnd);
  src.once('close', onClose);
  src.once('error', onError);
};

module.exports = MockRequest;
