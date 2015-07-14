var describe = require('mocha').describe
var it = require('mocha').it
var expect = require('chai').expect
var defaultSocketOptions = require('../../lib/default-socket-options')

describe('lib/default-socket-options', function () {

  it('should populate defaults', function () {
    var socket = defaultSocketOptions({})

    expect(socket.type).to.equal('udp4')
    expect(socket.broadcast.address).to.equal('239.255.255.250')
    expect(socket.broadcast.port).to.equal(1900)
    expect(socket.bind.address).to.equal('0.0.0.0')
    expect(socket.bind.port).to.equal(1900)
    expect(socket.maxHops).to.equal(4)
  })

  it('should survive no arguments', function () {
    var socket = defaultSocketOptions()

    expect(socket.type).to.equal('udp4')
    expect(socket.broadcast.address).to.equal('239.255.255.250')
    expect(socket.broadcast.port).to.equal(1900)
    expect(socket.bind.address).to.equal('0.0.0.0')
    expect(socket.bind.port).to.equal(1900)
    expect(socket.maxHops).to.equal(4)
  })
})
