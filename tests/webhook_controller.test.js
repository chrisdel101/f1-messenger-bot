var assert = require('assert')
const webhookController = require('../controllers/webhook.controller')
const { httpsFetch } = require('../utils')

describe('F1 Messenger tests', function() {
  describe('webhook controller', function() {
    it('slugifies the driver name', function() {
      const res = webhookController.slugifyDriver('Lewis Hamilton')
      assert.equal(res, 'lewis-hamilton')
    })
  })
  it('getAllDriverSlugs returns an array', function() {
    return webhookController.getAllDriverSlugs().then(result => {
      // unparsed json
      assert(typeof result === 'string')
      //   parse Json
      const parsed = JSON.parse(result)
      assert(Array.isArray(parsed))
    })
  })
  //   check json string before parsing
  it('getAllDriverSlugs returns all drivers', function() {
    return webhookController.getAllDriverSlugs().then(result => {
      assert(result.includes('lewis-hamilton'))
      assert(result.includes('alexander-albon'))
    })
  })
  it('isDriverName returns true when matches', function() {
    return webhookController.isDriverName('Pierre Gasly').then(bool => {
      assert(bool === true)
    })
  })
  it('isDriverName returns false when not matches', function() {
    return webhookController.isDriverName('Pierre Gaslly').then(bool => {
      assert(bool === false)
    })
  })
})
it('handleMessage', function() {
  //   webhookController.handleMessage('2399043010191818', {
  //     message: {
  //       text: 'blah blah'
  //     }
  //   })
})
