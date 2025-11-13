const sql = require("mysql");
const uuid = require("uuid");
const fs = require('fs');
module.exports = function (req, res) {

    //connect to user database
    var con = sql.createConnection({
        host: '########',
        user: '########',
        password: '########',
        database: '########'
    });

    let username = req.body.username;
    let password = req.body.password;

    if (username && password) {
        command = ""
        con.query(command.concat("SELECT * FROM Users WHERE Username = '", username, "' AND Password = '", password, "';"),
            function (err, results, fields) {

                if (err) throw err;

                if (results.length != 0) { //if credentials found
                    let now = new Date();
                    let expiration = new Date(+ now + 240 * 1000)
                    let sessionToken = uuid.v4();

                    fs.appendFile("./sessions.txt", ";session_token=" + sessionToken + ";username=" + username + ";expires=" + expiration, (err) => { console.log(err); });

                    res.cookie("session_token", sessionToken, { expires: expiration });
                    res.redirect("/");
                }
                else {
                    res.send("Incorrect credentials");
                }
            });
    }
    console.log("finish");

    con.on('error', function (err) {
        console.log("[mysql error]", err);
    })
}