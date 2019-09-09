var assert = require('assert')
const webhookController = require('../controllers/webhook.controller')
const { httpsFetch } = require('../utils')
const rewire = require('rewire')
const sinon = require('sinon')

let webHookController
let stub
before(function() {
  // set to use rewire
  webHookController = rewire('../controllers/webhook.controller')
  stub = sinon.stub()
  // set what func should return
  stub.returns({
    type: 'text',
    payload: 'payload from a stub'
  })
  // patch the function to get handleMessageType to take correct path
  webHookController.__set__('driversCache', stub)
})
describe('F1 Messenger tests', function() {
  // stub cache
  describe('webhook controller', function() {
    describe('slugifyDriver()', function() {
      it('slugifies the driver name', function() {
        const res = webhookController.slugifyDriver('Lewis Hamilton')
        assert.equal(res, 'lewis-hamilton')
      })
    })
    describe('getAllDriverSlugs()', () => {
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
      it('getAllDriverSlugs returns all drivers', () => {
        return webhookController.getAllDriverSlugs().then(result => {
          // console.log(result)
          assert(result.includes('lewis-hamilton'))
          assert(result.includes('alexander-albon'))
        })
      })
    })
    describe.only('checkDriverApi()', () => {
      it('returns true when matches', function() {
        return webhookController.checkDriverApi('Pierre Gasly').then(bool => {
          assert(bool === true)
        })
      })
      it('returns false when not matches', function() {
        return webhookController.checkDriverApi('Pierre Gaslly').then(bool => {
          assert(bool === false)
        })
      })
      it.only('gets partial names of drivers', function() {
        return webhookController.checkDriverApi('Pierre Gaslly').then(bool => {
          assert(bool === false)
        })
      })
    })
    describe('makeEntriesLower()', () => {
      it('makeEntriesLower makes entries lower', function() {
        // func takes stringified obj
        const stringified = JSON.stringify([
          {
            name: 'Test Name Here',
            name_slug: 'test-name-here'
          }
        ])
        // need to parse here to check values
        const res = JSON.parse(webhookController.makeEntriesLower(stringified))
        const ex = {
          name: 'test name here',
          name_slug: 'test-name-here'
        }
        assert.deepEqual(res[0], ex)
      })
      it('makeEntriesLower returns stringified obj', function() {
        // func takes stringified obj
        const stringified = JSON.stringify([
          {
            name: 'Test Name Here',
            name_slug: 'test-name-here'
          }
        ])
        // need to parse here to check values
        const res = webhookController.makeEntriesLower(stringified)
        assert(typeof res === 'string')
      })
    })
    describe('handleMessageType()', () => {
      it('handleMessageType handles image: returns response and calls callSendAPI; spy callSendAPI', function() {
        // replace function with a spy
        sinon.spy(webhookController, 'callSendAPI')
        return (
          webhookController
            .handleMessageType('2399043010191818', {
              message: {
                text: 'Lewis Hamilton'
              }
            })
            // check func gets called/
            .then(res => {
              // check callSendAPI called
              // console.log('count', res)
              assert(webhookController.callSendAPI.calledOnce)
              // check return value
              assert.deepEqual(res.attachment, {
                type: 'image',
                payload: {
                  url:
                    'https://f1-cards.herokuapp.com//api/driver/lewis-hamilton',
                  is_reusable: true
                }
              })
              webhookController.callSendAPI.restore()
            })
        )
      })
      // stub of checkInputText not working
      it('handleMessageType handles image: returns response and calls callSendAPI; spy callSendAPI; stub checkInputText', function() {
        // replace function with a spy
        sinon.spy(webhookController, 'callSendAPI')
        // console.log('res', webHookController.callSendAPI)

        // stub checkInputText - forced to return an image type
        let stub = sinon.stub()
        stub.returns({
          type: 'image',
          url: 'some image Url',
          is_reusable: true
        })
        // console.log('stub', stub())
        webHookController.__set__('checkInputText', stub)
        return (
          webhookController
            .handleMessageType('2399043010191818', {
              message: {
                text: 'Lewis Hamilton'
              }
            })
            // check func gets called/
            .then(res => {
              // check callSendAPI called
              // console.log('count', webhookController.callSendAPI.callCount)
              assert(webhookController.callSendAPI.calledOnce)
              // check return value
              assert.deepEqual(res.attachment, {
                type: 'image',
                payload: {
                  url:
                    'https://f1-cards.herokuapp.com//api/driver/lewis-hamilton',
                  is_reusable: true
                }
              })
              webhookController.callSendAPI.restore()
              stub.reset()
            })
        )
      })
      it('handleMessageType handles image: returns response and calls callSendAPI', function() {
        // webhookController.callSendAPI.restore()
        // replace function with a spy
        sinon.spy(webhookController, 'callSendAPI')
        // console.log(typeof webHookController.callSendAPI)
        return (
          webhookController
            .handleMessageType('2399043010191818', {
              message: {
                text: 'Lewis Hamilton'
              }
            })
            // check func gets called/
            .then(res => {
              // console.log('RES', res)
              // check callSendAPI called
              assert(webhookController.callSendAPI.calledOnce)
              // check return value
              assert.deepEqual(res.attachment, {
                type: 'image',
                payload: {
                  url:
                    'https://f1-cards.herokuapp.com//api/driver/lewis-hamilton',
                  is_reusable: true
                }
              })
              webhookController.callSendAPI.restore()
            })
        )
      })
      it('handleMessageType calls checkInput text when passed text; spy checkTextInput', function() {
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
              // console.log(res)
              // check that callSendAPI is called
              assert(webhookController.checkInputText.calledOnce)
              // check return value
              assert.deepEqual(res, { text: 'Filler text for now' })
              webhookController.checkInputText.restore()
            })
        )
      })
    })
    describe('checkInputText()', () => {
      it('checkInputText returns filler text', function() {
        return (
          webhookController
            .checkInputText('Just some text')
            // check func gets called/
            .then(res => {
              assert(res.payload === 'Filler text for now')
            })
        )
      })
      it('checkInputText returns greeting prompt', function() {
        return webhookController.checkInputText('hello').then(res => {
          assert.strictEqual(
            res.payload,
            'Welcome to Formula1 Cards. To get a card enter the name of the Formula1 driver.'
          )
        })
      })
      it('checkInputText returns help prompt ', function() {
        return webhookController.checkInputText('help').then(res => {
          assert.strictEqual(res.payload, 'What can we do to help you today?')
        })
      })
      it('checkInputText returns driver', function() {
        // set to use rewire
        // let webHookController = rewire('../controllers/webhook.controller')
        const fakeCache = {
          'fake-test-driver': {
            imageUrl: 'fake url',
            timeStamp: new Date('Wed Sep 04 2019 13:27:11 GMT-0600')
          }
        }
        webHookController.__set__('driversCache', fakeCache)
        return webHookController
          .checkInputText('Lewis Hamilton', fakeCache)
          .then(res1 => {
            res1.payload.then(payload => {
              assert(
                payload.hasOwnProperty('slug') &&
                  payload.hasOwnProperty('imageUrl')
              )
              assert(payload.slug === 'lewis-hamilton')
              // check that new driver added to cache
              assert(
                Object.keys(webHookController.__get__('driversCache')).includes(
                  'lewis-hamilton'
                )
              )
            })
          })
      })
      it('checks for partial names', function() {
        const fakeCache = {
          'fake-test-driver': {
            imageUrl: 'fake url',
            timeStamp: new Date('Wed Sep 04 2019 13:27:11 GMT-0600')
          }
        }
        return webHookController
          .checkInputText('lewis', fakeCache)
          .then(res => console.log('res', res))
      })
    })
    describe('extractDriverNames', () => {
      it('test', function() {
        const arr = [
          { name: 'Test Driver 1', name_slug: 'test-driver1' },
          { name: 'Test Driver 2', name_slug: 'test-driver2' },
          { name: 'Some Driver 3', name_slug: 'some-driver3' }
        ]
        const res = webHookController.extractDriverNames(arr)
        assert(res, Array.isArray(res))
        assert(res[0].hasOwnProperty('firstName'))
        assert(res[0]['firstName'] === 'test')
        assert(res[2].hasOwnProperty('lastName'))
        assert(res[2]['firstName'] === 'some')
        // assert(false, res)
      })
    })
    describe('cacheAndGetDriver()', () => {
      it('cacheAndGetDriver adds to cache', function() {
        const fakeCache = {
          'test-driver': 'An image here'
        }
        const res = webhookController.cacheAndGetDriver(
          'test-driver',
          fakeCache
        )
        // console.log('res', res)
      })
      it('cacheAndGetDriver adds to cache', function() {
        // let webHookController = rewire('../controllers/webhook.controller')
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
    })
    describe('verifyTimeStamp()', () => {
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
})
