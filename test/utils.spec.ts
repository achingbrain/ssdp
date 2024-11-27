import { expect } from 'aegir/chai'
import { stubInterface } from 'sinon-ts'
import { addressFamilyMismatch, isIpv4Address } from '../src/utils.js'
import type { SSDPSocket } from '../src/index.js'

const ipv6Addresses = [
  '2a00:23c6:14b1:7e00:1cd4:46d7:962:5717',
  'FF02::C'
]

const ipv4Addresses = [
  '192.168.1.100',
  '239.255.255.250'
]

describe('addressFamilyMismatch', () => {
  it('should detect IPv4 mismatch', () => {
    const socket = stubInterface<SSDPSocket>({
      type: 'udp4'
    })

    for (const address of ipv6Addresses) {
      expect(addressFamilyMismatch({ port: 100, address }, socket)).to.be.true()
    }

    for (const address of ipv4Addresses) {
      expect(addressFamilyMismatch({ port: 100, address }, socket)).to.be.false()
    }
  })

  it('should detect IPv6 mismatch', () => {
    const socket = stubInterface<SSDPSocket>({
      type: 'udp6'
    })

    for (const address of ipv6Addresses) {
      expect(addressFamilyMismatch({ port: 100, address }, socket)).to.be.false()
    }

    for (const address of ipv4Addresses) {
      expect(addressFamilyMismatch({ port: 100, address }, socket)).to.be.true()
    }
  })
})

describe('isIpv4Address', () => {
  it('should recognise IPv4', () => {
    for (const address of ipv4Addresses) {
      expect(isIpv4Address(address)).to.be.true()
    }
  })

  it('should recognise IPv6', () => {
    for (const address of ipv6Addresses) {
      expect(isIpv4Address(address)).to.be.false()
    }
  })
})
