// revised console

// Copyright (c) 2012 Thomas Blobaum <tblobaum@gmail.com>

// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// 'Software'), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:

// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
// IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
// CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
// TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
// SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// RFC -- http://tools.ietf.org/html/rfc5424

var bindings = require('bindings')('syslog')
  , util = require('util')
  , stream = require('stream')
  , colors = require('colors')
  , sev = { 
      emerg:0
      , alert:1
      , crit:2
      , error:3
      , warning:4
      , warn:4        // additional warn tag
      , notice:5 
      , info:6
      , debug:7 
      , trace:7       // additional debug tag
      , dir:7         // additional debug tag
      , time:7        // additional debug tag
      , timeEnd:7     // additional debug tag
    }
  , fac = { 
      kern:0
      , user: 8
      , mail:16
      , daemon:24
      , auth:32
      , syslog:40
      , lpr:48
      , news:56
      , uucp:64
      , local0:128
      , local1:136
      , local2:144
      , local3:152
      , local4:160
      , local5:168
      , local6:176
      , local7:184 
    }
  , connected = false
  , rc = console
  , times = {}
  , streams = {}

colors.setTheme({
  emerg: 'red'
  , alert: 'red'
  , crit: 'red'
  , error: 'red'
  , warning: 'yellow'
  , warn: 'yellow'
  , notice: 'cyan'
  , info: 'green'
  , debug: 'bold'
  , trace: 'bold'
  , dir: 'bold'
  , time: 'bold'
  , timeEnd: 'bold'
})

/**
 * Setup `options` and connect to syslog 
 *
 * @param {Object} options
 * @return {undefined}
 * @api public
 */

rc.set = function (options) {
  if (connected) 
    bindings.exit()

  options = defined(options, {})
  rc.title = defined(options.title, rc.title, process.title)
  rc.facility = defined(options.facility, rc.facility, 'user')
  rc.highestLevel = defined(options.highestLevel, rc.highestLevel, 'debug')
  rc.upto = sev[rc.highestLevel]
  rc.stdout = defined(options.stdout, rc.stdout, false)
  rc.stderr = defined(options.stderr, rc.stderr, true)
  rc.syslog = defined(options.syslog, rc.syslog, true)
  rc.syslogHashTags = defined(options.syslogHashTags, rc.syslogHashTags, false)
  rc.showTime = defined(options.showTime, rc.showTime, true)
  rc.showLine = defined(options.showLine, rc.showLine, true)
  rc.showFile = defined(options.showFile, rc.showFile, true)
  rc.showTags = defined(options.showTags, rc.showTags, true)

  connected = bindings.open(rc.title, fac[rc.facility], rc.upto)
}

process.on('exit', function () {
  if (connected) 
    bindings.exit()
})

function showLineAndFile (bool, msg) {
  var bool = rc.showLine || rc.showFile
  msg = formatIf(bool, '%s%s', ['] ', msg], msg)
  msg = formatIf(rc.showLine, '%s%s', [__stack[2].getLineNumber(), msg], msg)
  msg = formatIf((rc.showLine && rc.showFile), '%s%s', [':', msg], msg)
  msg = formatIf(rc.showFile, '%s%s', [__stack[2].getFileName().replace(process.cwd() +'/', ''), msg], msg)
  msg = formatIf(bool, '%s%s', ['[', msg], msg)
  return msg
}

