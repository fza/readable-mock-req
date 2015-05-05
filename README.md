# http.IncomingMessage mock

[![Build Status](https://travis-ci.org/fza/readable-mock-req.svg)](https://travis-ci.org/fza/readable-mock-req) [![Coverage Status](https://coveralls.io/repos/fza/readable-mock-req/badge.svg?branch=master)](https://coveralls.io/r/fza/readable-mock-req?branch=master) [![Dependency Status](https://david-dm.org/fza/readable-mock-req.svg)](https://david-dm.org/fza/readable-mock-req) [![devDependency Status](https://david-dm.org/fza/readable-mock-req/dev-status.svg)](https://david-dm.org/fza/readable-mock-req#info=devDependencies)

[![NPM](https://nodei.co/npm/readable-mock-req.png)](https://npmjs.org/package/readable-mock-req)

Yet another [`http.IncomingMessage`](https://nodejs.org/api/http.html#http_http_incomingmessage) mock that inherits `stream.Readable` and is not a writable stream. It tries to simulate IncomingMessage as close as possible by:

* validating and setting uppercased `method` (defaults to GET),
* ensuring there is a `url` (defaults to `/`),
* populating `headers` and `rawHeaders` as expected,
* populating `trailers` and `rawTrailers` after the `end` event
* ending the readable stream automatically when the method is GET/HEAD/DELETE.

To pipe data into the mock object, either override `mock._read()` (and use `mock.push()` etc.) or use `mock._setSource(readableStream)`. Data will then be piped and events (`end`, `close`, `error`) will be proxied from the source stream.

## Installation

```shell
npm install --save-dev readable-mock-req
```

## API

<!-- START docme generated API please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN docme TO UPDATE -->

<div>
<div class="jsdoc-githubify">
<section>
<article>
<div class="container-overview">
<dt>
<h4 class="name" id="MockRequest"><span class="type-signature"></span>new MockRequest<span class="signature">(<span class="optional">method</span>, <span class="optional">url</span>, <span class="optional">props</span>)</span><span class="type-signature"></span></h4>
</dt>
<dd>
<h5>Parameters:</h5>
<table class="params">
<thead>
<tr>
<th>Name</th>
<th>Type</th>
<th>Argument</th>
<th>Default</th>
<th class="last">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td class="name"><code>method</code></td>
<td class="type">
<span class="param-type">string</span>
</td>
<td class="attributes">
&lt;optional><br>
</td>
<td class="default">
GET
</td>
<td class="description last"><p>HTTP method</p></td>
</tr>
<tr>
<td class="name"><code>url</code></td>
<td class="type">
<span class="param-type">string</span>
</td>
<td class="attributes">
&lt;optional><br>
</td>
<td class="default">
/
</td>
<td class="description last"><p>URL</p></td>
</tr>
<tr>
<td class="name"><code>props</code></td>
<td class="type">
<span class="param-type">object</span>
</td>
<td class="attributes">
&lt;optional><br>
</td>
<td class="default">
{}
</td>
<td class="description last"><p>Additional properties, like <code>headers</code></p></td>
</tr>
</tbody>
</table>
<dl class="details">
<dt class="tag-source">Source:</dt>
<dd class="tag-source"><ul class="dummy">
<li>
<a href="https://github.com/fza/readable-mock-req/blob/master/readable-mock-req.js">readable-mock-req.js</a>
<span>, </span>
<a href="https://github.com/fza/readable-mock-req/blob/master/readable-mock-req.js#L31">lineno 31</a>
</li>
</ul></dd>
</dl>
</dd>
</div>
<dl>
<dt>
<h4 class="name" id="_read"><span class="type-signature"></span>_read<span class="signature">()</span><span class="type-signature"></span></h4>
</dt>
<dd>
<div class="description">
<p><a href="https://nodejs.org/api/stream.html#stream_readable_read_size_1">stream.Readable#_read</a></p>
</div>
<dl class="details">
<dt class="tag-source">Source:</dt>
<dd class="tag-source"><ul class="dummy">
<li>
<a href="https://github.com/fza/readable-mock-req/blob/master/readable-mock-req.js">readable-mock-req.js</a>
<span>, </span>
<a href="https://github.com/fza/readable-mock-req/blob/master/readable-mock-req.js#L99">lineno 99</a>
</li>
</ul></dd>
</dl>
</dd>
<dt>
<h4 class="name" id="_setSource"><span class="type-signature"></span>_setSource<span class="signature">(source)</span><span class="type-signature"></span></h4>
</dt>
<dd>
<div class="description">
<p>Set a source readable stream, data and events will be proxied</p>
</div>
<h5>Parameters:</h5>
<table class="params">
<thead>
<tr>
<th>Name</th>
<th>Type</th>
<th class="last">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td class="name"><code>source</code></td>
<td class="type">
<span class="param-type">object</span>
</td>
<td class="description last"><p>Readable stream</p></td>
</tr>
</tbody>
</table>
<dl class="details">
<dt class="tag-source">Source:</dt>
<dd class="tag-source"><ul class="dummy">
<li>
<a href="https://github.com/fza/readable-mock-req/blob/master/readable-mock-req.js">readable-mock-req.js</a>
<span>, </span>
<a href="https://github.com/fza/readable-mock-req/blob/master/readable-mock-req.js#L108">lineno 108</a>
</li>
</ul></dd>
</dl>
</dd>
<dt>
<h4 class="name" id="setTimeout"><span class="type-signature"></span>setTimeout<span class="signature">()</span><span class="type-signature"></span></h4>
</dt>
<dd>
<div class="description">
<p><a href="https://nodejs.org/api/http.html#http_message_settimeout_msecs_callback">http.IncomingMessage#setTimeout</a></p>
</div>
<dl class="details">
<dt class="tag-source">Source:</dt>
<dd class="tag-source"><ul class="dummy">
<li>
<a href="https://github.com/fza/readable-mock-req/blob/master/readable-mock-req.js">readable-mock-req.js</a>
<span>, </span>
<a href="https://github.com/fza/readable-mock-req/blob/master/readable-mock-req.js#L92">lineno 92</a>
</li>
</ul></dd>
</dl>
</dd>
</dl>
</article>
</section>
</div>

*generated with [docme](https://github.com/thlorenz/docme)*
</div>
<!-- END docme generated API please keep comment here to allow auto update -->

## Contributing

Take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using `grunt test`.

## License

Copyright (c) 2015 [Felix Zandanel](mailto:felix@zandanel.me)  
Licensed under the MIT license.

See LICENSE for more info.
