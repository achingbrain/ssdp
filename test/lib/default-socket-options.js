'use strict'

const describe = require('mocha').describe
const it = require('mocha').it
const expect = require('chai').expect
const defaultSocketOptions = require('../../lib/default-socket-options')

describe('lib/default-socket-options', () => {
  it('should populate defaults', () => {
    const socket = defaultSocketOptions({})

    expect(socket.type).to.equal('udp4')
    expect(socket.broadcast.address).to.equal('239.255.255.250')
    expect(socket.broadcast.port).to.equal(1900)
    expect(socket.bind.address).to.equal('0.0.0.0')
    expect(socket.bind.port).to.equal(1900)
    expect(socket.maxHops).to.equal(4)
  })

  it('should survive no arguments', () => {
    const socket = defaultSocketOptions()

    expect(socket.type).to.equal('udp4')
    expect(socket.broadcast.address).to.equal('239.255.255.250')
    expect(socket.broadcast.port).to.equal(1900)
    expect(socket.bind.address).to.equal('0.0.0.0')
    expect(socket.bind.port).to.equal(1900)
    expect(socket.maxHops).to.equal(4)
  })
})
