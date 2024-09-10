require('dotenv').config()

const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors');
const authRoutes = require('./routes.js/AuthRoute');

//application
const app = express();

app.use(cors({
    origin: process.env.API_ENDPOINT_HOST || '3000',
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))

//middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// router
app.use('/api', authRoutes)

// log api requests
app.use((req, res, next) => {
    console.log(req.path, req.method)
    next()
})


//connect to db
mongoose.connect(process.env.DATABASE_URI)
    .then(() => {
        // listen 
        app.listen(process.env.DEVELOPMENT_PORT, () => {
            console.log('Connected to database! Listening on port', process.env.DEVELOPMENT_PORT)
        })
    })
    .catch((error) => {
        console.log(error)
    })