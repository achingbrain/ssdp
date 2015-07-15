var describe = require('mocha').describe
var it = require('mocha').it
var beforeEach = require('mocha').beforeEach
var expect = require('chai').expect
var sinon = require('sinon')
var proxyquire = require('proxyquire')

describe('lib/discover/search-response', function () {
  var searchResponse
  var resolveService

  beforeEach(function () {
    resolveService = sinon.stub()

    searchResponse = proxyquire('../../../lib/discover/search-response', {
      '../commands/resolve-service': resolveService
    })
  })

  it('should delegate to resolve-service', function () {
    searchResponse({}, {
      ttl: sinon.stub()
    })

    expect(resolveService.called).to.be.true
  })
})
