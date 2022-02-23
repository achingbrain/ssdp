import type { SSDP } from '../index.js'

export function discover (ssdp: SSDP, serviceType?: string) {
  serviceType = serviceType ?? 'ssdp:all'

  ssdp.emit('ssdp:send-message', 'M-SEARCH * HTTP/1.1', {
    ST: serviceType,
    MAN: 'ssdp:discover',
    MX: 0
  })
}
