var assert = require('assert')
const webhookController = require('../controllers/webhook.controller')
const { httpsFetch } = require('../utils')
const rewire = require('rewire')
const sinon = require('sinon')

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
    it('handleMessageType calls callSendAPI on success', function() {
      // replace function with a spy
      sinon.spy(webhookController, 'callSendAPI')
      // console.log(webhookController.callSendAPI)
      return (
        webhookController
          .handleMessageType('2399043010191818', {
            message: {
              text: 'Lewis Hamilton'
            }
          })
          // check func gets called/
          .then(res => {
            assert(webhookController.callSendAPI.calledOnce)
          })
      )
    })
    it('handleMessageType calls checkInput text when passed text', function() {
      // replace function with a spy
      sinon.spy(webhookController, 'checkInputText')
      return (
        webhookController
          .handleMessageType('2399043010191818', {
            message: {
              text: 'Some text passed in'
            }
          })
          // check func gets called/

          .then(res => {
            assert(webhookController.checkInputText.calledOnce)
          })
      )
    })
    it('checkInputText returns greeting prompt', function() {
      return webhookController.checkInputText('hello').then(res => {
        assert.strictEqual(
          res,
          'Welcome to Formula1 Cards. To get a card enter the name of the Formula1 driver.'
        )
      })
    })
    it('checkInputText returns help prompt ', function() {
      return webhookController.checkInputText('help').then(res => {
        assert.strictEqual(res, 'What can we do to help you today?')
      })
    })
    it('checkInputText returns driver', function() {
      // set to use rewire
      let webHookController = rewire('../controllers/webhook.controller')
      this.fakeCache = {
        'fake-test-driver': {
          imageUrl: 'fake url',
          timeStamp: new Date('Wed Sep 04 2019 13:27:11 GMT-0600')
        }
      }
      webHookController.__set__('driversCache', this.fakeCache)
      return webHookController
        .checkInputText('Lewis Hamilton', this.fakeCache)
        .then(res => {
          // console.log(res)
          assert(res.hasOwnProperty('slug') && res.hasOwnProperty('imageUrl'))
          assert(res.slug === 'lewis-hamilton')
          // check that new driver added to cache
          assert(
            Object.keys(webHookController.__get__('driversCache')).includes(
              'lewis-hamilton'
            )
          )
        })
    })
    it('cacheAndGetDriver adds to cache', function() {
      const fakeCache = {
        'test-driver': 'An image here'
      }
      const res = webhookController.cacheAndGetDriver('test-driver', fakeCache)
      console.log('res', res)
    })
    it('cacheAndGetDriver adds to cache', function() {
      let webHookController = rewire('../controllers/webhook.controller')
      const fakeCache = {
        'lewis-hamilton': {
          imageUrl: 'An image Url',
          timeStamp: new Date()
        }
      }
      webHookController.__set__('driversCache', fakeCache)
      // check if cache has that key
      webhookController
        .cacheAndGetDriver('alexander-albon', fakeCache)
        .then(res => {
          // console.log('RES', res)
          // console.log('REQ', rewired_WebHookController.__get__('driversCache'))
          // check that new key was added
          assert(res.hasOwnProperty('slug') && res.hasOwnProperty('imageUrl'))
          // check url is formed correct
          assert(
            res.imageUrl ===
              'https://f1-cards.herokuapp.com//api/driver/alexander-albon'
          )
        })
        .catch(e => {
          console.error(e)
        })
    })
    it('verifyTimeStamp returns true', function() {
      // older than 30 mins
      const fakeCache = {
        'lewis-hamilton': {
          imageUrl: 'An image Url',
          timeStamp: new Date('2019-09-04 19:30:26')
        }
      }
      const res = webhookController.verifyTimeStamp(
        fakeCache['lewis-hamilton'].timeStamp
      )
      assert(!res)
    })
    it('verifyTimeStamp returns true when less than 30 mins', function() {
      // return exact same time as func
      const fakeCache = {
        'lewis-hamilton': {
          imageUrl: 'An image Url',
          timeStamp: new Date()
        }
      }
      const res = webhookController.verifyTimeStamp(
        fakeCache['lewis-hamilton'].timeStamp
      )
      assert(res)
    })
    it('verifyTimeStamp returns false', function() {
      // return exact same time as func
      const fakeCache = {
        'lewis-hamilton': {
          imageUrl: 'An image Url',
          timeStamp: new Date('Wed Sep 04 2019 13:27:11 GMT-0600')
        }
      }
      const res = webhookController.verifyTimeStamp(
        fakeCache['lewis-hamilton'].timeStamp
      )
      assert(res === false)
    })
  })
})
