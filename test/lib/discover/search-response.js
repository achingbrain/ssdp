'use strict'

const describe = require('mocha').describe
const it = require('mocha').it
const beforeEach = require('mocha').beforeEach
const expect = require('chai').expect
const sinon = require('sinon')
const proxyquire = require('proxyquire')

describe('lib/discover/search-response', () => {
  let searchResponse
  let resolveService

  beforeEach(() => {
    resolveService = sinon.stub()

    searchResponse = proxyquire('../../../lib/discover/search-response', {
      '../commands/resolve-service': resolveService
    })
  })

  it('should delegate to resolve-service', () => {
    searchResponse({}, {
      ttl: sinon.stub()
    })

    expect(resolveService.called).to.be.true
  })
})
