
require('../')

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