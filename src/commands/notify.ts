import { cache } from '../cache.js'
import { resolveService } from './resolve-service.js'
import type { NotfiyMessage, SSDP } from '../index.js'

export const ALIVE = 'ssdp:alive'
export const BYEBYE = 'ssdp:byebye'

export function notify (ssdp: SSDP, message: NotfiyMessage) {
  if (message.LOCATION == null || message.USN == null || message.NT == null || message.NTS == null) {
    return
  }

  if (message.NTS === BYEBYE) {
    cache.deleteService(message.NT, message.USN)

    ssdp.emit('service:remove', message.USN)

    return
  }

  resolveService(ssdp, message.USN, message.NT, message.LOCATION, message.ttl())
    .catch(err => {
      ssdp.emit('error', err)
    })
}
