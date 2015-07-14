var sendSsdpMessage = require('./send-ssdp-message')

module.exports = function broadcastMessage (ssdp, socket, message, callback) {
  sendSsdpMessage(ssdp, socket, socket.options.broadcast, message, callback)
}
