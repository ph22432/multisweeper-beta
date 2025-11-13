const path = require("path");
const onLogin = require("./login");
const onRegister = require("./register");
const leaderboards = require("./leaderboards");
const express = require("express");

module.exports = function (app) {



    let clientPath = path.join(__dirname, "../client");

    app.get('/', function (req, res) {
        //console.log(req.username);
        res.sendFile(path.join(clientPath, "/index.html"));
    });

    //login
    app.get('/login.html', function (req, res) {

        res.sendFile(path.join(clientPath, "/login.html"))
    });

    app.get('/leaderboards.html', function (req, res) {
        leaderboards(req, res);
    })
    app.get('/account.html', function (req, res) {
        res.send("Unavailable");
    })

    app.post('/userlogin', function (req, res) {
        onLogin(req, res);
    });
    app.get('/register.html', function (req, res) {
        res.sendFile(path.join(clientPath, "/register.html"));
    })

    app.post("/userregister", function (req, res) {
        onRegister(req, res);
    })

    app.use(express.static(clientPath));
}
