const sql = require("mysql");

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
        if (!(username.match(/^[0-9A-Za-z]+$/) === null) && !(password.match(/^[0-9A-Za-z]+$/) === null)) {
            command = ""
            con.query(command.concat("SELECT * FROM Users WHERE Username = '", username, "';"),
                function (err, results, fields) {

                    if (err) throw err;

                    if (results.length == 0) { //if username doesn't exist
                        command = ""
                        con.query(command.concat("INSERT INTO Users (ID, Username, `Password`, TimedScore, TurnScore, Wins, Losses, BestTime) VALUES (NULL, '", username, "', '", password, "', 0,0,0,0,999);"));
                        res.send("User created. Please go back to log in");
                    }
                    else {
                        res.send("Username is taken");
                    }
                });
        }
        else {
            res.send("Invalid characters");
        }
        console.log("finish");

        con.on('error', function (err) {
            console.log("[mysql error]", err);
        })

    }

}