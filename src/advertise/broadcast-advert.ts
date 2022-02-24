import type { Advert } from './index.js'
import type { SSDP } from '../index.js'

export const broadcastAdvert = (ssdp: SSDP, advert: Advert, notifcationSubType: string) => {
  ssdp.emit('ssdp:send-message', 'NOTIFY * HTTP/1.1', {
    NT: advert.usn,
    NTS: notifcationSubType,
    USN: `${advert.usn}::${ssdp.udn}`,
    'CACHE-CONTROL': `max-age=${Math.round(advert.ttl / 1000)}`,
    SERVER: ssdp.signature,
    LOCATION: advert.location
  })
}
