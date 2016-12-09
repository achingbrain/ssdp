'use strict'

const describe = require('mocha').describe
const it = require('mocha').it
const expect = require('chai').expect
const sinon = require('sinon')
const detailsHandler = require('../../../lib/advertise/details-handler')

describe('lib/advertise/details-handler', () => {
  it('should return error when creating details fails', done => {
    const error = new Error('Urk!')
    const createDetails = sinon.stub().returns(Promise.reject(error))
    const writeHead = sinon.stub()

    detailsHandler(createDetails, {}, {
      writeHead: writeHead,
      end: (output) => {
        expect(writeHead.calledWith(500)).to.be.true
        expect(output).to.equal(error)
        done()
      }
    })
  })

  it('should transform object to xml and return', done => {
    const createDetails = sinon.stub().returns(Promise.resolve('<foo>bar</foo>'))
    const writeHead = sinon.stub()

    detailsHandler(createDetails, {}, {
      writeHead: writeHead,
      end: (output) => {
        expect(writeHead.calledWith(200)).to.be.true
        expect(output).to.contain('<foo>bar</foo>')
        done()
      }
    })
  })
})
