const assert = require('assert')
let webhookController = require('../controllers/webhook.controller')
let driverController = require('../controllers/driver.controller')
let teamController = require('../controllers/team.controller')
const utils = require('../utils')
const rewire = require('rewire')
const sinon = require('sinon')
const responses = require('../responses.json')
const { mockRequest, mockResponse } = require('mock-req-res')
require('dotenv').config(
  '/Users/chrisdielschnieder/desktop/code_work/formula1/f1-messenger-bot/.env'
)

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
    it('sendHookResponse calls handleMessage - webhook_event has message key', function() {
      // fake fake_webhook_event for req obj- match FB
      let mock_body_data = {
        body: {
          object: 'page',
          entry: [
            // mock webhook_event
            {
              id: 123455,
              time: new Date().getTime(),
              messaging: [
                {
                  sender: { id: 111111 },
                  recipient: { id: 222222 },
                  timestamp: new Date().getTime(),
                  message: {
                    mid: 'mid.1460620432888:f8e3412003d2d1cd93',
                    seq: 12604,
                    text: 'A test message'
                  }
                }
              ]
            }
          ]
        }
      }
      // mock req/res
      const req = mockRequest(mock_body_data)
      const res = mockResponse()
      sinon.spy(webhookController, 'handleMessageType')
      const result = webhookController.sendHookResponse(req, res)
      assert(webhookController.handleMessageType.calledOnce)
      webhookController.handleMessageType.restore()
    })
    it('sendHookResponse calls handleMessage - webhook_event has message key with text field', function() {
      // mock mock_body_data for req obj- match FB
      let mock_body_data = {
        body: {
          object: 'page',
          entry: [
            // mock webhook_event
            {
              id: 123455,
              time: new Date().getTime(),
              messaging: [
                {
                  sender: { id: 111111 },
                  recipient: { id: 222222 },
                  timestamp: new Date().getTime(),
                  message: {
                    mid: 'mid.1460620432888:f8e3412003d2d1cd93',
                    seq: 12604,
                    text: 'A test message'
                  }
                }
              ]
            }
          ]
        }
      }
      // mock req/res
      const req = mockRequest(mock_body_data)
      const res = mockResponse()
      sinon.spy(webhookController, 'handleMessageType')
      return webhookController.sendHookResponse(req, res)[0].then(res => {
        // test message should return filler reponse
        assert.strictEqual(res.text, responses.filler)
        webhookController.handleMessageType.restore()
      })
    })
    it('sendHookResponse calls handlePostback', function() {
      // mock mock_body_data for req obj- match FB
      let mock_body_data = {
        body: {
          object: 'page',
          entry: [
            // mock webhook_event
            {
              id: 123455,
              time: new Date().getTime(),
              messaging: [
                {
                  sender: { id: 111111 },
                  recipient: { id: 222222 },
                  timestamp: new Date().getTime(),
                  postback: {
                    title: 'Get Started',
                    payload: 'get_started'
                  }
                }
              ]
            }
          ]
        }
      }
      const req = mockRequest(mock_body_data)
      const res = mockResponse()
      sinon.spy(webhookController, 'handlePostback')
      sinon.spy(webhookController, 'callSendAPI')
      // returns response object
      webhookController.sendHookResponse(req, res)
      assert(webhookController.handlePostback.calledOnce)
      assert(webhookController.callSendAPI.calledOnce)
      webhookController.handlePostback.restore()
      webhookController.callSendAPI.restore()
    })
  })
  describe('welcomeTemplate()', () => {
    it('welcomeTemplate returns template', function() {
      const res = webhookController.welcomeTemplate('2399043010191818')
      console.log('res', res)
    })
  })

  describe('handlePostback()', () => {
    it('handlePostback calls get_started', function() {
      sinon.spy(webhookController, 'callSendAPI')
      sinon.spy(webhookController, 'welcomeTemplate')
      let mock_webhook_event = {
        sender: { id: '2399043010191818' },
        recipient: { id: '107628650610694' },
        timestamp: new Date().getTime(),
        postback: {
          title: 'Get Started',
          payload: 'get_started'
        }
      }

      const result = webhookController.handlePostback(
        mock_webhook_event.sender.id,
        mock_webhook_event.postback
      )
      assert(webhookController.callSendAPI.calledOnce)
      assert(webhookController.welcomeTemplate.calledOnce)
      // console.log('res', result)
      webhookController.callSendAPI.restore()
      webhookController.welcomeTemplate.restore()
    })
    it('handlePostback calls get_card', function() {
      // sinon.spy(webhookController, 'callSendAPI')
      let mock_webhook_event = {
        sender: { id: '2399043010191818' },
        recipient: { id: '107628650610694' },
        timestamp: new Date().getTime(),
        postback: {
          title: 'Get a Card Now',
          payload: 'get_card'
        }
      }

      const result = webhookController.handlePostback(
        mock_webhook_event.sender.id,
        mock_webhook_event.postback
      )
      // assert(webhookController.callSendAPI.calledOnce)
      // console.log('res', result)
      // webhookController.callSendAPI.restore()
    })
  })
  describe('createSendAPIresponse()', () => {
    it('createSendAPIresponse handles type:image; returns mobile URL response', function() {
      const fakeRes = {
        type: 'image',
        payload: new Promise((resolve, reject) => {
          resolve({
            slug: 'pierre-gasly',
            mobileImageUrl:
              'https://f1-cards.herokuapp.com/api/mobile/driver/pierre-gasly',
            imageUrl: 'https://f1-cards.herokuapp.com/api/driver/pierre-gasly',
            timeStamp: new Date().getTime()
          })
        })
      }
      return Promise.resolve(
        webhookController.createSendAPIresponse(
          '2399043010191818',
          'mobile',
          fakeRes
        )
      ).then(res => {
        assert.deepEqual(res.attachment, {
          type: 'image',
          payload: {
            url:
              'https://f1-cards.herokuapp.com/api/mobile/driver/pierre-gasly',
            is_reusable: true
          }
        })
        console.log('\n')
      })
    })
    it('createSendAPIresponse handles type:image; returns non-mobile URL response', function() {
      const fakeRes = {
        type: 'image',
        payload: new Promise((resolve, reject) => {
          resolve({
            slug: 'pierre-gasly',
            mobileImageUrl:
              'https://f1-cards.herokuapp.com/api/mobile/driver/pierre-gasly',
            imageUrl: 'https://f1-cards.herokuapp.com/api/driver/pierre-gasly',
            timeStamp: new Date().getTime()
          })
        })
      }
      return Promise.resolve(
        webhookController.createSendAPIresponse(
          '2399043010191818',
          undefined,
          fakeRes
        )
      ).then(res => {
        assert.deepEqual(res.attachment, {
          type: 'image',
          payload: {
            url: 'https://f1-cards.herokuapp.com/api/driver/pierre-gasly',
            is_reusable: true
          }
        })
        console.log('\n')
      })
    })
    it('createSendAPIresponse handles type:image; does not follow type:text logic', function() {
      sinon.spy(utils, 'whichUrl')
      const fakeRes = {
        type: 'image',
        payload: new Promise((resolve, reject) => {
          resolve({
            slug: 'some-driver',
            mobileImageUrl:
              'https://f1-cards.herokuapp.com/api/mobile/driver/some-driver',
            imageUrl: 'https://f1-cards.herokuapp.com/api/driver/some-driver',
            timeStamp: new Date().getTime()
          })
        })
      }
      return Promise.resolve(
        webhookController.createSendAPIresponse(
          '2399043010191818',
          undefined,
          fakeRes
        )
      ).then(res => {
        assert(utils.whichUrl.calledOnce)
        utils.whichUrl.restore()
        console.log('\n')
      })
    })
    it('createSendAPIresponse handles type:text; returns text response obj', function() {
      // replace function with a spy
      const fakeRes = {
        type: 'text',
        payload: 'Some payload text'
      }
      return (
        // call with partial name
        webhookController
          .createSendAPIresponse('2399043010191818', undefined, fakeRes)
          .then(res => {
            assert.deepEqual(res, {
              text: 'Some payload text'
            })
          })
      )
    })
    it.only('createSendAPIresponse handles type:text; does not follow type:image logic', function() {
      sinon.spy(utils, 'whichUrl')
      const fakeRes = {
        type: 'text',
        payload: 'Some payload text'
      }
      return (
        // call with partial name
        webhookController
          .createSendAPIresponse('2399043010191818', undefined, fakeRes)
          .then(res => {
            assert(utils.whichUrl.notCalled)
            utils.whichUrl.restore()
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

  describe('handleMessageType()', () => {
    it('handleMessageType calls helper funcs when text passed in', function() {
      sinon.spy(webhookController, 'callSendAPI')
      sinon.spy(webhookController, 'createSendAPIresponse')
      return Promise.resolve(
        webhookController.handleMessageType('2399043010191818', {
          message: {
            text: 'pierre'
          }
        })
      ).then(res => {
        // check callSendAPI called
        assert(webhookController.callSendAPI.calledOnce)
        // check func gets called/
        assert(webhookController.createSendAPIresponse.calledOnce)
        console.log('\n')
        webhookController.callSendAPI.restore()
        webhookController.createSendAPIresponse.restore()
      })
    })
    it('handleMessageType returns message sent confirmation', function() {
      return Promise.resolve(
        webhookController.handleMessageType('2399043010191818', {
          message: {
            text: 'pierre'
          }
        })
      ).then(res => {
        assert.strictEqual(res, 'message sent!')
        console.log('\n')
      })
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
