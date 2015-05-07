'use strict';

var expect = require('chai').expect;
var sinon = require('sinon');
var format = require('format');
var Readable = require('readable-stream/readable');
var isReadable = require('is-readable-stream');
var MockRequest = require('..');

var mock;
var src;

describe('new MockRequest()', function () {
  beforeEach(function () {
    mock = new MockRequest();
  });

  it('should return a MockRequest instance', function () {
    expect(mock).to.be.an.instanceOf(MockRequest);
  });

  it('should return a MockRequest instance when not called with "new"', function () {
    expect(MockRequest()).to.be.an.instanceOf(MockRequest); // eslint-disable-line new-cap
  });

  it('should return a readable stream', function () {
    expect(isReadable(mock)).to.be.true;
  });

  it('should not return a writable stream', function () {
    expect(mock.write).to.be.undefined;
  });

  it('should use GET as default method', function () {
    expect(mock.method).to.equal('GET');
  });

  it('should use GET when given a bogus HTTP method', function () {
    mock = new MockRequest('BOGUS');
    expect(mock.method).to.equal('GET');
  });

  it('should use "/" as default URL', function () {
    expect(mock.url).to.equal('/');
  });

  it('should use 1.1 as default HTTP version', function () {
    expect(mock.httpVersion).to.equal('1.1');
    expect(mock.httpVersionMajor).to.equal(1);
    expect(mock.httpVersionMinor).to.equal(1);
  });

  ['connection', 'socket', 'client', 'statusCode', 'statusMessage'].forEach(function (key) {
    it(format('should use null for mock.%s by default', key), function () {
      expect(mock[key]).to.be.null;
    });
  });

  ['headers', 'trailers'].forEach(function (key) {
    it(format('should use an empty object for mock.%s by default', key), function () {
      expect(mock[key]).to.be.an('object');
      expect(Object.keys(mock[key]).length).to.equal(0);
    });
  });

  ['rawHeaders', 'rawTrailers'].forEach(function (key) {
    it(format('should use an empty array for mock.%s by default', key), function () {
      expect(mock[key]).to.be.an('array');
      expect(mock[key].length).to.equal(0);
    });
  });

  it('should use the method given in the constructor', function () {
    mock = new MockRequest('post');
    expect(mock.method).to.equal('POST');
  });

  it('should use the url given in the constructor', function () {
    mock = new MockRequest('post', '/foo');
    expect(mock.url).to.equal('/foo');
  });

  it('should use the http version given in the constructor', function () {
    mock = new MockRequest('post', '/foo', {
      httpVersion: '3.5'
    });

    expect(mock.httpVersion).to.equal('3.5');
    expect(mock.httpVersionMajor).to.equal(3);
    expect(mock.httpVersionMinor).to.equal(5);
  });

  it('should use the headers given in the constructor', function () {
    mock = new MockRequest('post', '/foo', {
      headers: {
        'Content-Length': '1234'
      }
    });

    expect(mock.headers['content-length']).to.equal('1234');
    expect(mock.rawHeaders[0]).to.equal('Content-Length');
    expect(mock.rawHeaders[1]).to.equal('1234');
  });

  it('should ignore undefined headers', function () {
    mock = new MockRequest('post', '/foo', {
      headers: {
        'Content-Length': undefined
      }
    });

    expect(Object.keys(mock.headers).length).to.equal(0);
    expect(mock.rawHeaders.length).to.equal(0);
  });

  it('should set arbitrary, unreserved properties on the mock object', function () {
    mock = new MockRequest('post', '/foo', {
      foo: 'bar'
    });

    expect(mock.foo).to.equal('bar');
  });

  [['string', 'foo'], ['Buffer', new Buffer('foo')], ['null', null]].forEach(function (testData) {
    if (testData[1] !== null) {
      it(format('should treat a %s value for props.source as source data', testData[0]), function () {
        mock = new MockRequest('post', '/foo', {
          source: testData[1]
        });

        expect(mock.read(3).toString()).to.equal('foo');
      });
    }

    it(format(
      'should end the stream automatically when ' +
      'given a %s value as source data', testData[0]
    ), function (done) {
      mock = new MockRequest('post', '/foo', {
        source: testData[1]
      });

      mock.on('end', done);
      mock.resume();
    });
  });

  it('should treat a readable stream object as props.source as a source stream', function () {
    src = new Readable();
    src._read = function () {
      src.push('foo');
      src.push(null);
    };

    mock = new MockRequest('post', '/foo', {
      source: src
    });

    expect(mock.read(3).toString()).to.equal('foo');
  });
});

