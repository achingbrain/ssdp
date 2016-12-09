'use strict'

const describe = require('mocha').describe
const it = require('mocha').it
const expect = require('chai').expect
const defaultSsdpOptions = require('../../lib/default-ssdp-options')

describe('lib/default-ssdp-options', () => {
  it('should populate defaults', () => {
    const options = defaultSsdpOptions({})

    expect(options.udn).to.be.ok
    expect(options.sockets.length).to.equal(1)
    expect(options.sockets[0].broadcast.address).to.equal('239.255.255.250')
    expect(options.sockets[0].broadcast.port).to.equal(1900)
    expect(options.sockets[0].bind.address).to.equal('0.0.0.0')
    expect(options.sockets[0].bind.port).to.equal(1900)
    expect(options.sockets[0].maxHops).to.equal(4)
  })

  it('should honor weird half-set socket', () => {
    const options = defaultSsdpOptions({
      sockets: [{
        type: 'udp5',
        broadcast: {
          address: 'foo'
        }
      }]
    })

    expect(options.udn).to.be.ok
    expect(options.sockets.length).to.equal(1)
    expect(options.sockets[0].type).to.equal('udp5')
    expect(options.sockets[0].broadcast.address).to.equal('foo')
    expect(options.sockets[0].broadcast.port).to.equal(1900)
    expect(options.sockets[0].bind.address).to.equal('0.0.0.0')
    expect(options.sockets[0].bind.port).to.equal(1900)
    expect(options.sockets[0].maxHops).to.equal(4)
  })

  it('should survive no arguments', () => {
    const options = defaultSsdpOptions()

    expect(options.udn).to.be.ok
    expect(options.sockets.length).to.equal(1)
    expect(options.sockets[0].broadcast.address).to.equal('239.255.255.250')
    expect(options.sockets[0].broadcast.port).to.equal(1900)
    expect(options.sockets[0].bind.address).to.equal('0.0.0.0')
    expect(options.sockets[0].bind.port).to.equal(1900)
    expect(options.sockets[0].maxHops).to.equal(4)
  })
})
