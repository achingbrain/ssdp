var describe = require('mocha').describe
var it = require('mocha').it
var beforeEach = require('mocha').beforeEach
var afterEach = require('mocha').afterEach
var expect = require('chai').expect
var sinon = require('sinon')
var proxyquire = require('proxyquire')
var adverts = require('../../../lib/adverts')

describe('lib/advertise', function () {
  var advertise
  var sendSsdpMessage
  var createLocation

  beforeEach(function () {
    sendSsdpMessage = sinon.stub()
    createLocation = function (shutDownServers, options, socket, headers, callback) {
      headers['LOCATION'] = options.location
      callback(null, headers)
    }

    advertise = proxyquire('../../../lib/advertise', {
      '../send-ssdp-message': sendSsdpMessage,
      './create-location': createLocation
    })
  })

  afterEach(function () {
    adverts.splice(0, adverts.length)
  })

  it('should advertise a service', function (done) {
    var sockets = 'sockets'
    var udn = 'udn'
    var options = {
      location: 'location'
    }
    var socket = {
      opts: {
        broadcast: {

        }
      }
    }

    var advert = advertise({}, sockets, udn, options)

    expect(sendSsdpMessage.called).to.be.true
    expect(sendSsdpMessage.getCall(0).args[3]).to.be.a('function')

    sendSsdpMessage.getCall(0).args[3](socket, function (error, message) {
      expect(error).to.not.exist

      message = message.toString('utf8')

      expect(message).to.contain(options.location)
      expect(message).to.contain('NTS: ssdp:alive')
      expect(adverts.length).to.equal(1)
      expect(adverts[0]).to.equal(advert)
      expect(advert.service.detailsHandler).to.be.a('function')

      advert.service.detailsHandler(function (error, result) {
        expect(error).to.not.exist
        expect(result).to.be.an('object')

        done()
      })
    })
  })

  it('should broadcast bye message when shutting down servers', function (done) {
    var sockets = 'sockets'
    var udn = 'udn'
    var options = {
      location: 'location'
    }
    var socket = {
      opts: {
        broadcast: {

        }
      }
    }

    var advert = advertise({}, sockets, udn, options)
    advert.stop(function (error) {
      expect(error).to.not.exist

      expect(sendSsdpMessage.calledTwice).to.be.true
      expect(sendSsdpMessage.getCall(1).args[3]).to.be.a('function')

      sendSsdpMessage.getCall(1).args[3](socket, function (error, message) {
        expect(error).to.not.exist

        message = message.toString('utf8')

        expect(message).to.contain(options.location)
        expect(message).to.contain('NTS: ssdp:byebye')
        expect(adverts.length).to.equal(0)

        done()
      })
    })
  })

  it('should emit error when broadcasting bye message when shutting down servers fails', function (done) {
    var sockets = 'sockets'
    var udn = 'udn'
    var options = {
      location: 'location'
    }
    var socket = {
      opts: {
        broadcast: {

        }
      }
    }

    var error = new Error('Urk!')

    createLocation = function (shutDownServers, options, socket, headers, callback) {
      shutDownServers.push(function (callback) {
        callback(error)
      })

      callback(null, headers)
    }

    sendSsdpMessage = function (ssdp, sockets, remote, createMessage, callback) {
      createMessage(socket, function () {
        callback()
      })
    }

    advertise = proxyquire('../../../lib/advertise', {
      '../send-ssdp-message': sendSsdpMessage,
      './create-location': createLocation
    })

    var advert = advertise({
      emit: function (event, err) {
        expect(event).to.equal('error')
        expect(err).to.equal(error)
        done()
      }
    }, sockets, udn, options, function () {
      advert.stop()
    })
  })

  it('should not emit error when broadcasting bye message when shutting down servers', function () {
    var sockets = 'sockets'
    var udn = 'udn'
    var options = {
      location: 'location'
    }
    var socket = {
      opts: {
        broadcast: {

        }
      }
    }

    createLocation = function (shutDownServers, options, socket, headers, callback) {
      callback(null, headers)
    }

    sendSsdpMessage = function (ssdp, sockets, remote, createMessage, callback) {
      createMessage(socket, function () {
        callback()
      })
    }

    advertise = proxyquire('../../../lib/advertise', {
      '../send-ssdp-message': sendSsdpMessage,
      './create-location': createLocation
    })

    var advert = advertise({}, sockets, udn, options, function () {
      advert.stop()
    })
  })

  it('should pass back error creating location', function (done) {
    var sockets = 'sockets'
    var udn = 'udn'
    var options = {
      location: 'location'
    }
    var socket = {
      opts: {
        broadcast: {

        }
      }
    }
    var error = new Error('Urk!')

    createLocation = function (shutDownServers, options, socket, headers, callback) {
      callback(error)
    }

    advertise = proxyquire('../../../lib/advertise', {
      '../send-ssdp-message': sendSsdpMessage,
      './create-location': createLocation
    })

    advertise({}, sockets, udn, options)

    sendSsdpMessage.getCall(0).args[3](socket, function (err) {
      expect(err).to.equal(error)

      done()
    })
  })

  it('should pass back error when sending message fails', function (done) {
    var sockets = 'sockets'
    var udn = 'udn'
    var options = {
      location: 'location'
    }
    var error = new Error('Urk!')
    sendSsdpMessage.callsArgWith(4, error)

    advertise({}, sockets, udn, options, function (err) {
      expect(err).to.equal(err)
      done()
    })
  })

  it('should emit error when sending message fails', function (done) {
    var sockets = 'sockets'
    var udn = 'udn'
    var options = {
      location: 'location'
    }
    var error = new Error('Urk!')
    sendSsdpMessage.callsArgWith(4, error)

    advertise({
      emit: function (event, err) {
        expect(event).to.equal('error')
        expect(err).to.equal(error)
        done()
      }
    }, sockets, udn, options)
  })

  it('should not emit error when sending message succeeds', function () {
    var sockets = 'sockets'
    var udn = 'udn'
    var options = {
      location: 'location'
    }

    sendSsdpMessage.callsArg(4)

    advertise({}, sockets, udn, options)
  })
})
