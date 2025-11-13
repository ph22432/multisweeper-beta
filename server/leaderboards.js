const sql = require("mysql");

module.exports = function (req, res) {

    //connect to user database
    var con = sql.createConnection({
        host: '########',
        user: '########',
        password: '########',
        database: '########'
    });

    command = ""
    con.query(command.concat("SELECT Username, TimedScore,TurnScore FROM Users ORDER BY TimedScore DESC;"),
        function (err, results, fields) {

            if (err) throw err;

            res.send(results);
        });
}
