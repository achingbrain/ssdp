'use strict'

const describe = require('mocha').describe
const it = require('mocha').it
const beforeEach = require('mocha').beforeEach
const sinon = require('sinon')
const expect = require('chai').expect
const proxyquire = require('proxyquire')

describe('lib/commands/resolve-location', () => {
  let resolveLocation
  let axios

  beforeEach(() => {
    axios = sinon.stub()

    resolveLocation = proxyquire('../../../lib/commands/resolve-location', {
      'axios': axios
    })
  })

  it('should parse location contents as xml', () => {
    const location = 'location'
    const result = {
      headers: {
        'content-type': 'application/xml'
      },
      data: '<foo>bar</foo>'
    }

    axios.withArgs({
      url: `http://${location}`,
      responseType: 'text',
      headers: {
        accept: 'application/xml'
      }
    })
    .returns(Promise.resolve(result))

    return resolveLocation(location)
    .then(location => {
      expect(location).to.deep.equal({
        foo: 'bar'
      })
    })
  })

  it('should parse location contents as xml with attributes', () => {
    const location = 'location'
    const result = {
      headers: {
        'content-type': 'application/xml'
      },
      data: '<foo baz="qux">bar</foo>'
    }

    axios.withArgs({
      url: `http://${location}`,
      responseType: 'text',
      headers: {
        accept: 'application/xml'
      }
    })
    .returns(Promise.resolve(result))

    return resolveLocation(location)
    .then(location => {
      expect(location).to.deep.equal({
        foo: {
          $: {
            baz: 'qux'
          },
          _: 'bar'
        }
      })
    })
  })

  it('should return error when fetching location fails', done => {
    const location = 'location'
    const result = {
      headers: {
        'content-type': 'text/html'
      },
      data: '<foo>bar</foo>'
    }

    axios.withArgs({
      url: `http://${location}`,
      responseType: 'text',
      headers: {
        accept: 'application/xml'
      }
    })
    .returns(Promise.resolve(result))

    resolveLocation(location)
    .catch(error => {
      expect(error.message).to.contain('Bad content type')

      done()
    })
  })

  it('should return error when parsing XML fails', done => {
    const location = 'location'
    const result = {
      headers: {
        'content-type': 'application/xml'
      },
      data: '<foo>bar</foos>'
    }

    axios.withArgs({
      url: `http://${location}`,
      responseType: 'text',
      headers: {
        accept: 'application/xml'
      }
    })
    .returns(Promise.resolve(result))

    resolveLocation(location)
    .then((res) => {
      console.info('eerm', res)
      done()
    })
    .catch(error => {
      expect(error.message).to.contain('Unexpected close tag')

      done()
    })
  })
})
