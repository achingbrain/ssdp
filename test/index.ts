import { expect } from 'aegir/utils/chai.js'
import ssdp from '../src/index.js'

describe('constructor', () => {
  it('should export something useful', () => {
    expect(ssdp).to.be.a('function')
  })
})
