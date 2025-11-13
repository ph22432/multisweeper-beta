const generator = require("./utils/mGenerator");
const servTimer = require("./utils/servTimer");
const socket = require("socket.io");
const database = require("./utils/updateDatabase")
const fs = require('fs');
const internal = require("stream");
const { INIT_TEMPLATE_FILE } = require("snowpack/lib/cjs/util");
var activeSockets = [];
var timedQueue = [];
var turnQueue = [];
var rooms = [];

var timer;

module.exports = function (server) {

    const io = socket(server);
    /////////////////////////////////////////////////

    io.on('connection', (socket) => {
        var username = "Guest";
        //console.log(socket.request.headers.cookie);
        try {
            let token = socket.request.headers.cookie.split("session_token=").pop();
            if (token) {
                console.log(token);
            }
            let checkToken;

            fs.readFile("./sessions.txt", 'utf8', (err, data) => {
                if (err) {
                    console.log(error);
                    return;
                }

                let sessions = data.split(";");
                for (let i = 0; i < sessions.length; i++) {
                    let index = sessions[i].indexOf("session_token")
                    //console.log(index);
                    if (!(index == -1)) {
                        checkToken = sessions[i].substring(14);

                        if (checkToken == token) {
                            username = sessions[i + 1].substring(9);
                            console.log(username);
                            socket.emit("join", username);
                        }
                    }
                }

            })

        }
        catch {
            socket.emit("join", username);
        }
        activeSockets.push(socket);
        console.log(activeSockets.length);
        let room;
        let timedMode;
        let score = 0;

        socket.on('queue', (timed) => {
            console.log("Socket added to queue");
            let queue;
            let x;
            let y;
            let m;
            timedMode = timed;
            if (timed) {
                queue = timedQueue;
                x = 13;
                y = 17;
                m = 40;
            }
            else {
                queue = turnQueue;
                x = 15;
                y = 15;
                m = 40;
            }
            queue.push(socket);
            //array is a reference type, so changing queue will also affect timedQueue or turnQueue
            console.log(queue.length);

            if (queue.length > 1) {

                let roomid = "R_" + rooms.length;
                rooms.push(roomid);
                console.log(roomid, "created");

                let p1 = queue.shift();
                let p2 = queue.shift();

                let mines = generator(x, y, m);
                p1.emit('joined', [x, y, mines, roomid, timedMode]);
                p2.emit('joined', [x, y, mines, roomid, timedMode]);

                servTimer.startTimer();
                timer = setInterval(() => {
                    if (servTimer.timeToDisplay(timedMode) != "STOP") {
                        io.to(room).emit("tick", servTimer.timeToDisplay(timedMode));
                    }
                    else {
                        servTimer.stopTimer()
                        io.to(room).emit("endgame", servTimer.endTime - servTimer.startTime);
                        clearInterval(timer);
                    }
                    //console.log("tick");
                }, 1000);

                if (!timedMode) {
                    setTimeout(() => { socket.emit("startturn") }, 3040);
                }
            }
        });

        socket.on("updateinfo", (data) => {
            database(data);
        })
        //TIMED QUEUE CODE

        socket.on("flagged", (data) => {
            socket.broadcast.to(room).emit("flagged", data);
        });

        socket.on("unflagged", (data) => {
            socket.broadcast.to(room).emit("unflagged", data);
        });

        //TURN QUEUE CODE

        socket.on("endturn", () => {
            socket.broadcast.to(room).emit("startturn");
        })

        socket.on("turnflag", (data) => {
            socket.broadcast.to(room).emit("turnflag", data);
            console.log("turn flag received");
            if (!data.correct) {
                socket.broadcast.to(room).emit("startturn");
                console.log("SWITCH TURN")
            }
        })

        socket.on("boardfinish", () => {
            servTimer.stopTimer();
            io.to(room).emit("endgame", servTimer.endTime - servTimer.startTime);
            clearInterval(timer);
        })

        ///compatible to both
        socket.on("roomready", (roomid) => {
            room = roomid;
            console.log(roomid, "started");
            socket.join(room);
        });

        socket.on("cellclicked", (data) => {
            console.log(data);
            socket.broadcast.to(room).emit("uncover", data);
            if (!timedMode) {
                socket.emit("endturn");
                socket.broadcast.to(room).emit("startturn");
            }
        });

        socket.on("changescore", (change) => {
            score += change.score;
            socket.broadcast.to(room).emit("changescore", { score: score, mine: change.mine });
        })

        socket.on("disconnecting", () => {
            io.to(room).emit("playerleave")
            clearInterval(timer);
        }
        )

        socket.on('disconnect', () => {
            console.log("disconnect");
            activeSockets.splice(activeSockets.indexOf(socket));

            console.log(activeSockets.length);
            if (!room) {//removes from waiting queue if left
                if (timedMode) {
                    timedQueue.splice(timedQueue.indexOf(socket));
                }
                else {
                    turnQueue.splice(turnQueue.indexOf(socket));
                }
            }
            clearInterval(timer);
        })

        socket.on("halt", () => {
            clearInterval(timer);
        })
    });
}