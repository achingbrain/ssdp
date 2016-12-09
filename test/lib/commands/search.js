'use strict'

const describe = require('mocha').describe
const it = require('mocha').it
const beforeEach = require('mocha').beforeEach
const sinon = require('sinon')
const expect = require('chai').expect
const proxyquire = require('proxyquire')

describe('lib/commands/search', () => {
  let search
  let adverts

  beforeEach(() => {
    adverts = []

    search = proxyquire('../../../lib/commands/search', {
      '../adverts': adverts
    })
  })

  it('should reject invalid messages', () => {
    const ssdp = {
      emit: sinon.stub()
    }
    const message = {
      headers: {

      }
    }

    search({}, message)

    expect(ssdp.emit.called).to.be.false
  })

  it('should respond to a global search', () => {
    const ssdp = {
      udn: 'udn',
      emit: sinon.stub(),
      options: {
        signature: 'signature'
      }
    }
    const message = {
      MAN: 'man',
      MX: 'usn',
      ST: 'ssdp:all'
    }
    const remote = {
      address: 'remote-address',
      port: 'remote-port'
    }
    const advert = {
      service: {
        usn: 'usn',
        ttl: 1800,
        location: {
          udp4: 'location'
        }
      }
    }

    adverts.push(advert)

    search(ssdp, message, remote)

    expect(ssdp.emit.calledOnce).to.be.true
    expect(ssdp.emit.getCall(0).args[0]).to.equal('ssdp:send-message')
    expect(ssdp.emit.getCall(0).args[1]).to.equal('HTTP/1.1 200 OK')
    expect(ssdp.emit.getCall(0).args[2].ST).to.equal(advert.service.usn)
    expect(ssdp.emit.getCall(0).args[2].USN).to.equal(ssdp.udn + '::' + advert.service.usn)
    expect(ssdp.emit.getCall(0).args[2].LOCATION).to.equal(advert.service.location)
    expect(ssdp.emit.getCall(0).args[3]).to.deep.equal(remote)
  })

  it('should respond to a search', () => {
    const ssdp = {
      udn: 'udn',
      sockets: [{
        type: 'udp4'
      }],
      emit: sinon.stub(),
      options: {
        signature: 'signature'
      }
    }
    const message = {
      MAN: 'man',
      MX: 0,
      ST: 'usn'
    }
    const remote = {
      address: 'remote-address',
      port: 'remote-port'
    }
    adverts.push({
      service: {
        usn: 'usn',
        location: {
          udp4: 'usn-udp4-location'
        }
      }
    }, {
      service: {
        usn: 'not-usn'
      }
    })

    search(ssdp, message, remote)

    expect(ssdp.emit.calledOnce).to.be.true
  })

  it('should respond to a search in a case insensitive manner', () => {
    const ssdp = {
      udn: 'udn',
      sockets: [{
        type: 'udp4'
      }],
      emit: sinon.stub(),
      options: {
        signature: 'signature'
      }
    }
    const message = {
      MAN: 'man',
      MX: 0,
      ST: 'USN'
    }
    const remote = {
      address: 'remote-address',
      port: 'remote-port'
    }
    adverts.push({
      service: {
        usn: 'usn',
        location: {
          udp4: 'usn-udp4-location'
        }
      }
    }, {
      service: {
        usn: 'not-usn'
      }
    })

    search(ssdp, message, remote)

    expect(ssdp.emit.calledOnce).to.be.true
  })
})
