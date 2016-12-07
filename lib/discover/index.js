
const search = (ssdp, serviceType) => {
  ssdp.emit('ssdp:send-message', 'M-SEARCH * HTTP/1.1', {
    'ST': serviceType || 'ssdp:all',
    'MAN': 'ssdp:discover',
    'MX': 0
  })
}

module.exports = search
