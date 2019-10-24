const request = require('request')
const endpoints = require('../endpoints')
const cache = require('../cache').cache
const moment = require('moment')
// https://stackoverflow.com/q/26885685/5972531
const debug = require('debug')
const log = debug('f1:log')
const error = debug('f1:error')
const driverController = require('./driver.controller')
const teamController = require('./team.controller')
const testWordsJson = require('../test_words.json')
const responses = require('../responses.json')

// request_body contains sender_id and message_body
exports.facebookObj = request_body => {
  return {
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: request_body
  }
}
// will get the data about the user including device size
exports.getUserData = () => {
  // TODO
  return 'mobile'
}
// returns array
exports.sendHookResponse = (req, res) => {
  let body = req.body
  console.log('body', body)
  // Checks this is an event from a page subscription
  if (body.object === 'page') {
    // Iterates over each entry - there may be multiple if batched
    return body.entry.map(function(entry) {
      // Gets the message. entry.messaging is an array, but
      // will only ever contain one message, so we get index 0
      let webhook_event = entry.messaging[0]
      console.log('webhook_event', webhook_event)
      // console.log('W', webhook_event)
      // Get the sender PSID
      let sender_psid = webhook_event.sender.id
      console.log('Sender PSID: ' + sender_psid)
      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        // get devivce size and data
        const cardType = module.exports.getUserData()
        // Returns a '200 OK' response to all requests
        res.status(200).send('EVENT_RECEIVED')
        return module.exports.handleMessageType(
          sender_psid,
          webhook_event,
          cardType
        )
      } else if (webhook_event.postback) {
        const recipientId = webhook_event.recipient.id
        return module.exports.handlePostback(
          sender_psid,
          webhook_event.postback,
          recipientId
        )
      }
    })
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    return res.sendStatus(404)
  }
}

