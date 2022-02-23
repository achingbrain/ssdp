import http from 'http'

export async function fetch (url: string): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const request = http.get(url, {
      headers: {
        accept: 'application/xml'
      }
    }).end()

    request.on('error', (err) => {
      reject(err)
    })

    request.on('response', (response) => {
      if (response.headers['content-type'] != null && !response.headers['content-type'].includes('/xml')) {
        return reject(new Error('Bad content type ' + response.headers['content-type']))
      }

      let body = ''

      response.on('data', (chunk: Buffer) => {
        body += chunk.toString()
      })
      response.on('end', () => {
        resolve(body)
      })
      response.on('error', (err) => {
        reject(err)
      })
    })
  })
}
