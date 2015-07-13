
module.exports = function ssdpHeaders (method, headers) {
  var message = [
    method
  ]

  Object.keys(headers).forEach(function (header) {
    message.push(header + ': ' + headers[header])
  })

  message.push('\r\n')

  return new Buffer(message.join('\r\n'))
}
