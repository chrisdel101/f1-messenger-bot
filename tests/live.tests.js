const assert = require('assert')
let webhookController = require('../controllers/webhook.controller')
let driverController = require('../controllers/driver.controller')
const utils = require('../utils')
const sinon = require('sinon')
const responses = require('../responses.json')
const values = require('../values.json')
const { mockRequest, mockResponse } = require('mock-req-res')
require('dotenv').config(
  '/Users/chrisdielschnieder/desktop/code_work/formula1/f1-messenger-bot/.env'
)
// LIVE TESTS
describe('sendHookResponse()', () => {
  describe('sendHookResponse with text inputs', () => {
    it('sendHookResponse calls handleMessage - check that handleMessage is called', function() {
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
                    text: 'max'
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
      const result = webhookController.sendHookResponse(req, res)[0]
      result.then(res => {
        assert.strictEqual(res, 'message sent!')
        assert(webhookController.handleMessageType.calledOnce)
        webhookController.handleMessageType.restore()
      })
    })
    it('sendHookResponse calls handleMessage - check that handleMessage is called', function() {
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
      const result = webhookController.sendHookResponse(req, res)[0]
      result.then(res => {
        assert.strictEqual(res, 'message sent!')
        assert(webhookController.handleMessageType.calledOnce)
        webhookController.handleMessageType.restore()
      })
    })
    it('sendHookResponse calls createSendAPIresponse - check data returned is correct', function() {
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
                  message: {
                    mid: 'mid.1460620432888:f8e3412003d2d1cd93',
                    seq: 12604,
                    // should return an object
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
      sinon.spy(webhookController, 'createSendAPIresponse')
      return webhookController.sendHookResponse(req, res)[0].then(res => {
        // spy return values of checkInputText()
        return webhookController.createSendAPIresponse.returnValues[0].then(
          res => {
            // res should be obj with single text key
            assert.deepEqual(res, {
              text: responses.filler
            })
            webhookController.createSendAPIresponse.restore()
          }
        )
      })
    })
    it('sendHookResponse calls checkInputText - check correct response for filler text returned', function() {
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
                  message: {
                    mid: 'mid.1460620432888:f8e3412003d2d1cd93',
                    seq: 12604,
                    // should return filler
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
      sinon.spy(webhookController, 'checkInputText')
      return webhookController.sendHookResponse(req, res)[0].then(res => {
        // spy return values of checkInputText()
        return webhookController.checkInputText.returnValues[0].then(res => {
          // test message should return filler reponse
          assert.strictEqual(res.payload, responses.filler)
          webhookController.checkInputText.restore()
        })
      })
    })
  })
  describe('sendHookResponse with postbacks', () => {
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
    it('sendHookResponse calls handlePostback - choose_drivers', function() {
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
})
