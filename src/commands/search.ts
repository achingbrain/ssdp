import { adverts } from '../adverts.js'
import type { NetworkAddress, SearchMessage, SSDP } from '../index.js'

export function search (ssdp: SSDP, message: SearchMessage, remote: NetworkAddress): void {
  if (message.ST == null) {
    return
  }

  adverts.forEach(advert => {
    if (message.ST === 'ssdp:all' || advert.usn.toLowerCase() === message.ST.toLowerCase()) {
      ssdp.emit('ssdp:send-message', 'HTTP/1.1 200 OK', {
        ST: message.ST === 'ssdp:all' ? advert.usn : message.ST,
        USN: `${ssdp.udn}::${advert.usn}`,
        LOCATION: advert.location,
        'CACHE-CONTROL': `max-age=${Math.round(advert.ttl / 1000)}`,
        DATE: new Date().toUTCString(),
        SERVER: ssdp.signature,
        EXT: ''
      }, remote)
    }
  })
}
