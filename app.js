const express = require('express'); 
const path = require('path'); 
const cookieParser = require('cookie-parser'); 
  
const app = express(); 
  
app.use(express.json()); 
app.use(express.urlencoded({ extended: false })); 
app.use(cookieParser()); 
  
app.use(function (err, req, res, next) { 
    res.locals.message = err.message; 
    res.status(err.status || 500); 
    res.render('error'); 
}); 
  
module.exports = app;