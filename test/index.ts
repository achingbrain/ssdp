import { expect } from 'aegir/chai'
import ssdp from '../src/index.js'

describe('constructor', () => {
  it('should export something useful', () => {
    expect(ssdp).to.be.a('function')
  })
})
