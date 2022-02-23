import type { NetworkAddress, SSDP, SSDPSocket } from './index.js'

function isIpv4Address (address: string) {
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

const addressFamilyMismatch = (remote: NetworkAddress, socket: SSDPSocket) => {
  return !(socket.type === 'udp4' && isIpv4Address(remote.address))
}

export function sendSsdpMessage (ssdp: SSDP, status: string, headers: Record<string, string>, remote: NetworkAddress) {
  Promise.all(
    ssdp.sockets.map(async socket => {
      return await new Promise<void>((resolve, reject) => {
        if (socket.closed) {
          return resolve()
        }

        const recipient = remote ?? socket.options.broadcast

        // don't send messages over udp6 sockets and expect them to reach upd4 recipients
        if (recipient != null && addressFamilyMismatch(recipient, socket)) {
          return resolve()
        }

        if (headers.LOCATION != null) {
          // TODO: wat
          // @ts-expect-error
          headers.LOCATION = headers.LOCATION[socket.type]
        }

        const message = [status]

        if (!status.startsWith('HTTP/1.1')) {
          // not a response so insert the host header
          message.push(`HOST: ${socket.options.broadcast.address}:${socket.options.broadcast.port}`)
        }

        Object.keys(headers).forEach(function (header) {
          message.push(`${header}: ${headers[header]}`)
        })

        message.push('\r\n')

        const buffer = Buffer.from(message.join('\r\n'))

        ssdp.emit('transport:outgoing-message', socket, buffer, recipient)

        socket.send(buffer, 0, buffer.length, recipient.port, recipient.address, error => {
          if (error != null) {
            return reject(error)
          }

          resolve()
        })
      })
    })
  ).catch(err => {
    ssdp.emit('error', err)
  })
}