Object.keys(sev).forEach(function (level) {
  rc[level] = function () {
    var args = Array.prototype.slice.call(arguments)
      , msg
    // handle a few special cases and util.format the rest, take care in 
    // modifying this code or the line numbers may not reference properly

    switch (level) {
    case 'trace':
      // TODO probably can to do this better with V8's debug object once that is
      // exposed.
      var err = new Error
      err.name = args[0] || ''
      // err.message = args[1] || ''
      Error.captureStackTrace(err, arguments.callee)
      msg = util.format.call({}, err.stack)
      break
    case 'dir':
      msg = util.inspect.apply({}, arguments)
      break
    case 'time':
      msg = util.format.apply({}, arguments)
      times[args[0]] = Date.now()
      break
    case 'timeEnd':
      var duration = Date.now() - times[args[0]]
      msg = util.format('%s: %dms', args[0], duration)
      break
    case 'ascii': // it's an ascii stream
      msg = util.format.call({}, args[0].replace(/\n/, ''))
      break
    default: // it's everything else
      msg = util.format.apply({}, arguments)
    }

    msg = showLineAndFile((rc.showLine || rc.showFile), msg)
    send(level, msg)
  }
})

rc.log = rc.info

/**
 * Return a writable stream for `level`
 *
 * @param {String} level
 * @return {Stream}
 * @api public
 */

rc.stream = function (level) {
  if (streams[level])
    return streams[level]
  else {
    streams[level] = new stream.Stream
    streams[level].writable = true
    streams[level].write = rc[level]
    return streams[level]
  }
}

/**
 * Output `msg` to stdio with label `level`
 *
 * @param {String} level
 * @param {String} msg
 * @return {undefined}
 * @api private
 */
var tagCache = {}

function output (level, msg) {
  var time = ''
  if (rc.upto >= sev[level]) {

    // display timestamp in terminal
    var d = new Date().toISOString().slice(5, 16).replace(/T/g, ' ').grey
    msg = formatIf(rc.showTime, '%s %s', [d, msg], msg)

    // display tags in terminal
    tagCache[level] = tagCache[level] || prependUntilLength(level, 6, ' ')

    msg = formatIf(rc.showTags, '%s %s', [ tagCache[level][level], msg ], msg)

    // write to stdout or stderr, but not both
    if (rc.stdout)
      process.stdout.write(msg +'\n')
    else if (rc.stderr)
      process.stderr.write(msg +'\n')
  }
}

/**
 * Send message to syslog and stdio
 *
 * @return {undefined}
 * @api private
 */

function send (severity, msg) {
  var len 
  output(severity, msg, msg.length)

  // this should probably be 1024
  if (msg.length > 1024)
    process.stderr.write(new Error('maximum log length is 1024 bytes') +'\n')

  if (rc.syslog) {
    // add a hashtag based on the severity level
    msg = formatIf(rc.syslogHashTags, '#%s %s', [severity, msg], msg)
    // send the log to syslog 
    bindings.log(sev[severity], msg)

  }
}

/**
 * Return the current line number
 *
 * @return {Number}
 * @api public
 */

Object.defineProperty(global, '__line', {
  get: function () {
    return __stack[1].getLineNumber()
  }
})

/**
 * Return the call stack
 *
 * @return {Array}
 * @api public
 */

Object.defineProperty(global, '__stack', {
  get: function () {
    var orig = Error.prepareStackTrace
    Error.prepareStackTrace = function (_, stack) { 
      return stack 
    }
    var err = new Error
    Error.captureStackTrace(err, arguments.callee)
    var stack = err.stack
    Error.prepareStackTrace = orig
    return stack
  }
})

// if bool is true then format
function formatIf (bool, format, arr, ref) {
  if (bool) {
    arr.unshift(format)
    return util.format.apply({}, arr)
  }
  else
    return ref
}

/**
 * Prepends `char` to `str` until it's length is `len`
 *
 * @param {String} str
 * @param {Number} len
 * @param {String} char
 * @return {String}
 * @api private
 */

function prependUntilLength (str, len, char) {
  if (str.length >= len) 
    return str
  else 
    return prependUntilLength(str=char+str, len, char)
}

/**
 * Return the first argument that is not undefined
 *
 * @api private
 */

function defined () {
  for (var i=0; i<arguments.length; i++)
    if (typeof arguments[i] !== 'undefined') 
      return arguments[i]
}

rc.set()

module.exports = rc