describe('A MockRequest instance', function () {
  it('should throw when trying to read and there is no source', function () {
    mock = new MockRequest('post');

    expect(function () {
      mock.read();
    }).to.throw();
  });

  it('should populate trailers and rawTrailers only after the stream ended', function (done) {
    mock = new MockRequest('post', '/foo', {
      trailers: {
        'Foo': 'bar'
      }
    });

    expect(mock.trailers['foo']).to.be.undefined;

    mock.once('end', function () {
      expect(mock.trailers['foo']).to.equal('bar');
      expect(mock.rawTrailers[0]).to.equal('Foo');
      expect(mock.rawTrailers[1]).to.equal('bar');
      done();
    });

    src = new Readable();
    src._read = function () {};
    src.push(null);
    mock._setSource(src);
    mock.resume();
  });

  it('should support http.IncomingMessage#setTimeout API', function (done) {
    mock = new MockRequest();
    mock.setTimeout(1, done);
  });

  ['GET', 'HEAD', 'DELETE'].forEach(function (method) {
    it(format('should end automatically when the method is %s', method), function (done) {
      mock = new MockRequest(method);
      mock.on('end', done);
      mock.resume();
    });
  });
});

describe('MockRequest#_setSource (data stream)', function () {
  beforeEach(function () {
    mock = new MockRequest('post');
    src = new Readable();
  });

  ['GET', 'HEAD', 'DELETE'].forEach(function (method) {
    it(format('should throw when the http method is %s', method), function () {
      mock = new MockRequest(method);
      expect(function () {
        mock._setSource(Object());
      }).to.throw();
    });
  });

  it('should throw when not given a readable stream object, string or Buffer', function () {
    expect(function () {
      mock._setSource(Object());
    }).to.throw();
  });

  it('should cause the instance to pass through data from the source stream (flowing mode)', function (done) {
    src._read = function () {
      src.push('foo');
      src.push(null);
    };
    mock._setSource(src);
    mock.once('data', function (chunk) {
      expect(chunk.toString()).to.equal('foo');
      done();
    });
  });

  it('should await the first read attempt before pulling data from the source stream (flowing mode)', function (done) {
    var finished = false;
    var readStub = sinon.stub(src, '_read', function () {
      if (!finished) {
        finished = true;
        src.push('foo');
        src.push(null);
      }
    });
    mock._setSource(src);

    setTimeout(function () {
      expect(readStub.callCount).to.equal(0);
      mock.resume();
      expect(readStub.callCount).to.be.at.least(1);
      done();
    }, 5);
  });

  it('should cause the instance to pass through data from the source stream (paused mode)', function () {
    src.read = function () {
      return 'foo';
    };
    mock._setSource(src);

    expect(mock.read(3).toString()).to.equal('foo');
  });

  it('should only pull data from the source stream when asked for data (paused mode)', function (done) {
    var readStub = sinon.stub(src, '_read', function () {
      src.push('foo');
      src.push(null);
    });
    mock._setSource(src);

    setTimeout(function () {
      expect(readStub.callCount).to.equal(0);
      mock.read();
      expect(readStub.callCount).to.be.at.least(1);
      done();
    }, 5);
  });
});

describe('MockRequest#_setSource (events)', function () {
  beforeEach(function () {
    src = new Readable();
    src._read = function () {};
    mock = new MockRequest('post');
    mock._setSource(src);
  });

  it('should cause the instance to pass through error events', function (done) {
    var testError = new Error('foo');
    mock.once('error', function (err) {
      expect(err).to.equal(testError);
      done();
    });
    src.emit('error', testError);
  });

  it('should cause the instance to emit "end" when the source stream ends', function (done) {
    mock.once('end', done);
    src.push(null);
    mock.resume();
  });

  it('should cause the instance to emit "close" when the source stream closes', function (done) {
    mock.once('close', done);
    src.emit('close');
  });
});
