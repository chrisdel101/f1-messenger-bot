const assert = require('assert')
let webhookController = require('../controllers/webhook.controller')
let driverController = require('../controllers/driver.controller')
const { httpsFetch } = require('../utils')
const rewire = require('rewire')
const sinon = require('sinon')
const responses = require('../responses.json')

let stub
before(function() {
  // set to use rewire
  webHookController = rewire('../controllers/webhook.controller')
  driverController = rewire('../controllers/driver.controller')
  stub = sinon.stub()
  // set what func should return
  stub.returns({
    type: 'text',
    payload: 'fake cache payload - from a stub'
  })
  // patch the function to get handleMessageType to take correct path
  webHookController.__set__('driversCache', stub)
})
describe('F1 Messenger tests', function() {
  // stub cache
  describe('webhook controller', function() {
    describe('getAllDriverSlugs()', () => {
      it('getAllDriverSlugs returns an array', function() {
        return driverController.getAllDriverSlugs().then(result => {
          // unparsed json
          assert(typeof result === 'string')
          //   parse Json
          const parsed = JSON.parse(result)
          assert(Array.isArray(parsed))
        })
      })
      //   check json string before parsing
      it('getAllDriverSlugs returns all drivers', () => {
        return driverController.getAllDriverSlugs().then(result => {
          // console.log(result)
          assert(result.includes('lewis-hamilton'))
          assert(result.includes('alexander-albon'))
        })
      })
    })
    describe.only('cacheAndGetDrivers()', () => {
      it('cacheAndGetDrivers adds driver slugs array to cache', function() {
        const fakeCache = {}
        driverController.cacheAndGetDrivers(fakeCache).then(res => {
          // console.log(fakeCache['drivers'])
          assert(fakeCache.hasOwnProperty('drivers_slugs'))
          assert(fakeCache.drivers_slugs.hasOwnProperty('drivers_slugs'))
          assert(Array.isArray(fakeCache.drivers_slugs['drivers_slugs']))
        })
      })
      it('cacheAndGetDrivers returns drivers arr after caching', function() {
        const fakeCache = {}
        driverController.cacheAndGetDrivers(fakeCache).then(res => {
          assert(Array.isArray(res))
          assert(res.length > 0)
        })
      })
      it('cacheAndGetDrivers adds timestamp to cache', function() {
        const fakeCache = {}
        driverController.cacheAndGetDrivers(fakeCache).then(res => {
          assert(fakeCache.drivers_slugs.hasOwnProperty('timeStamp'))
        })
      })
      it('cacheAndGetDrivers gets values from cache', function() {
        sinon.spy(driverController, 'verifyTimeStamp')
        sinon.spy(driverController, 'getAllDriverSlugs')
        const fakeCache = {
          drivers_slugs: {
            drivers_slugs: [{ name: 'Test Name1', name_slug: 'test-name1' }],
            timeStamp: new Date('2019-09-04 19:30:26')
          }
        }
        Promise.resolve(driverController.cacheAndGetDrivers(fakeCache)).then(
          res => {
            // should call buy bypass verifyTimeStamp
            assert(driverController.verifyTimeStamp.calledOnce)
            // should bypass call to API
            assert(driverController.getAllDriverSlugs.notCalled)
            // check cache value
            assert.deepEqual(res, {
              drivers_slugs: [{ name: 'Test Name1', name_slug: 'test-name1' }],
              timeStamp: new Date('2019-09-05T01:30:26.000Z')
            })
            driverController.getAllDriverSlugs.restore()
            driverController.verifyTimeStamp.restore()
          }
        )
      })
      it('cacheAndGetDrivers fails timestamp validation', function() {
        sinon.spy(driverController, 'getAllDriverSlugs')
        const fakeCache = {
          drivers_slugs: {
            drivers_slugs: [{ name: 'Test Name1', name_slug: 'test-name1' }],
            timeStamp: new Date('2019-09-04 19:30:26')
          }
        }
        Promise.resolve(driverController.cacheAndGetDrivers(fakeCache)).then(
          res => {
            // does not call API function
            assert.ok(!driverController.getAllDriverSlugs.calledOnce)
            driverController.getAllDriverSlugs.restore()
          }
        )
      })
    })
    describe('checkDriverApi()', () => {
      it('returns true when matches', function() {
        return driverController.checkDriverApi('Pierre Gasly').then(res => {
          console.log(res)
          assert.strictEqual(res, 'pierre-gasly')
        })
      })
      it('returns false when not matches', function() {
        return driverController.checkDriverApi('Pierre Gaslly').then(res => {
          assert(res === false)
        })
      })
      it('gets partial names of drivers', function() {
        return driverController.checkDriverApi('lewi').then(res => {
          assert(res === false)
        })
      })
      it('gets partial names of drivers', function() {
        return driverController.checkDriverApi('lewis').then(res => {
          assert.strictEqual(res, 'lewis-hamilton')
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
        const res = JSON.parse(driverController.makeEntriesLower(stringified))
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
        const res = driverController.makeEntriesLower(stringified)
        assert(typeof res === 'string')
      })
    })
    describe('handleMessageType()', () => {
      it('handleMessageType handles partial driver name', function() {
        // replace function with a spy
        sinon.spy(webhookController, 'callSendAPI')
        return (
          // call with partial name
          webhookController
            .handleMessageType('2399043010191818', {
              message: {
                text: 'pierre'
              }
            })
            // check func gets called/
            .then(res => {
              // check callSendAPI called
              assert(webhookController.callSendAPI.calledOnce)
              // check return value
              assert.deepEqual(res.attachment, {
                type: 'image',
                payload: {
                  url: 'https://f1-cards.herokuapp.com/api/driver/pierre-gasly',
                  is_reusable: true
                }
              })
              webhookController.callSendAPI.restore()
            })
        )
      })
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
                    'https://f1-cards.herokuapp.com/api/driver/lewis-hamilton',
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
                    'https://f1-cards.herokuapp.com/api/driver/lewis-hamilton',
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
                    'https://f1-cards.herokuapp.com/api/driver/lewis-hamilton',
                  is_reusable: true
                }
              })
              webhookController.callSendAPI.restore()
            })
        )
      })
      it.skip('handleMessageType calls checkInput text when passed text; spy checkTextInput', function() {
        // replace function with a spy
        sinon.spy(webhookController, 'checkInputText')
        // let spy = sinon.spy()
        // driverController.__set__('checkInputText', spy)
        console.log(webhookController)
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
              assert(driverController.checkInputText.calledOnce)
              // check return value
              // assert.deepEqual(res, { text: responses.filler })
              // driverController.checkInputText.restore()
            })
        )
      })
    })
    describe('checkInputText()', () => {
      it('checkInputText returns card.driver response', function() {
        return (
          driverController
            .checkInputText('racer')
            // check func gets called/
            .then(res => {
              assert.strictEqual(res.payload, responses.card.driver)
            })
        )
      })
      it('checkInputText returns filler text', function() {
        return (
          driverController
            .checkInputText('Just some text')
            // check func gets called/
            .then(res => {
              assert(res.payload, responses.filler)
            })
        )
      })
      it('checkInputText returns greeting prompt - lowercase', function() {
        return driverController.checkInputText('hello').then(res => {
          assert.strictEqual(
            res.payload,
            'Welcome to Formula1 Cards. To get a card enter the name of the Formula1 driver.'
          )
        })
      })
      it('checkInputText returns help prompt - lowercase ', function() {
        return driverController.checkInputText('help').then(res => {
          assert.strictEqual(res.payload, 'What can we do to help you today?')
        })
      })
      it('checkInputText returns help prompt - uppercase ', function() {
        return driverController.checkInputText('HELP').then(res => {
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
        driverController.__set__('driversCache', fakeCache)
        return driverController
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
                Object.keys(driverController.__get__('driversCache')).includes(
                  'lewis-hamilton'
                )
              )
            })
          })
      })
      it('checks for partial names - returns correct driver slug and URL', function() {
        const fakeCache = {
          'fake-test-driver': {
            imageUrl: 'fake url',
            timeStamp: new Date('Wed Sep 04 2019 13:27:11 GMT-0600')
          }
        }
        return driverController
          .checkInputText('lewis', fakeCache)
          .then(res => {
            res.payload
              .then(payload => {
                assert.strictEqual(payload.slug, 'lewis-hamilton')
                assert.strictEqual(
                  payload.imageUrl,
                  'https://f1-cards.herokuapp.com/api/driver/lewis-hamilton'
                )
              })
              .catch(e => {
                assert.fail()
                console.error(
                  'error in checkInputText(): checks for partial names - returns correct driver slug and URL',
                  e
                )
              })
          })
          .catch(e => {
            assert.fail()
            console.error(
              'error in checkInputText() - checks for partial names - returns correct driver slug and URL',
              e
            )
          })
      })
      it('checks for partial names - returns correct obj', function() {
        const fakeCache = {
          'fake-test-driver': {
            imageUrl: 'fake url',
            timeStamp: new Date('Wed Sep 04 2019 13:27:11 GMT-0600')
          }
        }
        return driverController
          .checkInputText('lewis', fakeCache)
          .then(res => {
            res.payload
              .then(payload => {
                assert.deepEqual(payload, {
                  slug: 'lewis-hamilton',
                  imageUrl:
                    'https://f1-cards.herokuapp.com/api/driver/lewis-hamilton',
                  timeStamp: new Date()
                })
              })
              .catch(e => {
                console.error(
                  'error in checks for partial names - returns returns correct obj bottom',
                  e
                )
              })
          })
          .catch(e => {
            console.error(
              'error in checks for partial names - returns returns correct obj top',
              e
            )
          })
      })
      it('checks for partial names - uppercase', function() {
        const fakeCache = {
          'fake-test-driver': {
            imageUrl: 'fake url',
            timeStamp: new Date('Wed Sep 04 2019 13:27:11 GMT-0600')
          }
        }
        return driverController
          .checkInputText('VALTERI', fakeCache)
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
        const res = driverController.extractDriverNames(arr)
        assert(res, Array.isArray(res))
        assert(res[0].hasOwnProperty('firstName'))
        assert(res[0]['firstName'] === 'test')
        assert(res[2].hasOwnProperty('lastName'))
        assert(res[2]['firstName'] === 'some')
      })
    })
    describe('cacheAndGetDriver()', () => {
      it('cacheAndGetDriver adds to cache', function() {
        // let webHookController = rewire('../controllers/webhook.controller')
        const fakeCache = {
          'lewis-hamilton': {
            imageUrl: 'An image Url',
            timeStamp: new Date()
          }
        }
        driverController.__set__('driversCache', fakeCache)
        // check if cache has that key
        driverController
          .cacheAndGetDriver('alexander-albon', fakeCache)
          .then(res => {
            // console.log('RES', res)
            // check that new key was added
            assert(res.hasOwnProperty('slug') && res.hasOwnProperty('imageUrl'))
            // check url is formed correct
            assert.strictEqual(
              res.imageUrl,
              'https://f1-cards.herokuapp.com/api/driver/alexander-albon'
            )
          })
          .catch(e => {
            console.error('error in cacheAndGetDriver() - adds to cache', e)
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
        const res = driverController.verifyTimeStamp(
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
        const res = driverController.verifyTimeStamp(
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
        const res = driverController.verifyTimeStamp(
          fakeCache['lewis-hamilton'].timeStamp
        )
        assert(res === false)
      })
    })
  })
})
