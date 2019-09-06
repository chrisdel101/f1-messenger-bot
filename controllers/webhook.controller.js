const request = require('request')
const slugify = require('slugify')
const endpoints = require('../endpoints')
const { httpsFetch } = require('../utils')
const testWords = require('../test_words.json')
const responses = require('../responses.json')
const driversCache = require('../driversCache')
const moment = require('moment')

exports.facebookObj = request_body => {
  return {
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: request_body
  }
}

exports.sendHookResponse = (req, res) => {
  let body = req.body
  // Checks this is an event from a page subscription
  if (body.object === 'page') {
    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {
      // Gets the message. entry.messaging is an array, but
      // will only ever contain one message, so we get index 0
      let webhook_event = entry.messaging[0]
      console.log(webhook_event)
      // Get the sender PSID
      let sender_psid = webhook_event.sender.id
      console.log('Sender PSID: ' + sender_psid)
      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        module.exports.handleMessage(sender_psid, webhook_event)
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback)
      }
    })

    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED')
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404)
  }
}

exports.verifyHook = (req, res) => {
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
exports.slugifyDriver = driverName => {
  const newName = slugify(driverName, {
    lower: true
  })
  return newName
}
exports.getAllDriverSlugs = () => {
  return httpsFetch(endpoints.productionAPI('drivers')).then(drivers => drivers)
}
// check if string is driver name from api
exports.checkDriverApi = nameToCheck => {
  try {
    return module.exports.getAllDriverSlugs().then(drivers => {
      if (drivers.includes(nameToCheck)) {
        return true
      }
      return false
    })
  } catch (e) {
    console.error('An error in checkDriverApi', e)
  }
}
// check if timestamp is older than 30 mins
exports.verifyTimeStamp = timeStamp => {
  const d1 = new moment(timeStamp)
  const d2 = new moment()
  // subract time1 from time 2
  const diff = moment.duration(d2.diff(d1)).asMinutes()
  // less than 30 mins true, else false
  return diff < 30 ? true : false
}
// handle caching and return driver obj
exports.cacheAndGetDriver = (driverSlug, driversCache) => {
  // if not in cache add to cache
  if (!driversCache.hasOwnProperty(driverSlug)) {
    // call all drivers api and check if it's there
    return module.exports.checkDriverApi(driverSlug).then(bool => {
      // if driver name is valid
      if (bool) {
        //  add to cache
        // console.log('here', driversCache)
        driversCache[driverSlug] = {
          slug: driverSlug,
          imageUrl: endpoints.productionCards(driverSlug),
          timeStamp: new Date()
        }
        // console.log('here', driversCache)
        // return new driver obj
        return {
          slug: driverSlug,
          imageUrl: endpoints.productionCards(driverSlug),
          timeStamp: new Date()
        }
      } else {
        console.log('Not a valid driver name')
        return false
      }
    })
    // if driver is in cache already
  } else if (driversCache.hasOwnProperty(driverSlug)) {
    // check if time is valid
    if (module.exports.verifyTimeStamp(driversCache[driverSlug].timeStamp)) {
      // if valid get from cache
      return driversCache[driverSlug]
      // if not valid then re-add
    } else {
      driversCache[driverSlug] = {
        slug: driverSlug,
        imageUrl: endpoints.productionCards(driverSlug),
        timeStamp: new Date()
      }
      return {
        slug: driverSlug,
        imageUrl: endpoints.productionCards(driverSlug),
        timeStamp: new Date()
      }
    }
  } else {
    console.log('Not a valid driver name to cache')
    return false
  }
}
// take user input and check to send back response
exports.checkInputText = inputText => {
  // check if input was a driver name
  try {
    return module.exports.checkDriverApi(inputText).then(bool => {
      // true if a driver name
      if (bool) {
        // send driver card
        // console.log('cache', driversCache)
        const driverSlug = module.exports.slugifyDriver(inputText)
        const driver = module.exports.cacheAndGetDriver(
          driverSlug,
          driversCache
        )
        return driver
        // if not driver
      } else {
        // if in array return greeting
        if (testWords.prompt_greeting.includes(inputText)) {
          return responses.profile.greeting
        } else if (testWords.prompt_help.includes(inputText)) {
          return responses.help.ask
        }
        // if text is hello, or other start word, welcome/
        // if help listing a few options
        // if card, driver, team, prompt with which driver?
      }
    })
  } catch (e) {
    console.log('An error in checkInputText', e)
  }
}
// Handles messages events
exports.handleMessage = (sender_psid, webhook_event) => {
  let response
  try {
    // Check if the message contains text
    if (webhook_event.message.text) {
      // check if text is a driver name
      return module.exports
        .checkInputText(webhook_event.message.text)
        .then(res => {
          // console.log('res', res)
          // return module.exports
          //   .checkDriverApi(webhook_event.message.text)
          //   .then(bool => {
          //     if (bool) {
          //       // Create the payload for a basic text message
          //       const driverSlug = module.exports.slugifyDriver(
          //         webhook_event.message.text
          //       )
          response = {
            attachment: {
              type: 'image',
              payload: {
                // template_type: 'generic',
                url: res.imageUrl,
                is_reusable: true
              }
            }
          }
          return module.exports.callSendAPI(sender_psid, response)
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
    console.error('Error in handleMessage', e)
  }
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
  let response

  // Get the payload for the postback
  let payload = received_postback.payload

  // Set the response based on the postback payload
  if (payload === 'yes') {
    response = { text: 'Thanks!' }
  } else if (payload === 'no') {
    response = { text: 'Oops, try sending another image.' }
  }
  // Send the message to acknowledge the postback
  module.exports.callSendAPI(sender_psid, response)
}

exports.callSendAPI = (sender_psid, response) => {
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
