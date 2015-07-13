var describe = require('mocha').describe
var it = require('mocha').it
var expect = require('chai').expect
var parseOptions = require('../../lib/parse-options')

describe('lib/parse-options', function () {

  it('should populate defaults', function () {
    var options = parseOptions({})

    expect(options.udn).to.be.ok
    expect(options.udp4.broadcast.address).to.equal('239.255.255.250')
    expect(options.udp4.broadcast.port).to.equal(1900)
    expect(options.udp4.bind.address).to.equal('0.0.0.0')
    expect(options.udp4.bind.port).to.equal(1900)
    expect(options.udp4.maxHops).to.equal(1)
  })

  it('should survive empty object', function () {
    var options = parseOptions()

    expect(options.udn).to.be.ok
    expect(options.udp4.broadcast.address).to.equal('239.255.255.250')
    expect(options.udp4.broadcast.port).to.equal(1900)
    expect(options.udp4.bind.address).to.equal('0.0.0.0')
    expect(options.udp4.bind.port).to.equal(1900)
    expect(options.udp4.maxHops).to.equal(1)
  })
})
