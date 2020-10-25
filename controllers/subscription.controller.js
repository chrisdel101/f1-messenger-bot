const { mockRequest, mockResponse } = require('mock-req-res')
const values = require('../values.json')
let webhookController = require('../controllers/webhook.controller')
// must load env vars since not running app
require('dotenv').config(
  '/Users/chrisdielschnieder/desktop/code_work/formula1/f1-messenger-bot/.env'
)

function test() {
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
                text: 'max',
              },
            },
          ],
        },
      ],
    },
  }
  // mock req/res
  const req = mockRequest(mock_body_data)
  const res = mockResponse()
  webhookController.sendHookResponse(req, res)[0]
}
test()
