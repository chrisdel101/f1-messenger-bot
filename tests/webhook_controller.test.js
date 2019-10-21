const assert = require('assert')
let webhookController = require('../controllers/webhook.controller')
let driverController = require('../controllers/driver.controller')
let teamController = require('../controllers/team.controller')
const utils = require('../utils')
const rewire = require('rewire')
const sinon = require('sinon')
const responses = require('../responses.json')
const { mockRequest, mockResponse } = require('mock-req-res')

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
describe('webhook controller', function() {
  describe('sendHookResponse()', () => {
    it.skip('tests', function() {
      let options = {
        body: { object: 'page' }
      }
      const req = mockRequest(options)
      const res = mockResponse()

      sinon.spy(webhookController, 'handleMessageType')
      const result = webhookController.sendHookResponse(req, res)
      console.log(result)
    })
  })
  describe('handleMessageType()', () => {
    it('handleMessageType handles partial driver name - non-mobile URL', function() {
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
            console.log(utils.viewCache())
            console.log('\n')
            webhookController.callSendAPI.restore()
          })
      )
    })
    it('handleMessageType handles partial driver name - mobile URL', function() {
      // replace function with a spy
      sinon.spy(webhookController, 'callSendAPI')
      return (
        // call with partial name
        webhookController
          .handleMessageType(
            '2399043010191818',
            {
              message: {
                text: 'pierre'
              }
            },
            'mobile'
          )
          // check func gets called/
          .then(res => {
            // check callSendAPI called
            assert(webhookController.callSendAPI.calledOnce)
            // check return value
            console.log('res', res)
            assert.deepEqual(res.attachment, {
              type: 'image',
              payload: {
                url:
                  'https://f1-cards.herokuapp.com/api/mobile/driver/pierre-gasly',
                is_reusable: true
              }
            })
            console.log(utils.viewCache())
            webhookController.callSendAPI.restore()
          })
      )
    })
    it('handleMessageType handles driver image: returns response and calls callSendAPI; spy callSendAPI', function() {
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
                url: 'https://f1-cards.herokuapp.com/api/driver/lewis-hamilton',
                is_reusable: true
              }
            })
            webhookController.callSendAPI.restore()
          })
      )
    })
    // stub of checkInputText not working
    it('handleMessageType handles driver mage: returns response and calls callSendAPI; spy callSendAPI; stub checkInputText', function() {
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
                url: 'https://f1-cards.herokuapp.com/api/driver/lewis-hamilton',
                is_reusable: true
              }
            })
            webhookController.callSendAPI.restore()
            stub.reset()
          })
      )
    })
    it('handleMessageType handles driver image: returns response and calls callSendAPI', function() {
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
                url: 'https://f1-cards.herokuapp.com/api/driver/lewis-hamilton',
                is_reusable: true
              }
            })
            webhookController.callSendAPI.restore()
          })
      )
    })
    it('handleMessageType returns response with normal text passed in', function() {
      // replace function with a spy
      // sinon.spy(webhookController, 'checkInputText')
      // let spy = sinon.spy()
      // driverController.__set__('checkInputText', spy)
      return (
        webhookController
          .handleMessageType('2399043010191818', {
            message: {
              text: responses.filler
            }
          })
          // check func gets called/

          .then(res => {
            // check return value
            assert.deepEqual(res, { text: responses.filler })
          })
      )
    })
    it('handleMessageType returns response - normal text; spy checkTextInput', function() {
      // replace function with a spy
      sinon.spy(webhookController, 'checkInputText')
      return webhookController
        .handleMessageType('2399043010191818', {
          message: {
            text: responses.filler
          }
        })
        .then(res => {
          // check that callSendAPI is called
          assert(webhookController.checkInputText.calledOnce)
          // check return value
          assert.deepEqual(res, { text: responses.filler })
          webhookController.checkInputText.restore()
        })
    })
    it('handleMessageType handles team image - team name: returns response and calls callSendAPI', function() {
      // replace function with a spy
      sinon.spy(webhookController, 'callSendAPI')
      // console.log(typeof webHookController.callSendAPI)
      return (
        webhookController
          .handleMessageType('2399043010191818', {
            message: {
              text: 'haas'
            }
          })
          // check func gets called/
          .then(res => {
            console.log('RES', res)
            // check callSendAPI called
            assert(webhookController.callSendAPI.calledOnce)
            // check return value
            assert.deepEqual(res.attachment, {
              type: 'image',
              payload: {
                url: 'https://f1-cards.herokuapp.com/api/team/haas_f1_team',
                is_reusable: true
              }
            })
            webhookController.callSendAPI.restore()
          })
      )
    })
    it('handleMessageType handles team image - team slug: returns response and calls callSendAPI', function() {
      // replace function with a spy
      sinon.spy(webhookController, 'callSendAPI')
      // console.log(typeof webHookController.callSendAPI)
      return (
        webhookController
          .handleMessageType('2399043010191818', {
            message: {
              text: 'racing_point'
            }
          })
          // check func gets called/
          .then(res => {
            console.log('RES', res)
            // check callSendAPI called
            assert(webhookController.callSendAPI.calledOnce)
            // check return value
            assert.deepEqual(res.attachment, {
              type: 'image',
              payload: {
                url: 'https://f1-cards.herokuapp.com/api/team/racing_point',
                is_reusable: true
              }
            })
            webhookController.callSendAPI.restore()
          })
      )
    })
  })
  describe('checkInputText()', () => {
    it('checkInputText returns card.driver response', function() {
      return (
        Promise.resolve(webhookController.checkInputText('racer'))
          // check Promise.resolvec gets called/
          .then(res => {
            assert.strictEqual(res.payload, responses.card.driver)
          })
      )
    })
    it('checkInputText returns filler text', function() {
      return (
        Promise.resolve(webhookController.checkInputText('Just some text'))
          // check func gets called/
          .then(res => {
            // console.log(res)
            if (res.payload) {
              assert(res.payload, responses.filler)
            } else {
              assert(res, responses.filler)
            }
          })
      )
    })
    it('checkInputText returns greeting prompt - lowercase', function() {
      return Promise.resolve(webhookController.checkInputText('hello')).then(
        res => {
          assert.strictEqual(
            res.payload,
            'Welcome to Formula1 Cards. To get a card enter the name of the Formula1 driver.'
          )
        }
      )
    })
    it('checkInputText returns help prompt - lowercase ', function() {
      return Promise.resolve(webhookController.checkInputText('help')).then(
        res => {
          assert.strictEqual(res.payload, 'What can we do to help you today?')
        }
      )
    })
    it('checkInputText returns help prompt - uppercase ', function() {
      return Promise.resolve(webhookController.checkInputText('HELP')).then(
        res => {
          assert.strictEqual(res.payload, 'What can we do to help you today?')
        }
      )
    })
    it('checkInputText returns driver', function() {
      // set to use rewire
      // let webHookController = rewire('../controllers/webhook.controller')
      const fakeCache = {
        driverCache: {
          'fake-test-driver': {
            imageUrl: 'fake url',
            timeStamp: new Date('Wed Sep 04 2019 13:27:11 GMT-0600')
          }
        }
      }
      driverController.__set__('cache', fakeCache)
      return Promise.resolve(
        webhookController.checkInputText('Lewis Hamilton', fakeCache)
      ).then(res1 => {
        return Promise.resolve(res1.payload).then(payload => {
          // console.log('PL', payload)
          assert(
            payload.hasOwnProperty('slug') &&
              payload.hasOwnProperty('imageUrl') &&
              payload.hasOwnProperty('mobileImageUrl')
          )
          assert(payload.slug === 'lewis-hamilton')
        })
      })
    })
    it('checkInputText for partial names - returns correct driver slug and URL', function() {
      const fakeCache = {
        driverCache: {
          'fake-test-driver': {
            imageUrl: 'fake url',
            timeStamp: new Date('Wed Sep 04 2019 13:27:11 GMT-0600')
          }
        }
      }
      return Promise.resolve(
        webhookController.checkInputText('lewis', fakeCache)
      ).then(res => {
        return Promise.resolve(res.payload).then(payload => {
          assert.strictEqual(payload.slug, 'lewis-hamilton')
          assert.strictEqual(
            payload.imageUrl,
            'https://f1-cards.herokuapp.com/api/driver/lewis-hamilton'
          )
        })
      })
    })
    it('checkInputText for partial names - returns correct obj', function() {
      const fakeCache = {
        driverCache: {
          'fake-test-driver': {
            imageUrl: 'fake url',
            timeStamp: new Date('Wed Sep 04 2019 13:27:11 GMT-0600')
          }
        }
      }
      return Promise.resolve(
        webhookController.checkInputText('lewis', fakeCache)
      )
        .then(res => {
          return res.payload
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
                'error in checks for partial names - return correct obj bottom',
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
    it('checkInputText for partial names - uppercase', function() {
      const fakeCache = {
        driverCache: {
          'fake-test-driver': {
            imageUrl: 'fake url',
            timeStamp: new Date('Wed Sep 04 2019 13:27:11 GMT-0600')
          }
        }
      }
      return Promise.resolve(
        webhookController.checkInputText('VALTTERI', fakeCache)
      ).then(res => {
        return Promise.resolve(res.payload).then(payload => {
          // check it returns correct driver
          assert.strictEqual(payload.slug, 'valtteri-bottas')
          assert(payload.hasOwnProperty('imageUrl'))
          assert(payload.imageUrl.includes('valtteri-bottas'))
        })
      })
    })
    it('checkInputText returns team payload - normal team name', function() {
      const fakeCache = {
        teamCache: {}
      }
      return Promise.resolve(
        webhookController.checkInputText('mercedes', fakeCache)
      ).then(res => {
        Promise.resolve(res.payload).then(payload => {
          assert.strictEqual(payload.slug, 'mercedes')
          assert(payload.hasOwnProperty('imageUrl'))
          assert(payload.imageUrl.includes('mercedes'))
        })
      })
    })
    it('checkInputText returns team payload - partial name', function() {
      const fakeCache = {
        teamCache: {}
      }
      return Promise.resolve(
        webhookController.checkInputText('red bull', fakeCache)
      ).then(res => {
        Promise.resolve(res.payload).then(payload => {
          // console.log(payload)
          assert.strictEqual(payload.slug, 'red_bull_racing')
          assert(payload.hasOwnProperty('imageUrl'))
          assert(payload.imageUrl.includes('red_bull'))
        })
      })
    })
  })
})
