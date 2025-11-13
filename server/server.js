const express = require("express");
const session = require("express-session");
const routes = require("./routes");
const gameServer = require("./gameServer");
const app = express();

//initialize session data
app.use(session({
    secret: 'test',
    resave: true,
    saveUninitialized: true
}));

//get middleware for handling json data sent by request methods
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = 3000 || process.env.PORT;
var server = app.listen(PORT, () => console.log("listening on", PORT));

gameServer(server);

//route handler
routes(app, server);
