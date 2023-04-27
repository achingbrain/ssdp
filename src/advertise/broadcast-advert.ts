import type { Advert } from './index.js'
import type { SSDP } from '../index.js'

export const broadcastAdvert = (ssdp: SSDP, advert: Advert, notifcationSubType: string): void => {
  ssdp.emit('ssdp:send-message', 'NOTIFY * HTTP/1.1', {
    NT: advert.usn,
    NTS: notifcationSubType,
    USN: `${ssdp.udn}::${advert.usn}`,
    'CACHE-CONTROL': `max-age=${Math.round(advert.ttl / 1000)}`,
    SERVER: ssdp.signature,
    LOCATION: advert.location
  })
}
