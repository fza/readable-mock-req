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

function setupLazyPipe(mock, src) {
  // Await first read attempt on the mock
  var expectingMoreData = false;
  var listeningOnReadable = false;

  mock._read = function () {
    var buf;
    var reads = 0;
    var interrupted = false;

    // Read as much as we can get from the source until the mock's buffer is full
    while ((buf = src.read()) !== null) {
      reads++;
      if (!mock.push(buf)) {
        interrupted = true;
        break;
      }
    }

    expectingMoreData = false;

    if (reads === 0 && !interrupted) {
      expectingMoreData = true;

      if (!listeningOnReadable) {
        listeningOnReadable = true;
        src.on('readable', onReadable);
      }
    }
  };

  function onReadable() {
    // Do nothing when nobody asked for the data
    if (expectingMoreData) {
      mock._read();
    }
  }

  function onEnd() {
    mock.push(null);
    populateTrailers(mock);
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
}

function consumeSourceStream(mock, src, cb) {
  mock._read = function () {};

  var length = 0;

  function onData(buf) {
    length += buf.length;
    mock.push(buf);  // Potentially push beyond high water mark
  }

  function onEnd(err) {
    mock.push(null);
    setContentLengthHeader(mock, length);
    populateTrailers(mock);

    src.removeListener('data', onData);
    src.removeListener('end', onEnd);
    src.removeListener('error', onEnd);

    if (typeof cb === 'function') {
      cb(err || null, length);
    }
  }

  src.on('data', onData);
  src.once('end', onEnd);
  src.once('error', onEnd);
}

function setContentLengthHeader(mock, length) {
  if (!mock.headers['content-length']) {
    length = '' + length;
    mock.headers['content-length'] = length;
    mock.rawHeaders.push('Content-Length');
    mock.rawHeaders.push(length);
  }
}

function populateTrailers(mock) {
  if (mock._trailers) {
    mock.trailers = {};
    mock.rawTrailers = [];
    populateObjArr(mock._trailers, mock.trailers, mock.rawTrailers);
  }
}

var HTTP_VERSION_REGEXP = /^(\d+)\.(\d+)$/;

/**
 * @constructor
 * @param {string} [method=GET] HTTP method
 * @param {url} [url=/] URL
 * @param {object} [props={}] Additional properties, like `headers` or `source`
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

  mock._trailers = props.trailers;
  mock.trailers = {};
  mock.rawTrailers = [];

  if (!canHaveBody(mock)) {
    mock.push(null);
  }

  if (props.source !== undefined && canHaveBody(mock)) {
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
 * Set the source data or stream
 *
 * @param {object|string|Buffer|null} src Source, stream or static data
 * @param {function|boolean} [cb] Pass true or a callback fn and all data from the source stream
 *   will be pulled upfront, having the Content-Length header set accordingly, if there is no such
 *   header already. Signature: `fn(err, length)`, where `err` is any potential Error as emitted by
 *   the source stream. `length` is provided in any case and shows how much data has been read.
 */
MockRequest.prototype._setSource = function (src, cb) {
  var mock = this;

  if (!canHaveBody(mock)) {
    throw new Error('Cannot pipe data into a GET/HEAD/DELETE request mock');
  }

  if (mock._hasDataSource) {
    throw new Error('Cannot set another data source');
  }

  var srcIsNull = src === null;
  var srcIsBuffer = !srcIsNull && Buffer.isBuffer(src);
  if (srcIsNull || typeof src === 'string' || srcIsBuffer) {
    mock._hasDataSource = true;
    mock._read = function () {};

    var length = 0;
    if (!srcIsNull) {
      if (!srcIsBuffer) {
        src = new Buffer(src);
      }
      length = src.length;
    }

    setContentLengthHeader(mock, length);

    return process.nextTick(function () {
      if (!srcIsNull) {
        mock.push(src);
      }

      populateTrailers(mock);
      mock.push(null);
    });
  }

  if (!isReadable(src)) {
    throw new TypeError('src (props.source) must be a string, Buffer, null or readable stream');
  }

  mock._hasDataSource = true;

  if (typeof cb === 'function' || cb === true) {
    return consumeSourceStream(mock, src, cb);
  }

  setupLazyPipe(mock, src);
};

module.exports = MockRequest;
