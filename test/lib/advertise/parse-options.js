'use strict'

const describe = require('mocha').describe
const it = require('mocha').it
const expect = require('chai').expect
const parseOptions = require('../../../lib/advertise/parse-options')
const proxyquire = require('proxyquire')
const sinon = require('sinon')

describe('lib/advertise/parse-options', () => {
  it('should populate defaults', () => {
    const options = parseOptions({}, {
      usn: 'a-usn'
    })

    expect(options.usn).to.equal('a-usn')
    expect(options.interval).to.equal(10000)
  })

  it('should require an options object', done => {
    parseOptions({
      emit: (event, error) => {
        expect(event).to.equal('error')
        expect(error.message).to.contain('Empty advert passed')
        done()
      }
    })
  })

  it('should require a usn as part of the options object', done => {
    parseOptions({
      emit: (event, error) => {
        expect(event).to.equal('error')
        expect(error.message).to.contain('Advert should have a usn property')
        done()
      }
    }, {})
  })

  it('should make the details key a function that serialises details to xml', () => {
    const options = parseOptions({
      udn: 'a-udn'
    }, {
      usn: 'a-usn'
    })

    expect(options.details).to.be.a('function')

    return options.details()
    .then(details => {
      expect(details).to.contain('<root xmlns="urn:schemas-upnp-org:device-1-0">')
    })
  })

  it('should handle details that fail to parse as XML', done => {
    const error = new Error('Urk!')
    const parseOptions = proxyquire('../../../lib/advertise/parse-options', {
      xml2js: {
        Builder: sinon.stub().returns({
          buildObject: sinon.stub().throws(error)
        })
      }
    })
    const options = parseOptions({
      udn: 'a-udn'
    }, {
      usn: 'a-usn'
    })

    expect(options.details).to.be.a('function')

    options.details()
    .catch(err => {
      expect(err).to.equal(error)
      done()
    })
  })
})
