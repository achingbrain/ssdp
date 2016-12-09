'use strict'

const describe = require('mocha').describe
const it = require('mocha').it
const expect = require('chai').expect
const ssdp = require('../')

describe('/', () => {
  it('should export something useful', () => {
    expect(ssdp).to.be.a('function')
  })
})
