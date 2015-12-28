var describe = require('mocha').describe
var it = require('mocha').it
var before = require('mocha').before
var expect = require('chai').expect
var sinon = require('sinon')
var proxyquire = require('proxyquire')

describe('lib/advertise/find-all-interfaces', function () {
  var findAllInterfaces
  var os
  var interfaces

  before(function () {
    os = {
      networkInterfaces: sinon.stub()
    }

    findAllInterfaces = proxyquire('../../../lib/advertise/find-all-interfaces', {
      os: os
    })

    interfaces = {
      v6: [{
        internal: false,
        family: 'IPv6'
      }],
      v4: [{
        internal: false,
        family: 'IPv4'
      }]
    }

    os.networkInterfaces.returns(interfaces)
  })

  it('should include IPv6 interfaces', function () {
    var found = findAllInterfaces(false, true)

    expect(found.length).to.equal(1)
    expect(found[0]).to.equal(interfaces.v6[0])
  })

  it('should include IPv4 interfaces', function () {
    var found = findAllInterfaces(true, false)

    expect(found.length).to.equal(1)
    expect(found[0]).to.equal(interfaces.v4[0])
  })

  it('should include IPv4 and IPv6 interfaces', function () {
    var found = findAllInterfaces(true, true)

    expect(found.length).to.equal(2)
    expect(found[0]).to.equal(interfaces.v6[0])
    expect(found[1]).to.equal(interfaces.v4[0])
  })
})
