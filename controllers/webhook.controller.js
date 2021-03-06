const request = require('request')
const endpoints = require('../endpoints')
const { cache } = require('../cache')
// https://stackoverflow.com/q/26885685/5972531
const debug = require('debug')
const log = debug('f1:log')
const driverController = require('./driver.controller')
const teamController = require('./team.controller')
const testWordsJson = require('../test_words.json')
const responses = require('../responses.json')
const values = require('../values.json')
const utils = require('../utils')

// request_body contains sender_id and message_body
exports.facebookObj = (request_body) => {
  return {
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {
      access_token: process.env.PAGE_ACCESS_TOKEN,
    },
    method: 'POST',
    json: request_body,
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
  console.log('CALL HOOK')
  // Checks this is an event from a page subscription
  if (body.object === 'page') {
    // Iterates over each entry - there may be multiple if batched
    return body.entry.map(function (entry) {
      // Gets the message. entry.messaging is an array, but
      // will only ever contain one message, so we get index 0
      // console.log("MESSAGE", entry);
      let webhook_event = entry.messaging[0]
      console.log('webhook_event', webhook_event)
      // console.log('W', webhook_event)
      // Get the sender PSID
      let sender_psid = webhook_event.sender.id
      console.log('Sender PSID: ' + sender_psid)
      // get devivce size and data
      const cardType = module.exports.getUserData()
      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        // Returns a '200 OK' response to all requests
        res.status(200).send('EVENT_RECEIVED')
        return module.exports.handleMessageType(
          sender_psid,
          webhook_event,
          cardType
        )
      } else if (webhook_event.postback) {
        res.status(200).send('EVENT_RECEIVED')
        return module.exports.handlePostback(sender_psid, webhook_event)
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
  console.log('checkInputText:', inputText)
  // console.log('checkInputText CACHE', cache)
  log('checkInputText')
  try {
    // check json first
    if (testWordsJson.prompt_greeting.includes(inputText.toLowerCase())) {
      return {
        type: 'text',
        payload: responses.profile.greeting,
      }
    } else if (testWordsJson.prompt_help.includes(inputText.toLowerCase())) {
      return {
        type: 'text',
        payload: responses.help.ask1,
      }
    } else if (
      testWordsJson.prompt_card.indexOf(inputText.toLowerCase()) != -1
    ) {
      // send proper response back
      switch (testWordsJson.prompt_card.indexOf(inputText.toLowerCase())) {
        case 0:
          return {
            type: 'text',
            payload: responses.card.driver,
          }
        case 1:
          return {
            type: 'text',
            payload: responses.card.team,
          }
        case 2:
          return {
            type: 'text',
            payload: responses.card.team,
          }
        case 3:
          return {
            type: 'text',
            payload: responses.card.driver,
          }
      }
    }
    return driverController.checkDriverApi(inputText).then((driverSlug) => {
      // console.log('webbook.checkInputText() driverSlug', driverSlug)
      // console.log('webbook.checkInputText() driverSlug')
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
        // send driver card instructions
        return {
          type: 'image',
          payload: driver,
        }
      } else {
        return teamController.checkTeamApi(inputText).then((teamSlug) => {
          if (teamSlug) {
            console.log('TEAM SLUG', teamSlug)
            const team = teamController.cacheAndGetTeam(
              teamSlug,
              cache.teamCache
            )
            console.log('TEAM', team)
            return {
              type: 'image',
              payload: team,
            }
          }
          return {
            type: 'text',
            payload: responses.filler,
          }
        })
      }
    })
  } catch (e) {
    console.log('An error in checkInputText', e)
  }
}
// takes data from message forms into object sendAPI can handle
// used in this.handleMessageType and this.handlePostback
// takes object with res type and payload, and cardType
exports.createSendAPIresponse = (sender_psid, cardType, checkInputResponse) => {
  try {
    // console.log('resposeVAl', checkInputResponse)
    return Promise.resolve(checkInputResponse).then((res) => {
      // resolve first promise
      return Promise.resolve(res)
        .then((dataObj) => {
          // console.log('dataObj', dataObj)
          // resolve second promise if it exists
          return Promise.resolve(dataObj.payload)
            .then((payload) => {
              // console.log('payload', payload)
              if (dataObj.type === 'image') {
                // console.log("payload", cardType);
                return {
                  attachment: {
                    type: 'image',
                    payload: {
                      url: utils.whichUrl(cardType, payload),
                      is_reusable: true,
                    },
                  },
                }
              } else if (dataObj.type === 'text') {
                return {
                  text: payload,
                }
              }
            })
            .catch((e) => {
              console.error('An error in createSendAPIresponse promise 2', e)
            })
        })
        .catch((e) => {
          console.error('An error in createSendAPIresponse promise 1', e)
        })
    })
  } catch (e) {
    console.error('An error in createSendAPIresponse', e)
  }
}
// pass in cardType, hook and id - sends messages to API
exports.handleMessageType = (sender_psid, webhook_event, cardType) => {
  try {
    // Check if the message contains text
    if (webhook_event.message.text) {
      // console.log(webhook_event.message)
      // check if text is a driver name
      return Promise.resolve(
        this.checkInputText(webhook_event.message.text, cache)
      )
        .then((responseVal) => {
          // console.log('RES', responseVal)
          // create FB response obj
          return Promise.resolve(
            this.createSendAPIresponse(sender_psid, cardType, responseVal)
          )
            .then((res) => {
              // send data to API
              return Promise.resolve(this.callSendAPI(sender_psid, res))
            })
            .catch((e) => {
              console.error('An error in handleMessageType promise 2', e)
            })
        })
        .catch((e) => {
          console.error('An error in handleMessageType promise 1', e)
        })
    } else {
      let response = {
        text:
          'Your response needs to be a text response. Please type something',
      }
      return this.callSendAPI(sender_psid, response)
    }
  } catch (e) {
    console.error('Error in handleMessageType bottom', e)
  }
}
// Handles messaging_postbacks events
exports.handlePostback = (sender_psid, webhook_event, cardType) => {
  console.log('postback', webhook_event)
  let payload = webhook_event.postback.payload
  console.log('payload', payload)
  // GET STARTED
  if (payload === values.postbacks.get_started) {
    return this.getStartedMessages(sender_psid)
    // GET CARD
  } else if (payload === values.postbacks.get_card) {
    // get random driver name and slug
    return driverController.getRandomDriver().then((randomDriver) => {
      console.log('random', randomDriver)
      // get full driver obj
      return Promise.resolve(
        driverController.cacheAndGetDriver(
          randomDriver.name_slug,
          cache.driverCache
        )
      ).then((driverRes) => {
        // check and make typed response obj
        return this.checkInputText(driverRes.slug, cache).then((typeRes) => {
          // form into correct FB format
          return this.createSendAPIresponse(
            sender_psid,
            cardType,
            typeRes
          ).then((res) => {
            // send to messenger
            return this.callSendAPI(sender_psid, res).then(() => {
              return this.callSendAPI(sender_psid, this.followUpTemplate())
            })
          })
        })
      })
    })
    // GET DELIVERY
  } else if (payload === values.postbacks.get_delivery) {
    // sends template with choose_drivers/ teams buttons1
    return this.sendDeliveryOptions(webhook_event)
  }
}
// ask user how they want to receive their subscription
exports.sendDeliveryOptions = (webhook_event) => {
  // get sender ID and store it
  // ask which drivers they want to get info about
  return this.callSendAPI(webhook_event.sender.id, {
    text: 'some random text',
  }).then(() => {
    console.log('here', this.logInButton())
    return this.callSendAPI(webhook_event.sender.id, this.logInButton())
  })
}
// sends the messages on get_started click
// takes sender_psid and response obj
exports.getStartedMessages = (sender_psid) => {
  return this.callSendAPI(sender_psid, {
    text: `${responses.profile.greeting3}\n--------------- ${responses.instructions['how-it-works']} ---------------`,
  })
    .then(() => {
      return this.callSendAPI(sender_psid, {
        text: responses.instructions.instr1,
      })
    })
    .then(() => {
      return this.callSendAPI(sender_psid, {
        text: responses['support-words'].or_even_better,
      })
    })
    .then(() => {
      return this.callSendAPI(sender_psid, {
        text: `•  ${responses.instructions.set1['sign-up']}\n•  ${responses.instructions.set1.choose}\n•  ${responses.instructions.set1.send}`,
      })
    })
    .then(() => {
      return this.callSendAPI(sender_psid, this.welcomeTemplate())
    })
}
// returns template to use in get_started message
// takes sender_psid
exports.welcomeTemplate = () => {
  return {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'generic',
        elements: [
          {
            title: responses.help.ask3,
            image_url:
              'https://www.formula1.com/content/fom-website/en/teams/Ferrari/_jcr_content/gallery/image1.img.1536.medium.jpg/1552719486937.jpg',
            buttons: [
              {
                type: 'postback',
                title: values.titles.get_card,
                payload: values.postbacks.get_card,
              },
              {
                type: 'postback',
                title: values.titles.get_delivery,
                payload: values.postbacks.get_delivery,
              },
            ],
          },
        ],
      },
    },
  }
}
exports.followUpTemplate = () => {
  return {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'button',
        text: responses.help.ask3,
        buttons: [
          {
            type: 'postback',
            title: values.titles.get_card,
            payload: values.postbacks.get_card,
          },
          {
            type: 'postback',
            title: values.titles.get_delivery,
            payload: values.postbacks.get_delivery,
          },
        ],
      },
    },
  }
}
// send buttons that bring up webviews
exports.getDeliveryTemplate = (sender_id) => {
  return {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'button',
        text: responses['support-words'].or,
        buttons: [
          {
            // see list of drivers/
            messenger_extensions: true,
            type: 'web_url',
            // attach senderID to the URL
            url: `${endpoints.prodCardsEndpoint}/drivers?size=mini&id=${sender_id}`,
            title: values.titles.choose_drivers,
            webview_height_ratio: 'full',
          },
          {
            // see list of teams`
            messenger_extensions: true,
            type: 'web_url',
            // attach senderID to the URL
            url: `${endpoints.prodCardsEndpoint}/teams?size=mini&id=${sender_id}`,
            title: values.titles.choose_teams,
            webview_height_ratio: 'full',
          },
        ],
      },
    },
  }
}
// send buttons that bring up webviews
exports.logInButton = () => {
  return {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'button',
        text: 'Login',
        buttons: [
          {
            type: 'account_link',
            url: 'f1-cards.herokuapp.com/login',
          },
        ],
      },
    },
  }
}
// takes id and response obj
exports.callSendAPI = (sender_psid, response) => {
  console.log('CALL API')
  let request_body = {
    recipient: {
      id: sender_psid,
    },
    message: response,
  }
  return new Promise((resolve, reject) => {
    return request(
      module.exports.facebookObj(request_body),
      (err, res, body) => {
        if (!err && !body.error) {
          console.log('message sent!')
          resolve('message sent!')
        } else if (err) {
          reject('Unable to send message:' + err)
          console.error('Unable to send message:' + err)
        } else {
          console.error('Body Error in callSendAPI', body.error)
          // console.error('Body Error in callSendAPI', body.error)
          reject('Body Error in callSendAPI', body.error.message)
        }
      }
    )
  })
}
