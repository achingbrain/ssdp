'use strict'

const describe = require('mocha').describe
const it = require('mocha').it
const before = require('mocha').before
const expect = require('chai').expect
const sinon = require('sinon')
const proxyquire = require('proxyquire')

describe('lib/advertise/find-all-interfaces', () => {
  let findAllInterfaces
  let os
  let interfaces

  before(() => {
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

  it('should include IPv6 interfaces', () => {
    const found = findAllInterfaces(false, true)

    expect(found.length).to.equal(1)
    expect(found[0]).to.equal(interfaces.v6[0])
  })

  it('should include IPv4 interfaces', () => {
    const found = findAllInterfaces(true, false)

    expect(found.length).to.equal(1)
    expect(found[0]).to.equal(interfaces.v4[0])
  })

  it('should include IPv4 and IPv6 interfaces', () => {
    const found = findAllInterfaces(true, true)

    expect(found.length).to.equal(2)
    expect(found[0]).to.equal(interfaces.v6[0])
    expect(found[1]).to.equal(interfaces.v4[0])
  })
})
