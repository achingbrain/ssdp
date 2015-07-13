return

var describe = require('mocha').describe
var it = require('mocha').it
var beforeEach = require('mocha').beforeEach
var afterEach = require('mocha').afterEach
var expect = require('chai').expect
var ssdp = require('../')
var async = require('async')

describe('ssdp-integration', function () {
  var local
  var remote

  beforeEach(function (done) {
    async.parallel([
      function (callback) {
        local = ssdp({
          udp4: {
            bind: {
              port: 1900
            }
          },
          udp6: false
        })
        local.once('ready', callback)
        local.once('error', callback)
      },
      function (callback) {
        remote = ssdp({
          udp4: {
            bind: {
              port: 1901
            }
          },
          udp6: false
        })
        remote.once('ready', callback)
        remote.once('error', callback)
      }
    ], function (error) {
      local.removeAllListeners('ready')
      local.removeAllListeners('error')
      remote.removeAllListeners('ready')
      remote.removeAllListeners('error')
      done(error)
    })
  })

  afterEach(function (done) {
    async.parallel([
      local.stop.bind(null),
      remote.stop.bind(null)
    ], done)
  })

  it('should advertise and find a thing', function (done) {
    var usn = 'my-super-fun-service'

    remote.advertise({
      usn: usn,
      detailsHandler: function (callback) {
        callback(null, {
          specVersion: {
            major: 1,
            minor: 0
          },
          URLBase: 'http://localhost'
        })
      }
    }, function (error) {
      if (error) {
        return done(error)
      }

      local.discover(usn)
      local.on(usn, function (service) {
        expect(service.headers.ST).to.equal(usn)
        done()
      })
    })
  })
/*
  it('should stop an advertisment', function (done) {
    var usn = 'my-super-fun-service'

    var advert = remote.advertise({
      usn: usn,
      detailsHandler: function (callback) {
        callback(null, {
          specVersion: {
            major: 1,
            minor: 0
          },
          URLBase: 'http://localhost'
        })
      }
    }, function (error) {
      if (error) {
        return done(error)
      }

      local.discover(usn)
      local.on(usn, function (service) {
        advert.stop()
        local.on('ssdp:byebye', done)
      })
    })
  })*/
})
