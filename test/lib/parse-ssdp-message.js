'use strict'

const describe = require('mocha').describe
const it = require('mocha').it
const expect = require('chai').expect
const sinon = require('sinon')
const parse = require('../../lib/parse-ssdp-message')
const proxyquire = require('proxyquire')

describe('lib/parse-ssdp-message', () => {
  it('should parse search request', () => {
    const type = 'M-SEARCH'
    const host = '239.255.255.250:1900'
    const serviceType = 'urn:schemas-upnp-org:device:InternetGatewayDevice:1'
    const action = 'ssdp:discover'
    const mx = 3

    const message = type + ' * HTTP/1.1\r\n' +
      'Host: ' + host + '\n' +
      'ST: ' + serviceType + ' \r\n' +
      'Man :" ' + action + '"\r\n' +
      'MX: ' + mx

    const ssdp = {
      emit: sinon.stub()
    }

    const remoteInfo = {}

    parse(ssdp, message, remoteInfo)

    expect(ssdp.emit.called).to.be.true
    expect(ssdp.emit.getCall(0).args[0]).to.equal('ssdp:' + type.toLowerCase())
    expect(ssdp.emit.getCall(0).args[1].HOST).to.equal(host)
    expect(ssdp.emit.getCall(0).args[1].ST).to.equal(serviceType)
    expect(ssdp.emit.getCall(0).args[1].MAN).to.equal(action)
    expect(ssdp.emit.getCall(0).args[1].MX).to.equal(mx)
  })

  it('should parse a notify request', () => {
    const type = 'NOTIFY'
    const host = '239.255.255.250:1900'
    const notificationType = 'urn:schemas-upnp-org:device:MediaRenderer:1'
    const notificatonSubtype = 'ssdp:alive'
    const location = 'http://10.1.83.59:2869/upnphost/udhisapi.dll?content=uuid:600852a0-3651-4f30-b314-cf367c02a864'
    const usn = 'uuid:600852a0-3651-4f30-b314-cf367c02a864::urn:schemas-upnp-org:device:MediaRenderer:1'
    const maxAge = 1800
    const cacheControl = 'max-age=' + maxAge
    const server = 'Microsoft-Windows-NT/5.1 UPnP/1.0 UPnP-Device-Host/1.0'
    const opt = '"http://schemas.upnp.org/upnp/1/0/"; ns=01'
    const nls = '4c7e818231dc16d5311f21cf2c8559a1'

    const message = type + ' * HTTP/1.1\r\n' +
     'Host: ' + host + '\r\n' +
     'NT: ' + notificationType + '\r\n' +
     'NTS: ' + notificatonSubtype + '\r\n' +
     'Location: ' + location + '\r\n' +
     'USN: ' + usn + '\r\n' +
     'Cache-Control: ' + cacheControl + '\r\n' +
     'Server: ' + server + '\r\n' +
     'OPT: ' + opt + '\r\n' +
     '01-NLS: ' + nls

    const ssdp = {
      emit: sinon.stub()
    }

    const remoteInfo = {}

    parse(ssdp, message, remoteInfo)

    expect(ssdp.emit.called).to.be.true
    expect(ssdp.emit.getCall(0).args[0]).to.equal('ssdp:' + type.toLowerCase())
    expect(ssdp.emit.getCall(0).args[1].ttl()).to.equal(maxAge * 1000)
    expect(ssdp.emit.getCall(0).args[1].HOST).to.equal(host)
    expect(ssdp.emit.getCall(0).args[1].NT).to.equal(notificationType)
    expect(ssdp.emit.getCall(0).args[1].NTS).to.equal(notificatonSubtype)
    expect(ssdp.emit.getCall(0).args[1].LOCATION).to.equal(location)
    expect(ssdp.emit.getCall(0).args[1].USN).to.equal(usn)
    expect(ssdp.emit.getCall(0).args[1]['CACHE-CONTROL']).to.equal(cacheControl)
    expect(ssdp.emit.getCall(0).args[1].SERVER).to.equal(server)
    expect(ssdp.emit.getCall(0).args[1].OPT).to.equal(opt)
    expect(ssdp.emit.getCall(0).args[1]['01-NLS']).to.equal(nls)
    expect(ssdp.emit.getCall(0).args[1].remote()).to.equal(remoteInfo)
  })

  it('should parse a search response', () => {
    const maxAge = 100
    const cacheControl = 'max-age=' + maxAge
    const location = 'http://192.168.1.76:80/description.xml'
    const server = 'FreeRTOS/7.4.2 UPnP/1.0 IpBridge/1.8.0'
    const serviceType = 'upnp:rootdevice'
    const usn = 'uuid:2f402f80-da50-11e1-9b23-00178809ea66::upnp:rootdevice'

    const message = 'HTTP/1.1 200 OK\r\n' +
      'CACHE-CONTROL: ' + cacheControl + '\r\n' +
      'EXT:\r\n' +
      'LOCATION: ' + location + '\r\n' +
      'SERVER: ' + server + '\r\n' +
      'ST: ' + serviceType + '\r\n' +
      'USN: ' + usn

    const ssdp = {
      emit: sinon.stub()
    }

    const remoteInfo = {}

    parse(ssdp, message, remoteInfo)

    expect(ssdp.emit.called).to.be.true
    expect(ssdp.emit.getCall(0).args[0]).to.equal('ssdp:search-response')
    expect(ssdp.emit.getCall(0).args[1].ttl()).to.equal(maxAge * 1000)
    expect(ssdp.emit.getCall(0).args[1].LOCATION).to.equal(location)
    expect(ssdp.emit.getCall(0).args[1].USN).to.equal(usn)
    expect(ssdp.emit.getCall(0).args[1]['CACHE-CONTROL']).to.equal(cacheControl)
    expect(ssdp.emit.getCall(0).args[1].SERVER).to.equal(server)
    expect(ssdp.emit.getCall(0).args[1].ST).to.equal(serviceType)
  })

  it('should reply to messages from same host but different port', () => {
    const findAllInterfaces = sinon.stub()
    findAllInterfaces.returns([{
      address: '127.0.0.1'
    }, {
      address: '192.168.0.1'
    }])

    const parse = proxyquire('../../lib/parse-ssdp-message', {
      './find-all-interfaces': findAllInterfaces
    })

    const ssdp = {
      emit: sinon.stub(),
      sockets: [{
        options: {
          bind: {
            port: 2891
          }
        }
      }]
    }

    parse(ssdp, 'M-SEARCH * HTTP/1.1', {
      address: '192.168.0.1',
      port: 3982
    })

    expect(ssdp.emit.called).to.be.true
  })

  it('should ignore messages with unknown type', () => {
    const ssdp = {
      emit: sinon.stub()
    }

    parse(ssdp, 'POST HTTP/1.1', {
      address: 'not-local-address'
    })

    expect(ssdp.emit.called).to.be.false
  })
})
