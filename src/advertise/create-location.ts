import http from 'http'
import { freeport } from 'freeport-promise'
import { detailsHandler } from './details-handler.js'
import { findAllInterfaces } from './find-all-interfaces.js'
import type { Advert } from './index.js'
import type { SSDP } from '../index.js'

export async function createLocation (ssdp: SSDP, advert: Advert): Promise<() => Promise<void>> {
  if (advert.location != null) {
    return async () => Promise.resolve()
  }

  const servers: http.Server[] = []

  advert.location = {}

  await Promise.all(
    ssdp.sockets.map(async socket => Promise.all(
      findAllInterfaces(socket.type === 'udp4' && advert.ipv4, socket.type === 'udp6' && advert.ipv6)
        .map(async iface => {
          await freeport()
            .then(async port => {
              await new Promise<void>((resolve, reject) => {
                let location = 'http://'

                if (socket.type === 'udp6') {
                  location += `[${iface.address}]`
                } else {
                  location += iface.address
                }

                location += `:${port}`

                advert.location[socket.type] = location

                const server = http.createServer((req, res) => {
                  detailsHandler(advert.details, req, res)
                })

                const addr = socket.address()

                server.listen(port, addr.address, () => {
                  resolve()
                })
                server.on('error', err => {
                  reject(err)
                })

                servers.push(server)
              })
            })
        }))
    )
  )

  return async () => {
    await Promise.all(
      servers.map(async server => new Promise<void>((resolve, reject) => {
        server.close()
        resolve()
      }))
    )
  }
}
