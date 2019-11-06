const assert = require('assert')
let webhookController = require('../controllers/webhook.controller')
let driverController = require('../controllers/driver.controller')
let teamController = require('../controllers/team.controller')
const utils = require('../utils')
const rewire = require('rewire')
const sinon = require('sinon')
const responses = require('../responses.json')
const values = require('../values.json')
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
  // LIVE TESTS
  describe('sendHookResponse()', () => {
    it('sendHookResponse calls handleMessage - webhook_event has message key', function() {
      // fake fake_webhook_event for req obj- match FB
      let mock_body_data = {
        body: {
          object: 'page',
          entry: [
            // mock webhook_event
            {
              id: values.testing['fake_msg_id'],
              time: new Date().getTime(),
              messaging: [
                {
                  sender: { id: process.env.SENDER_ID },
                  recipient: { id: process.env.RECIEPIENT_ID },
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
              id: values.testing['fake_msg_id'],
              time: new Date().getTime(),
              messaging: [
                {
                  sender: { id: process.env.SENDER_ID },
                  recipient: { id: process.env.RECIEPIENT_ID },
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
    it('sendHookResponse calls handlePostback - get_started', function() {
      // mock mock_body_data for req obj- match FB
      let mock_body_data = {
        body: {
          object: 'page',
          entry: [
            // mock webhook_event
            {
              id: values.testing['fake_msg_id'],
              time: new Date().getTime(),
              messaging: [
                {
                  sender: { id: process.env.SENDER_ID },
                  recipient: { id: process.env.RECIEPIENT_ID },
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
    it('sendHookResponse calls handlePostback - get_delivery', function() {
      // mock mock_body_data for req obj- match FB
      let mock_body_data = {
        body: {
          object: 'page',
          entry: [
            {
              id: values.testing['fake_msg_id'],
              time: new Date().getTime(),
              messaging: [
                {
                  sender: { id: process.env.SENDER_ID },
                  recipient: { id: process.env.RECIEPIENT_ID },
                  timestamp: new Date().getTime(),
                  postback: {
                    title: values.titles['get_delivery'],
                    payload: values.postbacks['get_delivery']
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
      webhookController.sendHookResponse(req, res)
      assert(webhookController.handlePostback.calledOnce)
      assert(webhookController.callSendAPI.calledOnce)
      webhookController.handlePostback.restore()
      webhookController.callSendAPI.restore()
    })
    it.only('sendHookResponse calls handlePostback - choose_drivers', function() {
      // mock mock_body_data for req obj- match FB
      let mock_body_data = {
        body: {
          object: 'page',
          entry: [
            {
              id: values.testing['fake_msg_id'],
              time: new Date().getTime(),
              messaging: [
                {
                  sender: { id: process.env.SENDER_ID },
                  recipient: { id: process.env.RECIEPIENT_ID },
                  timestamp: new Date().getTime(),
                  postback: {
                    title: values.titles.choose_drivers,
                    payload: values.postbacks.choose_drivers
                  }
                }
              ]
            }
          ]
        }
      }
      const req = mockRequest(mock_body_data)
      const res = mockResponse()
      // sinon.spy(webhookController, 'handlePostback')
      // sinon.spy(webhookController, 'callSendAPI')
      webhookController.sendHookResponse(req, res)
      // assert(webhookController.handlePostback.calledOnce)
      // assert(webhookController.callSendAPI.calledOnce)
      // webhookController.handlePostback.restore()
      // webhookController.callSendAPI.restore()
    })
    it('sendHookResponse calls handlePostback - choose_teams', function() {
      // mock mock_body_data for req obj- match FB
      let mock_body_data = {
        body: {
          object: 'page',
          entry: [
            {
              id: values.testing['fake_msg_id'],
              time: new Date().getTime(),
              messaging: [
                {
                  sender: { id: process.env.SENDER_ID },
                  recipient: { id: process.env.RECIEPIENT_ID },
                  timestamp: new Date().getTime(),
                  postback: {
                    title: values.titles.choose_teams,
                    payload: values.postbacks.choose_teams
                  }
                }
              ]
            }
          ]
        }
      }
      const req = mockRequest(mock_body_data)
      const res = mockResponse()
      // sinon.spy(webhookController, 'handlePostback')
      // sinon.spy(webhookController, 'callSendAPI')
      webhookController.sendHookResponse(req, res)
      // assert(webhookController.handlePostback.calledOnce)
      // assert(webhookController.callSendAPI.calledOnce)
      // webhookController.handlePostback.restore()
      // webhookController.callSendAPI.restore()
    })
  })
  describe('welcomeTemplate()', () => {
    it('welcomeTemplate returns template', function() {
      const res = webhookController.welcomeTemplate(process.env.SENDER_ID)
      console.log('res', res)
    })
  })

  describe('handlePostback()', () => {
    it('handlePostback calls get_started', function() {
      sinon.spy(webhookController, 'callSendAPI')
      sinon.spy(webhookController, 'welcomeTemplate')
      let mock_webhook_event = {
        sender: { id: process.env.SENDER_ID },
        recipient: { id: '107628650610694' },
        timestamp: new Date().getTime(),
        postback: {
          title: 'Get Started',
          payload: 'get_started'
        }
      }

      return webhookController
        .handlePostback(
          mock_webhook_event.sender.id,
          mock_webhook_event.postback
        )
        .then(() => {
          console.log(webhookController.welcomeTemplate.callCount)
          console.log(webhookController.callSendAPI.callCount)
          assert(webhookController.callSendAPI.calledOnce)
          assert(webhookController.welcomeTemplate.calledOnce)
          webhookController.callSendAPI.restore()
          webhookController.welcomeTemplate.restore()
        })
    })
    it('handlePostback calls get_card - returns random card', function() {
      // sinon.spy(webhookController, 'callSendAPI')
      let mock_webhook_event = {
        sender: { id: process.env.SENDER_ID },
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
          process.env.SENDER_ID,
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
          process.env.SENDER_ID,
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
          process.env.SENDER_ID,
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
          .createSendAPIresponse(process.env.SENDER_ID, undefined, fakeRes)
          .then(res => {
            assert.deepEqual(res, {
              text: 'Some payload text'
            })
          })
      )
    })
    it('createSendAPIresponse handles type:text; does not follow type:image logic', function() {
      sinon.spy(utils, 'whichUrl')
      const fakeRes = {
        type: 'text',
        payload: 'Some payload text'
      }
      return (
        // call with partial name
        webhookController
          .createSendAPIresponse(process.env.SENDER_ID, undefined, fakeRes)
          .then(res => {
            assert(utils.whichUrl.notCalled)
            utils.whichUrl.restore()
          })
      )
    })
  })

  describe('handleMessageType()', () => {
    it('handleMessageType calls helper funcs when text passed in', function() {
      sinon.spy(webhookController, 'callSendAPI')
      sinon.spy(webhookController, 'createSendAPIresponse')
      return Promise.resolve(
        webhookController.handleMessageType(process.env.SENDER_ID, {
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
        webhookController.handleMessageType(process.env.SENDER_ID, {
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
