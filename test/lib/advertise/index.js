'use strict'

const describe = require('mocha').describe
const it = require('mocha').it
const beforeEach = require('mocha').beforeEach
const afterEach = require('mocha').afterEach
const expect = require('chai').expect
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const adverts = require('../../../lib/adverts')

describe('lib/advertise', () => {
  let advertise
  let createLocation
  let broadcastAdvert
  let stopAdvert
  let clock

  beforeEach(() => {
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

  afterEach(() => {
    adverts.splice(0, adverts.length)
    clock.restore()
  })

  it('should advertise a service', () => {
    createLocation.returns(Promise.resolve())

    const ssdp = {}
    const advert = {
      usn: 'test-usn'
    }

    return advertise(ssdp, advert)
    .then(ad => {
      expect(ad.service.usn).to.equal(advert.usn)
      expect(adverts.length).to.equal(1)
      expect(adverts[0].service.usn).to.equal(advert.usn)
    })
  })

  it('should fail to advertise a service', () => {
    var error = new Error('Urk!')
    createLocation.returns(Promise.reject(error))

    const ssdp = {}
    const advert = {
      usn: 'test-usn'
    }

    return advertise(ssdp, advert)
    .catch(err => expect(err).to.equal(error))
  })

  it('should advertise a service repeatedly', () => {
    createLocation.returns(Promise.resolve())

    const ssdp = {}
    const advert = {
      usn: 'test-usn',
      interval: 10000
    }

    return advertise(ssdp, advert)
    .then(ad => {
      expect(broadcastAdvert.callCount).to.equal(2)

      clock.tick(advert.interval + 100)

      expect(broadcastAdvert.callCount).to.equal(3)
    })
  })
})
