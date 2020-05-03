const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');

const registroRoute = require('./routes/registroRoute');
const clientRoute = require('./routes/clientRoute');
const negocioRoute = require('./routes/negocioRoute');

const HttpError = require('./util/http-error');
const path = require('path');

const app = express();

app.use(bodyParser.json());
app.use('/uploads/images', express.static(path.join('uploads', 'images')));

const firebaseConfig = {
    apiKey: "AIzaSyBIr4TM1Npq93U7fnpuNBh1PtHH10tqpRc",
    authDomain: "mexicoencasa-e7edb.firebaseapp.com",
    databaseURL: "https://mexicoencasa-e7edb.firebaseio.com",
    projectId: "mexicoencasa-e7edb",
    storageBucket: "mexicoencasa-e7edb.appspot.com",
    messagingSenderId: "966791408480",
    appId: "1:966791408480:web:fac82ceee6edb024698c05"
};

require('./firebase').init(firebaseConfig);


app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers',
        'Origin, X-Requested-With, content-type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
    next();
});

app.use('/api/registro', registroRoute);
app.use('/api/client', clientRoute);
app.use('/api/business', negocioRoute);

app.use((req, res, next) => {
    throw new HttpError('Could not find this route', 404);
});


app.use((error, req, res, next) => {
    res.status(error.code || 500);
    res.json({ message: error.message || 'An unknown error occurred!' });
});

const server = app.listen(5000 || process.env.PORT);
const io = require('./socket').init(server);
io.on('connection', socket => {
    console.log('Client connected');
});

