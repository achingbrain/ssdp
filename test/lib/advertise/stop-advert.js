'use strict'

const describe = require('mocha').describe
const it = require('mocha').it
const expect = require('chai').expect
const sinon = require('sinon')
const stopAdvert = require('../../../lib/advertise/stop-advert')

describe('lib/advertise/stop-advert', () => {
  it('should stop an advert', () => {
    const ssdp = {
      emit: sinon.stub(),
      sockets: [{
        options: {
          broadcast: {

          }
        }
      }],
      options: {
        signature: 'foo'
      }
    }
    const shutDownServers = sinon.stub().returns([
      Promise.resolve()
    ])
    const advert = {
      location: {
        udp4: 'udp4-location'
      }
    }

    return stopAdvert(ssdp, {
      shutDownServers: shutDownServers
    }, advert)
  })

  it('should pass back error when stopping advert', () => {
    const error = new Error('Urk!')
    const ssdp = {}
    const shutDownServers = sinon.stub().returns([
      Promise.reject(error)
    ])
    var advert = {}

    return stopAdvert(ssdp, {
      shutDownServers: shutDownServers
    }, advert)
    .catch(err => expect(err).to.equal(error))
  })
})
