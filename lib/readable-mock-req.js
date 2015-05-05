'use strict';

var httpMethods = require('methods');
var ReadableStream = require('stream').Readable;
var inherits = require('util').inherits;

function populateObjArr(sourceObj, destObj, destArr) {
  Object.keys(sourceObj).forEach(function (key) {
    var val = sourceObj[key];
    if (val !== undefined) {
      val += '';
      destObj[key.toLowerCase()] = val;
      destArr.push(key);
      destArr.push(val);
    }
  });
}

function canHaveBody(req) {
  return ['GET', 'HEAD', 'DELETE'].indexOf(req.method) === -1;
}

var HTTP_VERSION_REGEXP = /^(\d+)\.(\d+)$/;

/**
 * @constructor
 * @param {string} [method=GET] HTTP method
 * @param {string} [url=/] URL
 * @param {object} [props={}] Additional properties, like `headers`
 */
function MockRequest(method, url, props) {
  if (!(this instanceof MockRequest)) {
    return new MockRequest(method, url, props);
  }

  var self = this;

  ReadableStream.call(this);

  this.connection = this.socket = this.client = this.statusCode = this.statusMessage = null;

  props = props || {};

  Object.keys(props).forEach(function (key) {
    self[key] = props[key];
  });

  this.url = url || '/';

  if (typeof method === 'string' && method) {
    this.method = method.toUpperCase();
  }
  if (!this.method || httpMethods.indexOf(this.method.toLowerCase()) === -1) {
    this.method = 'GET';
  }

  var ver = props.httpVersion;
  var verMatch = typeof ver === 'string' ? ver.match(HTTP_VERSION_REGEXP) : null;
  if (verMatch === null) {
    this.httpVersion = '1.1';
    this.httpVersionMajor = this.httpVersionMinor = 1;
  } else {
    this.httpVersionMajor = parseInt(verMatch[1], 10);
    this.httpVersionMinor = parseInt(verMatch[2], 10);
  }

  this.headers = {};
  this.rawHeaders = [];
  populateObjArr(props.headers || {}, this.headers, this.rawHeaders);

  this.trailers = {};
  this.rawTrailers = [];
  function populateTrailersOnEnd() {
    self.trailers = {};
    self.rawTrailers = [];
    populateObjArr(props.trailers || {}, self.trailers, self.rawTrailers);
  }

  if (!canHaveBody(this)) {
    this.push(null);
    populateTrailersOnEnd();
  } else {
    this.once('end', populateTrailersOnEnd);
  }
}

inherits(MockRequest, ReadableStream);

/**
 * [http.IncomingMessage#setTimeout](https://nodejs.org/api/http.html#http_message_settimeout_msecs_callback)
 */
MockRequest.prototype.setTimeout = function (msecs, callback) {
  setTimeout(callback, msecs);
};

/**
 * [stream.Readable#_read](https://nodejs.org/api/stream.html#stream_readable_read_size_1)
 */
MockRequest.prototype._read = function () {
  throw new Error('Method not implemented: MockRequest#_read');
};

/**
 * Set a source readable stream, data and events will be proxied
 *
 * @param {object} source Readable stream
 */
MockRequest.prototype._setSource = function (source) {
  var self = this;

  if (!canHaveBody(this)) {
    throw new Error('Cannot pipe data into a GET/HEAD/DELETE mock request');
  }

  if (!(source instanceof ReadableStream)) {
    throw new TypeError('source must be a readable stream');
  }

  this._read = function (size) {
    this.push(source.read(size));
  };

  function onClose() {
    self.emit('close');
    endStream();
  }

  function onError(err) {
    self.emit('error', err);
    endStream();
  }

  function endStream() {
    source.removeListener('end', endStream);
    source.removeListener('close', onClose);
    source.removeListener('error', onError);
  }

  source.once('end', endStream);
  source.once('close', onClose);
  source.once('error', onError);
};

module.exports = MockRequest;
