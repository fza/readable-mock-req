# http.IncomingMessage mock

[![Build Status](https://travis-ci.org/fza/readable-mock-req.svg)](https://travis-ci.org/fza/readable-mock-req) [![Coverage Status](https://coveralls.io/repos/fza/readable-mock-req/badge.svg?branch=master)](https://coveralls.io/r/fza/readable-mock-req?branch=master) [![Dependency Status](https://david-dm.org/fza/readable-mock-req.svg)](https://david-dm.org/fza/readable-mock-req) [![devDependency Status](https://david-dm.org/fza/readable-mock-req/dev-status.svg)](https://david-dm.org/fza/readable-mock-req#info=devDependencies)

[![NPM](https://nodei.co/npm/readable-mock-req.png)](https://npmjs.org/package/readable-mock-req)

Yet another [`http.IncomingMessage`](https://nodejs.org/api/http.html#http_http_incomingmessage) mock that is only a readable stream, not a writable stream. It tries to simulate IncomingMessage as close as possible by:

* validating and setting uppercased `method` (defaults to GET),
* ensuring there is a `url` (defaults to `/`),
* populating `headers` and `rawHeaders` as expected,
* populating `trailers` and `rawTrailers` after the `end` event
* ending the readable stream automatically when the method is GET/HEAD/DELETE.

Data can be piped into the request mock by either providing `props.source` (String, Buffer, Readable Stream), calling `_setSource()` with any of the aforementioned data types, or by using the usual suspects (`_read()`, `read()`, `push()`, `unshift()`).

Before passing through data from a source stream, the mock awaits the first read attempt, then periodically pulls as much as it can and as much the mock's buffer can handle, never more. Creating a mock and passing a source stream, then destroying the mock, creating another and setting the same source there without any actual read attempts will not cause any data to be pulled from the source.

readable-mock-req supports Streams3 API via [readable-stream ~v1.1.0](https://github.com/iojs/readable-stream).

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
<span class="param-type">url</span>
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
<a href="https://github.com/fza/readable-mock-req/blob/tmp1/readable-mock-req.js">readable-mock-req.js</a>
<span>, </span>
<a href="https://github.com/fza/readable-mock-req/blob/tmp1/readable-mock-req.js#L32">lineno 32</a>
</li>
</ul></dd>
</dl>
</dd>
</div>
<dl>
<dt>
<h4 class="name" id="_setSource"><span class="type-signature"></span>_setSource<span class="signature">(src)</span><span class="type-signature"></span></h4>
</dt>
<dd>
<div class="description">
<p>Set the source, the mock will pass through all data and events. When using a source stream, do
not override <code>_read()</code>!</p>
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
<td class="name"><code>src</code></td>
<td class="type">
<span class="param-type">object</span>
|
<span class="param-type">string</span>
|
<span class="param-type">Buffer</span>
</td>
<td class="description last"><p>Readable stream, string or Buffer</p></td>
</tr>
</tbody>
</table>
<dl class="details">
<dt class="tag-source">Source:</dt>
<dd class="tag-source"><ul class="dummy">
<li>
<a href="https://github.com/fza/readable-mock-req/blob/tmp1/readable-mock-req.js">readable-mock-req.js</a>
<span>, </span>
<a href="https://github.com/fza/readable-mock-req/blob/tmp1/readable-mock-req.js#L110">lineno 110</a>
</li>
</ul></dd>
</dl>
</dd>
<dt>
<h4 class="name" id="setTimeout"><span class="type-signature"></span>setTimeout<span class="signature">()</span><span class="type-signature"></span></h4>
</dt>
<dd>
<div class="description">
<p>See
<a href="https://nodejs.org/api/http.html#http_message_settimeout_msecs_callback">http.IncomingMessage#setTimeout</a></p>
</div>
<dl class="details">
<dt class="tag-source">Source:</dt>
<dd class="tag-source"><ul class="dummy">
<li>
<a href="https://github.com/fza/readable-mock-req/blob/tmp1/readable-mock-req.js">readable-mock-req.js</a>
<span>, </span>
<a href="https://github.com/fza/readable-mock-req/blob/tmp1/readable-mock-req.js#L100">lineno 100</a>
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
