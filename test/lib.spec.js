'use strict';

var expect = require('chai').expect;
var format = require('format');
var ReadableStream = require('stream').Readable;
var WritableStream = require('stream').Writable;
var MockRequest = require('..');

describe('new MockRequest()', function () {
  var req;

  before(function () {
    req = new MockRequest();
  });

  it('should return a MockRequest instance', function () {
    expect(req).to.be.an.instanceOf(MockRequest);
  });

  it('should return a stream.Readable instance', function () {
    expect(req).to.be.an.instanceOf(ReadableStream);
  });

  it('should return a MockRequest instance when not called with "new"', function () {
    expect(MockRequest()).to.be.an.instanceOf(MockRequest); // eslint-disable-line new-cap
  });

  it('should not return a stream.Writable instance', function () {
    expect(req).to.not.be.an.instanceOf(WritableStream);
  });

  it('should use GET as default method', function () {
    expect(req.method).to.equal('GET');
  });

  it('should use "/" as default URL', function () {
    expect(req.url).to.equal('/');
  });

  it('should use 1.1 as default HTTP version', function () {
    expect(req.httpVersion).to.equal('1.1');
    expect(req.httpVersionMajor).to.equal(1);
    expect(req.httpVersionMinor).to.equal(1);
  });

  ['connection', 'socket', 'client', 'statusCode', 'statusMessage'].forEach(function (key) {
    it(format('should use null for req.%s by default', key), function () {
      expect(req[key]).to.equal(null);
    });
  });

  ['headers', 'trailers'].forEach(function (key) {
    it(format('should use an empty object for req.%s by default', key), function () {
      expect(req[key]).to.be.an('object');
      expect(Object.keys(req[key]).length).to.equal(0);
    });
  });

  ['rawHeaders', 'rawTrailers'].forEach(function (key) {
    it(format('should use an empty array for req.%s by default', key), function () {
      expect(req[key]).to.be.an('array');
      expect(req[key].length).to.equal(0);
    });
  });

  it('should use the method given in the constructor', function () {
    req = new MockRequest('post');
    expect(req.method).to.equal('POST');
  });

  it('should use the url given in the constructor', function () {
    req = new MockRequest('post', '/foo');
    expect(req.url).to.equal('/foo');
  });

  it('should use the http version given in the constructor', function () {
    req = new MockRequest('post', '/foo', {
      httpVersion: '3.5'
    });
    expect(req.httpVersion).to.equal('3.5');
    expect(req.httpVersionMajor).to.equal(3);
    expect(req.httpVersionMinor).to.equal(5);
  });

  it('should use the headers given in the constructor', function () {
    req = new MockRequest('post', '/foo', {
      headers: {
        'Content-Length': '1234'
      }
    });
    expect(req.headers['content-length']).to.equal('1234');
    expect(req.rawHeaders[0]).to.equal('Content-Length');
    expect(req.rawHeaders[1]).to.equal('1234');
  });

  it('should ignore undefined headers', function () {
    req = new MockRequest('post', '/foo', {
      headers: {
        'Content-Length': undefined
      }
    });

    expect(Object.keys(req.headers).length).to.equal(0);
    expect(req.rawHeaders.length).to.equal(0);
  });

  it('should set arbitrary, unreserved properties on the mock object', function () {
    req = new MockRequest('post', '/foo', {
      foo: 'bar'
    });
    expect(req.foo).to.equal('bar');
  });
});

describe('A MockRequest instance', function () {
  it('should throw when trying to read when a source stream was not set', function () {
    var req = new MockRequest('post');

    expect(function () {
      req.read();
    }).to.throw();
  });

  it('should populate trailers and rawTrailers only after the stream ended', function (done) {
    var req = new MockRequest('post', '/foo', {
      trailers: {
        'Foo': 'bar'
      }
    });

    expect(req.trailers['foo']).to.be.an('undefined');

    req.once('end', function () {
      expect(req.trailers['foo']).to.equal('bar');
      expect(req.rawTrailers[0]).to.equal('Foo');
      expect(req.rawTrailers[1]).to.equal('bar');
      done();
    });

    var sourceStream = new ReadableStream();
    sourceStream._read = function () {};
    sourceStream.push(null);
    req._setSource(sourceStream);
    req.resume();
  });

  it('should support strange http.IncomingMessage#setTimeout API', function (done) {
    var req = new MockRequest();
    req.setTimeout(10, function () {
      done();
    });
  });

  ['GET', 'HEAD', 'DELETE'].forEach(function (method) {
    it(format('should end automatically when the method is %s', method), function (done) {
      var req = new MockRequest(method);
      req.on('end', done);
      req.resume();
    });
  });
});

describe('MockRequest#_setSource', function () {
  var req;
  var sourceStream;

  beforeEach(function () {
    req = new MockRequest('post');
    sourceStream = new ReadableStream();
  });

  ['GET', 'HEAD', 'DELETE'].forEach(function (method) {
    it(format('should throw when the request method is %s', method), function () {
      req = new MockRequest(method);

      expect(function () {
        req._setSource(Object());
      }).to.throw();
    });
  });

  it('should throw when not given a readable stream instance', function () {
    expect(function () {
      req._setSource(Object());
    }).to.throw();
  });

  it('should cause the instance to pipe data from the source stream', function (done) {
    sourceStream._read = function () {
      sourceStream.push('foo');
      sourceStream.push(null);
    };

    req._setSource(sourceStream);

    req.once('data', function (chunk) {
      expect(chunk.toString()).to.equal('foo');
      done();
    });
  });

  it('should cause the instance to proxy error events from the source stream', function (done) {
    var testError = new Error('foo');

    req.once('error', function (err) {
      expect(err).to.equal(testError);
      done();
    });

    sourceStream._read = function () {
      sourceStream.push('foo');
      sourceStream.push(null);
    };
    req._setSource(sourceStream);
    sourceStream.emit('error', testError);
  });

  it('should cause the instance to emit "end" when the source stream ends', function (done) {
    req.once('end', function () {
      done();
    });

    sourceStream._read = function () {};
    req._setSource(sourceStream);
    sourceStream.push(null);
    req.resume();
  });

  it('should cause the instance to emit "close" when the source stream closes', function (done) {
    req.once('close', function () {
      done();
    });

    sourceStream._read = function () {};
    req._setSource(sourceStream);
    sourceStream.emit('close');
  });
});
