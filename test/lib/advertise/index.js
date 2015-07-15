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
  var createLocation
  var broadcastAdvert
  var stopAdvert
  var clock

  beforeEach(function () {
    clock = sinon.useFakeTimers()
    createLocation = sinon.stub()
    broadcastAdvert = sinon.stub()
    stopAdvert = sinon.stub()

    advertise = proxyquire('../../../lib/advertise', {
      './broadcast-advert': broadcastAdvert,
      './create-location': createLocation,
      './stop-advert': stopAdvert
    })
  })

  afterEach(function () {
    adverts.splice(0, adverts.length)
    clock.restore()
  })

  it('should advertise a service', function (done) {
    createLocation.callsArgAsync(2)

    var ssdp = {}
    var advert = {
      usn: 'test-usn'
    }

    advertise(ssdp, advert, function (error, ad) {
      expect(error).to.not.exist
      expect(ad.service.usn).to.equal(advert.usn)
      expect(adverts.length).to.equal(1)
      expect(adverts[0].service.usn).to.equal(advert.usn)

      done()
    })
  })

  it('should fail to advertise a service', function (done) {
    var error = new Error('Urk!')
    createLocation.callsArgWithAsync(2, error)

    var ssdp = {}
    var advert = {
      usn: 'test-usn'
    }

    advertise(ssdp, advert, function (err) {
      expect(err).to.equal(error)

      done()
    })
  })

  it('should advertise a service repeatedly', function (done) {
    createLocation.callsArgAsync(2)

    var ssdp = {}
    var advert = {
      usn: 'test-usn',
      interval: 10000
    }

    advertise(ssdp, advert, function (error, ad) {
      expect(error).to.not.exist

      expect(broadcastAdvert.callCount).to.equal(2)

      clock.tick(advert.interval + 100)

      expect(broadcastAdvert.callCount).to.equal(3)

      done()
    })
  })
})
