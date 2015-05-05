# http.IncomingMessage() mock

[![Build Status](https://travis-ci.org/fza/readable-mock-req.png)](https://travis-ci.org/fza/readable-mock-req) [![Coverage Status](https://coveralls.io/repos/fza/readable-mock-req/badge.png?branch=master)](https://coveralls.io/r/fza/readable-mock-req?branch=master) [![Dependency status](https://david-dm.org/fza/readable-mock-req/status.png)](https://david-dm.org/fza/readable-mock-req#info=dependencies&view=table) [![Dev Dependency Status](https://david-dm.org/fza/readable-mock-req/dev-status.png)](https://david-dm.org/fza/readable-mock-req#info=devDependencies&view=table)

[`http.IncomingMessage`](https://nodejs.org/api/http.html#http_http_incomingmessage) mock that inherits `stream.Readable` and is not a writable stream. It tries to simulate IncomingMessage as close as possible,

* validating and setting uppercased `method`,
* setting URL (defaults to `/`),
* populating `headers` and `rawHeaders` as expected,
* populating `trailers` and `rawTrailers` after the `end` event.

To pipe data into the mock object, either override `mock._read()` or use `mock._setSource(readableStream)`. Data will be piped and events (`end`, `close`, `error`) will be proxied from the source stream.

## Contributing

Take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using `grunt test`.

## License

Copyright (c) 2015 [Felix Zandanel](mailto:felix@zandanel.me)  
Licensed under the MIT license.

See LICENSE for more info.

