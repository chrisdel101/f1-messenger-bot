var assert = require('assert')
const webhookController = require('../controllers/webhook.controller')
const { httpsFetch } = require('../utils')

describe('F1 Messenger tests', function() {
  describe('webhook controller', function() {
    it('slugifies the driver name', function() {
      const res = webhookController.slugifyDriver('Lewis Hamilton')
      assert.equal(res, 'lewis-hamilton')
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
    it('checkDriverApi returns true when matches', function() {
      return webhookController.checkDriverApi('Pierre Gasly').then(bool => {
        assert(bool === true)
      })
    })
    it('checkDriverApi returns false when not matches', function() {
      return webhookController.checkDriverApi('Pierre Gaslly').then(bool => {
        assert(bool === false)
      })
    })
    it.skip('handleMessage', function() {
      return webhookController
        .handleMessage('2399043010191818', {
          message: {
            text: 'blah blah'
          }
        })
        .then(res => {
          console.log(res.statusCode)
          assert(res.statusCode, '400')
        })
    })
    it('checkText returns greeting prompt', function() {
      return webhookController.checkText('hello').then(res => {
        assert.strictEqual(
          res,
          'Welcome to Formula1 Cards. To get a card enter the name of the Formula1 driver.'
        )
      })
    })
    it('checkText returns help prompt ', function() {
      return webhookController.checkText('help').then(res => {
        assert.strictEqual(res, 'What can we do to help you today?')
      })
    })
    it('handleDriversCache adds to cache', function() {
      const fakeCache = {
        'test-driver': 'An image here'
      }
      const res = webhookController.handleDriversCache('test-driver', fakeCache)
      console.log('res', res)
    })
    it.only('handleDriversCache adds to cache', function() {
      const fakeCache = {
        'lewis11-hamilton': {
          image: 'An image',
          timeStamp: new Date()
        }
      }
      const res = webhookController
        .handleDriversCache('lewis-hamilton', fakeCache)
        .then(res => {
          console.log('res', res)
        })
    })
  })
})
