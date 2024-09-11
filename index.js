require('dotenv').config()

const express = require('express')
const cors = require('cors');
const authRoutes = require('./routes.js/AuthRoute');
const userRoutes = require('./routes.js/UserRoute');

//application
const app = express();

app.use(cors({
    origin: process.env.WEB_PORT || '5173',
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))

//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// router
app.use('/api', authRoutes);
app.use('/api', userRoutes);

// log api requests
app.use((req, res, next) => {
    console.log(req.path, req.method);
    next();
})

// start server
const port = process.env.DEVELOPMENT_PORT || 4000;

app.listen(port, (err) => {
    if (err) {
        console.error('Failed to start server:', err);
        process.exit(1); 
    } else {
        console.log(`Server started! Listening on port ${port}`);
    }
});