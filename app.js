require('dotenv').config(`${__dirname}/.env`)
const helmet = require('helmet')
var express = require('express')
var path = require('path')
var cookieParser = require('cookie-parser')
var logger = require('morgan')
// console.log(`${__dirname}/.env`)

var indexRouter = require('./routes/index')
var usersRouter = require('./routes/users')

var app = express()
app.use(helmet())
app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

app.use('/', indexRouter)
app.use('/users', usersRouter)

module.exports = app
