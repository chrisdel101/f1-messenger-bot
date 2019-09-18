const https = require('https')
const moment = require('moment')

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
// check if timestamp is older than mins entered
exports.verifyTimeStamp = (timeStamp, mins) => {
  // console.log('verify')
  const d1 = new moment(timeStamp)
  const d2 = new moment()
  // subract time1 from time 2
  const diff = moment.duration(d2.diff(d1)).asMinutes()
  // console.log('diff', diff)
  // less than 30 mins true, else false
  return diff < mins ? true : false
}
