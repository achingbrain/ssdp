import { resolveService } from '../commands/resolve-service.js'
import type { SearchMessage, SSDP } from '../index.js'

export function searchResponse (ssdp: SSDP, message: SearchMessage): void {
  resolveService(ssdp, message.USN, message.ST, message.LOCATION, message.ttl())
    .catch(err => {
      ssdp.emit('error', err)
    })
}