exports.verifyHook = (req, res) => {
  log('verify hook')
  // Your verify token. Should be a random string.
  let VERIFY_TOKEN = process.env.VERIFY_TOKEN

  // Parse the query params
  let mode = req.query['hub.mode']
  let token = req.query['hub.verify_token']
  let challenge = req.query['hub.challenge']

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED')
      res.status(200).send(challenge)
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403)
    }
  }
}
// take user input and check to send back response
exports.checkInputText = (inputText, cache) => {
  // console.log('checkInputText')
  log('checkInputText')
  try {
    // check json first
    if (testWordsJson.prompt_greeting.includes(inputText.toLowerCase())) {
      return {
        type: 'text',
        payload: responses.profile.greeting
      }
    } else if (testWordsJson.prompt_help.includes(inputText.toLowerCase())) {
      return {
        type: 'text',
        payload: responses.help.ask
      }
    } else if (
      testWordsJson.prompt_card.indexOf(inputText.toLowerCase()) != -1
    ) {
      // send proper response back
      switch (testWordsJson.prompt_card.indexOf(inputText.toLowerCase())) {
        case 0:
          return {
            type: 'text',
            payload: responses.card.driver
          }
        case 1:
          return {
            type: 'text',
            payload: responses.card.team
          }
        case 2:
          return {
            type: 'text',
            payload: responses.card.team
          }
        case 3:
          return {
            type: 'text',
            payload: responses.card.driver
          }
      }
    }
    return driverController.checkDriverApi(inputText).then(driverSlug => {
      console.log('webbook.checkInputText() driverSlug', driverSlug)
      // true if a driver name - check not false
      if (driverSlug) {
        // - returns a promise if calling from API
        // - returns an object if in the cache
        // console.log('cache', cache)
        const driver = driverController.cacheAndGetDriver(
          driverSlug,
          cache.driverCache
        )
        // console.log('DD', driver)
        // send driver card info
        return {
          type: 'image',
          payload: driver
        }
      } else {
        return teamController.checkTeamApi(inputText).then(teamSlug => {
          if (teamSlug) {
            console.log('TEAM SLUG', teamSlug)
            const team = teamController.cacheAndGetTeam(
              teamSlug,
              cache.teamCache
            )
            console.log('TEAM', team)
            return {
              type: 'image',
              payload: team
            }
          }
          return {
            type: 'text',
            payload: responses.filler
          }
        })
      }
    })
  } catch (e) {
    console.log('An error in checkInputText', e)
  }
}
// pass in cardType - attaches proper URL to facebook response obj
exports.handleMessageType = (sender_psid, webhook_event, cardType) => {
  let messageRes
  log('handleMessageType')

  try {
    // Check if the message contains text
    if (webhook_event.message.text) {
      // check if text is a driver name
      // console.log(webhook_event.message)
      const responseVal = Promise.resolve(
        module.exports.checkInputText(webhook_event.message.text, cache)
      )
      // console.log('÷resposeVAl', responseVal)
      return responseVal
        .then(res => {
          // resolve first promise
          return Promise.resolve(res)
            .then(dataObj => {
              // console.log('dataObj', dataObj)
              // resolve second promise if it exists
              return Promise.resolve(dataObj.payload)
                .then(payload => {
                  // console.log('payload', payload)
                  function whichUrl(cardType) {
                    if (cardType === 'mobile') {
                      return payload['mobileImageUrl']
                    } else {
                      return payload['imageUrl']
                    }
                  }
                  if (dataObj.type === 'image') {
                    // .then(payload => {
                    console.log('payload', payload)
                    messageRes = {
                      attachment: {
                        type: 'image',
                        payload: {
                          url: whichUrl(cardType),
                          is_reusable: true
                        }
                      }
                    }
                    // return new Promise((response, reject) => {
                    module.exports.callSendAPI(sender_psid, messageRes)
                    // }).then(() => {
                    console.log('here', messageRes)
                    return messageRes
                    // })
                    // calls api then returns response
                  } else if (dataObj.type === 'text') {
                    console.log('res text', res)
                    messageRes = {
                      text: payload
                    }
                    // calls api then returns response
                    module.exports.callSendAPI(sender_psid, messageRes)
                    return messageRes
                  }
                  // returnmodule.exports.callSendAPI(sender_psid, response)
                  // return driverController
                  //   .checkDriverApi(webhook_event.message.text)
                  //   .then(bool => {
                  //     if (bool) {
                  //       // Create the payload for a basic text message
                  //       const driverSlug = driverController.slugifyDriver(
                  //         webhook_event.message.text
                  //       )
                })
                .catch(e => {
                  console.error('An error in handleMessageType promise2', e, e)
                })
            })
            .catch(e => {
              console.error('An error in handleMessageType promise 3', e)
            })
        })
        .catch(e => {
          console.error('An error in handleMessageType promise 1', e)
        })
    } else {
      response = {
        text: 'There is no driver by that name. Maybe check your spelling.'
      }
      return module.exports.callSendAPI(sender_psid, response)
    }
    //  else if (webhook_event.message.attachments) {
    //   // Gets the URL of the message attachment
    //   let attachment_url = webhook_event.message.attachments[0].payload.url
    //   response = {
    //     attachment: {
    //       type: 'template',
    //       payload: {
    //         template_type: 'generic',
    //         elements: [
    //           {
    //             title: 'Is this the right picture?',
    //             subtitle: 'Tap a button to answer.',
    //             image_url: attachment_url,
    //             buttons: [
    //               {
    //                 type: 'postback',
    //                 title: 'Yes!',
    //                 payload: 'yes'
    //               },
    //               {
    //                 type: 'postback',
    //                 title: 'No!',
    //                 payload: 'no'
    //               }
    //             ]
    //           }
    //         ]
    //       }
    //     }
    //   }
    // }

    // // Sends the response message
    // module.exports.callSendAPI(sender_psid, response)
  } catch (e) {
    console.error('Error in handleMessageType bottom', e)
  }
}
// Handles messaging_postbacks events
exports.handlePostback = (sender_psid, received_postback, recipientId) => {
  // console.log('received_postback', received_postback)
  // console.log('recep', recipientId)
  let response
  // Get the payload for the postback
  let payload = received_postback.payload
  console.log('POSTBACK payload', payload)

  // Set the response based on the postback payload
  if (payload === 'get_started') {
    response = module.exports.welcomeTemplate(sender_psid)
  } else if (payload === 'no') {
    response = { text: 'Oops, try sending another image.' }
  }
  // Send the message to acknowledge the postback
  return module.exports.callSendAPI(sender_psid, response)
}
exports.welcomeTemplate = recipientId => {
  return {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'button',
          text: responses.profile.greeting,
          buttons: [
            {
              type: 'postback',
              title: 'Check in',
              payload: 'check_in'
            },
            {
              type: 'postback',
              title: 'Room Service',
              payload: 'room_service'
            },
            {
              type: 'phone_number',
              title: 'Call Reception',
              payload: '+16505551234'
            }
          ]
        }
      }
    }
  }
  return {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'generic',
        elements: [
          {
            title: 'Is this the right picture?',
            subtitle: 'Tap a button to answer.',
            image_url: 'http://place-puppy.com/200x200',
            buttons: [
              {
                type: 'postback',
                title: 'Yes!',
                payload: 'yes'
              },
              {
                type: 'postback',
                title: 'No!',
                payload: 'no'
              }
            ]
          }
        ]
      }
    }
  }
}
exports.callSendAPI = (sender_psid, response) => {
  console.log('CALL API', response)
  // Construct the message body
  let request_body = {
    recipient: {
      id: sender_psid
    },
    message: response
  }
  // Send the HTTP request to the Messenger Platform
  return request(module.exports.facebookObj(request_body), (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error('Unable to send message:' + err)
    }
  })
}
