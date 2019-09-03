const https = require('https')
exports.httpsFetch = url => {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      res.setEncoding('utf8')
      res.on('data', d => {
        resolve(d)
      })
    })
  })
}
