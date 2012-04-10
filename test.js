/*
 *  # example rsyslog v5 configuration
 *
 * /etc/rsyslog.d/node.conf
 *

  local0.notice    /var/log/node/production.log
  local0.info      /var/log/node/staging.log
  local0.debug     /var/log/node/debug.log

 *
 */


'use strict';
require('./');


/*
 *! full configuration example
 *

rconsole.configure({
  facility: 'local0',    // default: user
  title: 'web-01',       // default: node -- can also be set with `process.title`
  highestLevel: 'debug', // [emerg,alert,crit,err,warning,notice,info,debug]
  stdout: false,         // default: false
  stderr: true,          // default: true
  syslog: true,          // default: true
  syslogHashTags: false, // default: false
  showTime: true,        // default: true 
  showLine: true,        // default: true
  showFile: true,        // default: true
  showTags: true,        // default: true
})

 *
 */

// real world example
console.set({
  facility: 'local0'
  , title: 'web-01'
  , highestLevel: 'debug'
  , stderr: false
  , stdout: true
  , syslog: true
  , syslogHashTags: true
  , showTime: true
  , showLine: true
  , showFile: true
  , showTags: true
})

// debug (level 7) & info (level 6) 
// logs will not be logged to syslog or 
// stdout/stderr with this config
if (process.env['NODE_ENV'] === 'production')
  console.set({ 
    highestLevel: 'notice', 
    stderr: false 
  })

// recommended methods
console.emerg('level 0')
console.alert('level 1', [1, 2, 3, 4])
console.crit('level 2', function anon () { })
console.error('level 3', new Error('oh noes'))
console.warn('level 4', [NaN, false, true])
console.notice('level 5', {})
console.info('level 6', undefined)
console.debug('level 7', { hello: 'world' })

// native console methods revised
console.error('level 3')
console.warn('level 4')
console.log('level 6')
console.info('level 6')
console.trace('level 7')
console.dir({ 'level 7': { 'deep': { 'level': { 'inspect': true } } } }, true, 5)
console.time('level 7')
console.timeEnd('level 7')

// example webserver that logs connections/address
var express = require('express')
  , app = express.createServer()

app.use(express.favicon())
app.use(express.logger({ stream: console.stream('notice') }))

app.get('/', function (req, res, next) {
  // console.timeEnd('level 7')
  res.end('hello world')
})

app.listen(1337)

console.notice('Server running at http://127.0.0.1:1337/')

/*
 * abgraph benchmark
 *

 $ NODE_ENV=production node test.js 
 $ ab -c 100 -n 100000 http://127.0.0.1:1337/

 *
 * results:
 *

Server Software:        node (test.js)
Server Hostname:        127.0.0.1
Server Port:            1337

Document Path:          /
Document Length:        11 bytes

Concurrency Level:      100
Time taken for tests:   36.870 seconds
Complete requests:      100000
Failed requests:        0
Write errors:           0
Total transferred:      7200000 bytes
HTML transferred:       1100000 bytes
Requests per second:    2712.23 [#/sec] (mean)
Time per request:       36.870 [ms] (mean)
Time per request:       0.369 [ms] (mean, across all concurrent requests)
Transfer rate:          190.70 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0    0   0.2      0      11
Processing:     1   37  20.7     36     106
Waiting:        1   37  20.7     36     106
Total:          1   37  20.7     36     107

Percentage of the requests served within a certain time (ms)
  50%     36
  66%     48
  75%     54
  80%     57
  90%     64
  95%     70
  98%     75
  99%     78
 100%    107 (longest request)

 *
 * syslog results:
 *

  $ ls /var/log/node/production -lath
  -rw-r--r--. 1 root root 213K /var/log/node/production

 *
 */