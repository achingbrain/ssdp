import { createSocket } from 'node:dgram'
import type { SSDP, SSDPSocket } from './index.js'

export async function createSockets (ssdp: SSDP, signal: AbortSignal): Promise<SSDPSocket[]> {
  const sockets: SSDPSocket[] = []

  await Promise.allSettled(
    (ssdp.options.sockets ?? []).map(async options => {
      return new Promise<void>((resolve, reject) => {
        const socket = createSocket({
          type: options.type ?? 'udp4',
          ipv6Only: options.type === 'udp6',
          reuseAddr: true,
          signal
        }, (buf, info) => {
          ssdp.emit('transport:incoming-message', buf, info)
        })
        socket.bind(options.bind?.port, options.bind?.address)
        // @ts-expect-error .options is not a property of Socket
        socket.options = options
        socket.on('error', (err) => {
          ssdp.emit('error', err)
        })
        socket.on('listening', () => {
          try {
            socket.setBroadcast(true)

            if (options.broadcast?.address != null) {
              socket.addMembership(options.broadcast.address, socket.address().address)
            }

            if (options.maxHops != null) {
              socket.setMulticastTTL(options.maxHops)
            }

            sockets.push(socket as SSDPSocket)

            resolve()
          } catch (error: any) {
            error.message = `Adding membership ${options.broadcast?.address} failed - ${error.message}`
            reject(error)
          }
        })
      })
    })
  )

  if (sockets.length === 0) {
    throw new Error('Opening all sockets failed')
  }

  return sockets
}
