const fs = require('fs');
const express = require('express');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');

const registroRoute = require('./routes/registroRoute');
const clientRoute = require('./routes/clientRoute');
const negocioRoute = require('./routes/negocioRoute');
const homeRoute = require('./routes/homeRoute');
const productRoute = require('./routes/productRoute');
const checkAuth = require('./middleware/check-auth');
const { authRole } = require('./middleware/auth');
const { ROLE } = require('./util/permissions/roles');

const HttpError = require('./util/http-error');
const path = require('path');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const firebaseConfig = {
    apiKey: "AIzaSyCdrGa36-Lo-DH9J3BoEj1Wir6hwfIYBpA",
    authDomain: "catalogocovid2020.firebaseapp.com",
    databaseURL: "https://catalogocovid2020.firebaseio.com",
    projectId: "catalogocovid2020",
    storageBucket: "catalogocovid2020.appspot.com",
    messagingSenderId: "1030415722995",
    appId: "1:1030415722995:web:b62bf0ba6bc4c373094a86"
};

require('./firebase').init(firebaseConfig);


app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers',
        'Origin, X-Requested-With, content-type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
    next();
});

app.use('/api/home', homeRoute);
app.use('/api/registro', registroRoute);

//app.use(checkAuth);

app.use('/api/customer', authRole(ROLE.CUSTOMER), clientRoute);
app.use('/api/business', negocioRoute);
app.use('/api/product', productRoute);


app.use((req, res, next) => {
    throw new HttpError('Could not find this route', 404);
});


app.use((error, req, res, next) => {
    res.status(error.code || 500);
    res.json({ message: error.message || 'An unknown error occurred!' });
});

const server = app.listen(process.env.PORT || 5000);

const io = require('./socket').init(server);
io.on('connection', socket => {
    console.log('Client connected');
});

