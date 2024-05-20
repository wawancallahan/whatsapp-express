const express = require('express'); 
const path = require('path'); 
const cookieParser = require('cookie-parser'); 
const { Client, LocalAuth } = require('whatsapp-web.js');
const _ = require('lodash');
const Joi = require('joi');

require('dotenv').config()
  
const app = express(); 
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './whatsapp'
    }),
    puppeteer: {
        args: ['--no-sandbox', '--headless', '--disable-gpu'],
        executablePath: '/usr/bin/chromium-browser'
    }
});
  
app.use(express.json()); 
app.use(express.urlencoded({ extended: false })); 
app.use(cookieParser()); 


// Client Whatsapp

let qrc = null;
let authenticatedc = null;

client.initialize();

client.on('qr', (qr) => {
    qrc = qr;
});

client.on('authenticated', (session) => {
    authenticatedc = session;
});

client.on('ready', () => {
    console.log('Client is ready!');
});

// -- Client Whatsapp

const handler = express.Router();

handler.get('/auth', (req, res, next) => {
    if (_.isNil(authenticatedc)) {
        res.status(200).json({
            status: 'SUCCESS',
            message: 'AUTH LOGIN',
            code: 'AUTH_LOGIN',
            data: {
                qr: qrc
            }
        });

        res.end();

        return;
    }

    res.status(200).json({
        status: 'SUCCESS',
        message: 'AUTH SUCCESS',
        code: 'AUTH_SUCCESS',
        data: authenticatedc
    });

    res.end();
});

handler.post('/send', (req, res, next) => {
    if (_.isNil(authenticatedc)) {
        res.status(403).json({
            status: 'FAILED',
            message: 'AUTH FAILED',
            code: 'AUTH_FAILED'
        });

        res.end();

        return;
    }

    const schema = Joi.object({
        phoneNumber: Joi.string().required(),
        message: Joi.string().required(),
    });

    const validate = schema.validate(req.body);

    if (validate.error) {
        res.status(400).json({
            status: 'FAILED',
            message: 'BAD REQUEST',
            code: 'BAD_REQUEST',
            error: validate.error
        });

        res.end();

        return;
    }

    $(async function () {
        try {
            await client.sendMessage(`${req.body.phoneNumber}`, req.body.message);
        } catch (error) {}
    })();

    res.status(200).json({
        status: 'SUCCESS',
        message: 'SEND SUCCESS',
        code: 'SEND_SUCCESS'
    });

    res.end();
});

handler.get('/logout', (req, res, next) => {
    $(async function () {
        try {
            await client.logout();
        } catch (error) {}
    })();

    authenticatedc = null;

    res.status(200).json({
        status: 'SUCCESS',
        message: 'LOGOUT SUCCESS',
        code: 'LOGOUT_SUCCESS'
    });

    res.end();
});

app.use('/', handler);
  
app.use(function (err, req, res, next) { 
    res.locals.message = err.message; 
    res.status(err.status || 500); 
    res.render('error'); 
}); 
  
module.exports = app;