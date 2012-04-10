
# revised console

C bindings to syslog and a fast, more feature-rich console module.

## Install

    $ npm install rconsole

## Examples

### Basic

By default your syslogs will land in `/var/log/messages`. Add a new `facility` where your syslog configuration is located to change this. (see notes)

```js

require('rconsole')
console.set({ facility: 'local0', title: 'basic' })
console.log('hello world')
```

### Express App Example

Here is an example webserver that pipes `express.logger` to the stream for notice severity logs. It includes `development` and `production` configuration. Create a new file called `app.js` with the following code:

```js

require('rconsole')

var express = require('express')
  , app = express.createServer()

app.use(express.favicon())

app.configure(function () {
  console.set({
    facility: 'local0'
    , title: 'express'
    , syslogHashTags: true
  })
})

app.configure('production', function () {

  // any options passed to console.set in a subsequent call
  // will override the previous values and reconnect to syslog
  console.set({highestLevel: 'notice', stderr: false})

})

// pass in the stream to console.notice
app.use(express.logger({ stream: console.stream('notice') })) 

app.get('/', function (req, res, next) {
  res.end('hello world')
})

app.listen(3000)

console.notice('Server running on port 3000')

```
Start the server

    $ node app.js

And then visit http://localhost:3000/ and express.logger will be streaming to `console.notice` in your terminal as well as syslog.

To disable the stderr stream, start the app with `NODE_ENV=production` and then `tail -f /var/log/path/to/logFile` to monitor the logs

    $ NODE_ENV=production node app.js

### Full Configuration Example

```js

require('rconsole')

console.set({
  facility: 'local0'      // default: user
  , title: 'web-01'       // default: node -- can also be set with `process.title`
  , highestLevel: 'debug'  // [emerg, alert, crit, err, warning, notice, info, debug]
  , stdout: false         // default: false
  , stderr: true          // default: true
  , syslog: true          // default: true
  , syslogHashTags: false // default: false
  , showTime: true        // default: true 
  , showLine: true        // default: true
  , showFile: true        // default: true
  , showTags: true        // default: true
})

console.emerg('level 0')

console.alert('level 1')

console.crit('level 2')

console.error('level 3')

console.warn('level 4')

console.notice('level 5')

console.info('level 6')
console.log('level 6')

console.debug('level 7', { hello: 'world' })
console.trace('level 7')
console.dir({ 'level 7': { 'deep': { 'level': { 'inspect': true } } } }, true, 5)
console.time('level 7')
console.timeEnd('level 7')

```

## api

### console.set(options)
* `facility` change the facility (syslog, default: user)
* `title` change the title of the process (syslog, default: node)
* `showLine` automatically add line numbers (default: true)
* `showFile` automatically add file names (default: true)
* `showTime` automatically add timestamps (default: true)
* `syslogHashTags` automatically append hashtags for log analyzation (syslog, default: false)
* `highestLevel` limit the display based on severity (default: debug)
* `showTags` add tags with colors (stderr/stdout, default: true)
* `stderr` use stderr (default: true) 
* `stdout` use stdout (default: false)
* `syslog` use syslog bindings (default: true)

### methods
* console.stream(level)
* console.emerg
* console.alert
* console.crit
* console.error
* console.warn
* console.notice
* console.info, console.log
* console.debug
* console.trace
* console.dir
* console.time
* console.timeEnd

## Notes

The default configuration is suited for development, however you should immediately set up configuration for syslog and choose a facility (local0-local7) that is not already in use on your system.

By default your syslogs will land in `/var/log/messages` with facility `user` and tag `node`. Configure a new `facility` in `/etc/rsyslog.conf`, `/etc/syslog-ng/syslog-ng.conf`, `/etc/syslog-ng.conf` or wherever your syslog configuration is located.

### rsyslog

For rsyslog your configuration might look something like this:

```
  local0.notice    /var/log/node/production.log
  local0.info      /var/log/node/staging.log
  local0.debug     /var/log/node/debug.log
```

### stderr & stdout
`rconsole` provides display features and is a drop in replacement for the native `console` module. `console` will come with a number of options that you can `console.set` (see the api)

If you completely disable stderr/stdout you can just tail your syslogs.

### Motivation

The aim of this module is to provide an interface to `syslog.h` based on the syslog RFC (http://tools.ietf.org/html/rfc5424). Any configuration that can be done with rsyslog or syslog-ng is not provided in this module; such as log reception, forwaring, filtering, etc. The archival destinations are not visible to or configurable by the app, and instead are completely managed by the execution environment.

## License

(The MIT License)

Copyright (c) 2012 Thomas Blobaum <tblobaum@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
