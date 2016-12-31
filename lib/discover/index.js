'use strict'

const discover = (ssdp, serviceType, timeout) => {
  ssdp.emit('ssdp:send-message', 'M-SEARCH * HTTP/1.1', {
    'ST': serviceType || 'ssdp:all',
    'MAN': 'ssdp:discover',
    'MX': 0
  })

  if (timeout) {
    return new Promise((resolve, reject) => {
      const services = []
      const listener = service => services.push(service)

      ssdp.on(`discover:${serviceType}`, listener)

      setTimeout(() => {
        ssdp.off(`discover:${serviceType}`, listener)

        resolve(services)
      }, timeout)
    })
  }

  return Promise.resolve()
}

module.exports = discover
