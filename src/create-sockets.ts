import { createSocket } from 'dgram'
import type { SSDP, SSDPSocket } from './index.js'

export async function createSockets (ssdp: SSDP, signal: AbortSignal): Promise<SSDPSocket[]> {
  const sockets: SSDPSocket[] = []

  await Promise.allSettled(
    ssdp.options.sockets.map(async options => {
      return new Promise<void>((resolve, reject) => {
        const socket = createSocket({
          type: options.type,
          reuseAddr: true,
          signal
        }, (buf, info) => {
          ssdp.emit('transport:incoming-message', buf, info)
        })
        socket.bind(options.bind.port, options.bind.address)
        // @ts-expect-error .options is not a property of Socket
        socket.options = options
        socket.on('error', (err) => {
          ssdp.emit('error', err)
        })
        socket.on('listening', () => {
          try {
            socket.addMembership(options.broadcast.address, socket.address().address)
            socket.setBroadcast(true)
            socket.setMulticastTTL(options.maxHops)

            sockets.push(socket as SSDPSocket)

            resolve()
          } catch (err: any) {
            log.error('adding membership %s failed - %e', options.broadcast.address, err)
            reject(err as Error)
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
