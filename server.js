const { networkInterfaces } = require('os');
var message = 'CSC-317 node/express app \n'
    + 'This uses nodeJS, express, and express.static\n'
    + 'to \"serve\" the files in the ./public/ dir!\n';

var express = require('express');
var app = express();
var port = 3000;

var path = require('path');
var StaticDirectory = path.join(__dirname, 'public');
app.use(express.static(StaticDirectory));

const ip = Object.values(networkInterfaces())
    .flat()
    .find(net => net.family === 'IPv4' && !net.internal)?.address;

app.listen(port, () => {
    console.log(`Listening on http://${ip}:${port}/`); // could not view at this link
    console.log(`View at http://localhost:${port}`); // added this so i can view the static html page
});

console.log(message);




