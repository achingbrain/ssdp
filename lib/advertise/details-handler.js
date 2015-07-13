var xml2js = require('xml2js')

module.exports = function detailsHandler (createDetails, request, response) {
  createDetails(function (error, details) {
    if (error) {
      response.writeHead(500)
      return response.end(error)
    }

    var builder = new xml2js.Builder()
    var xml = builder.buildObject(details)

    response.writeHead(200, {'Content-Type': 'text/xml'})
    response.end(xml)
  })
}
