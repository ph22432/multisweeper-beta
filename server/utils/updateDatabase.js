const sql = require("mysql");

module.exports = function (data) {

    var con = sql.createConnection({
        host: '########',
        user: '########',
        password: '########',
        database: '########',
    });

    let command = "";
    if (data.username && data.username != "Guest") {
        console.log(data);
        con.query(command.concat("SELECT TimedScore FROM Users WHERE Username = '", data.username, "';"),
            function (err, results, fields) {
                let comm2 = "";
                console.log(results);
                console.log(results[0]);
                console.log(results.TimedScore);
                console.log(results[0].TimedScore);
                con.query(comm2.concat("UPDATE Users SET TimedScore = ", results[0].TimedScore + data.score, " WHERE Username = '", data.username, "';"));
            });
    }
}