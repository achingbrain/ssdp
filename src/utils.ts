import type { NetworkAddress, SSDPSocket } from './index.js'

export function isIpv4Address (address: string): boolean {
  const parts = address.trim().split('.')

  if (parts.length !== 4) {
    return false
  }

  for (let i = 0; i < parts.length; i++) {
    const octet = parseInt(parts[i], 10)

    if (octet < 0 || octet > 255) {
      return false
    }
  }

  return true
}

export const addressFamilyMismatch = (remote: NetworkAddress, socket: SSDPSocket): boolean => {
  return isIpv4Address(remote.address) ? socket.type !== 'udp4' : socket.type !== 'udp6'
}
