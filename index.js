require('dotenv').config()

const express = require('express')
const cors = require('cors');
const authRoutes = require('./routes.js/AuthRoute');
const userRoutes = require('./routes.js/UserRoute');
const streamRoutes = require('./routes.js/StreamRoute');

const http = require('http');
const socketIo = require('socket.io');

//application
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

io.on('connection', (socket) => {
    console.log('User connected: ', socket.id);

    socket.on('stream', (data) => {
        // Phát lại luồng video cho các client khác
        socket.broadcast.emit('stream', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected: ', socket.id);
    });
});

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
app.use('/api', streamRoutes);

// log api requests
app.use((req, res, next) => {
    console.log(req.path, req.method);
    next();
})

// start server
const port = process.env.DEVELOPMENT_PORT || 4000;

server.listen(port, (err) => {
    if (err) {
        console.error('Failed to start server:', err);
        process.exit(1); 
    } else {
        console.log(`Server started! Listening on port ${port}`);
    }
});