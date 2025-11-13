const socket = io.connect("http://localhost:3000");
socket.emit("JOINED")
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
var username;

class GameController {
    constructor(xLen, yLen, mines, padding, timed) {
        this.boardSize = { x: xLen, y: yLen };
        this.mineNum = mines.length;
        this.canvasSize = { x: canvas.width, y: canvas.height };
        this.minePositions = mines;
        this.minePenalty = -200;

        this.playerGameBoard = new Board(xLen, yLen, this.minePositions);
        this.playerDisplay = new Display(this.canvasSize, this.boardSize, padding);

        this.playerScoreboard = new Scoreboard(padding, timed, mines.length);
        this.playerScore = 0;
        this.enemyScore = 0;
        this.minesClicked = 0;


        canvas.addEventListener("mouseup", event => this.clickHandler(event));

        socket.on("uncover", (c) => {
            this.enemyClicked(c);
        });
    }

    scoreUpdate(change, player) {
        this[player.concat("Score")] += change;
        this[player.concat("Scoreboard")].drawScore(this[player.concat("Score")]);
        // this.playerDisplay.
    }

    endGame() {
        try {
            delete this.playerDisplay;
            delete this.playerGameBoard;
            delete this.enemyDisplay;
            delete this.enemyGameBoard;
        }
        catch {
            console.log("delete error");
        }
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "bold 40px arial";
        if (this.playerScore > this.enemyScore) {
            ctx.fillText("YOU WIN!", 350, 200);
        }
        else {
            ctx.fillText("YOU LOSE", 350, 200);
        }
        ctx.font = "16px arial";
        ctx.fillText("Your score: ".concat(this.playerScore), 400, 240);
        ctx.fillText("Enemy score: ".concat(this.enemyScore), 400, 260);

    }

    playerMine(self) {
        self.scoreUpdate(self.minePenalty, "player");
        self.minesClicked++;
        self.playerScoreboard.changeMineCount(false);
    }

    enemyMine(self) {
        self.scoreUpdate(self.minePenalty, "enemy");
        self.enemyScoreboard.changeMineCount(false);
    }


    displayClicked(e, flagCallback, unflagCallback) {
        console.log("ev_mup")
        let cellPosition = this.playerDisplay.isPointInCell(e.offsetX, e.offsetY, this.playerGameBoard.grid);

        if (cellPosition != null) {

            if (!this.playerDisplay.uncoveredCells.some(c => c.x == cellPosition.x && c.y == cellPosition.y)) {
                let flagged = this.playerGameBoard.isFlagged(cellPosition.x, cellPosition.y);

                switch (e.button) {
                    case 0://right click
                        if (!flagged) {
                            socket.emit("cellclicked", cellPosition);
                            this.updateGameBoard(cellPosition, this.playerGameBoard, this.playerDisplay, this.playerMine); //callback for if mine is found
                            console.log(this.minesClicked);
                            if (this.playerDisplay.uncoveredCells.length - this.minesClicked >= (this.boardSize.x * this.boardSize.y) - this.mineNum) {
                                socket.emit("boardfinish");
                            }
                        }
                        break;
                    case 2://left click
                        if (!flagged) {
                            console.log("flagging")
                            flagCallback(cellPosition, this, "player");
                        }
                        else {
                            unflagCallback(cellPosition, this, "player");
                        }
                        break;
                }
            }
        }
    }

    updateGameBoard(cellPosition, gameBoard, display, callback) {
        let x = cellPosition.x;
        let y = cellPosition.y;

        let value = gameBoard.getGridValue(x, y);
        if (value == 0) {
            let cellsToUncover = gameBoard.checkCellsToUncover(cellPosition);

            for (const cell of cellsToUncover) {
                display.uncoverCell(cell.value, cell.x, cell.y);
            }
        }
        else {
            display.uncoverCell(value, x, y);


            if (gameBoard.containsMine(x, y)) { callback(this); }//callback depends on flag status and mode
            else { gameBoard.uncoverCell(x, y); }
        }

    }
}

class TimedGameController extends GameController {
    constructor(xLen, yLen, mines, padding) {

        super(xLen, yLen, mines, padding, true);

        this.enemyGameBoard = new Board(xLen, yLen, this.minePositions);
        this.enemyDisplay = new Display(this.canvasSize, this.boardSize, { x: padding.x + 470, y: padding.y });
        this.enemyScoreboard = new Scoreboard({ x: padding.x + 470, y: padding.y }, true, mines.length);

        this.timer = new Timer(0, true);
        this.timer.startTimer();
        this.timer.drawTimer();

        socket.on("tick", () => {
            this.timer.drawTimer()
        });

        socket.on("flagged", (cell) => {
            this.flag(cell, this, "enemy");
        });

        socket.on("unflagged", (cell) => {
            this.unflag(cell, this, "enemy");
        });

        socket.on("endgame", (time) => {
            this.endGame()
            socket.emit("updateinfo", { username: username, score: (this.playerScore + 10000000 / time) });
        });
    }

    clickHandler(e) {
        this.displayClicked(e, this.flag, this.unflag);
    }

    flag(cellPosition, self, player) {
        console.log(player);
        if (player == "player") {
            self.playerGameBoard.addFlag(cellPosition.x, cellPosition.y);
            socket.emit("flagged", cellPosition);
        }
        self[player.concat("Display")].drawCell("F0", cellPosition.x, cellPosition.y);
        self[player.concat("Scoreboard")].changeMineCount(false);
    }

    unflag(cellPosition, self, player) {
        if (player == "player") {
            self.playerGameBoard.removeFlag(cellPosition.x, cellPosition.y);
            socket.emit("unflagged", cellPosition);
        }

        self[player.concat("Display")].drawCell("", cellPosition.x, cellPosition.y);
        self[player.concat("Scoreboard")].changeMineCount(true);
    }

    enemyClicked(cellPosition) {
        this.updateGameBoard(cellPosition, this.enemyGameBoard, this.enemyDisplay, this.enemyMine);
    }

}

class TurnGameController extends GameController {

    constructor(xLen, yLen, mines, padding) {
        super(xLen, yLen, mines, padding, false);
        this.enemyScoreboard = new Scoreboard({ x: padding.x + 650, y: padding.y }, false, mines.length);
        this.flagReward = 50;
        this.flagPenalty = -25;

        this.isTurn = false;
        this.changeTurn(false);
        socket.on("turnflag", c => {
            this.enemyFlagged(c.position, c.correct);

        });
        socket.on("startturn", () => {
            console.log("startturn received")
            this.changeTurn(true);
        });
        socket.on("endturn", () => {
            console.log("endturn received")
            this.changeTurn(false);

        });

        socket.on("endgame", () => {
            this.endGame()
            socket.emit("updateinfo", { username: username, score: this.playerScore });
        });
    }

    playerMine(self) {
        self.scoreUpdate(self.minePenalty, "player");
        self.minesClicked++;
        self.playerScoreboard.changeFlagCount();
    };

    clickHandler(e) {
        if (this.isTurn) {
            this.displayClicked(e, this.checkFlag, this.tryUnflag);
        }
    }

    changeTurn(playerTurn) {
        if (playerTurn) {
            this.isTurn = true;
            ctx.clearRect(700, 0, 200, 100);
            ctx.fillStyle = "hotpink";
            ctx.font = "bold 20px arial";
            ctx.fillText("YOUR TURN", 50, 50);
        }
        else {
            this.isTurn = false;
            ctx.clearRect(50, 0, 140, 100);
            ctx.fillStyle = "cornflowerblue";
            ctx.font = "bold 20px arial";
            ctx.fillText("ENEMY TURN", 700, 50);
        }
    }

    checkFlag(cellPosition, self) {
        let c = true;
        let val = "P1F1"; //assume true
        if (!self.playerGameBoard.containsMine(cellPosition.x, cellPosition.y)) {//if not change values
            val = "P1F2";
            c = false;
            self.changeTurn(c);
            self.scoreUpdate(self.flagPenalty, "player");
        }
        else {
            self.scoreUpdate(self.flagReward, "player");
            self.playerScoreboard.changeFlagCount();
        }
        self.playerDisplay.uncoverCell(val, cellPosition.x, cellPosition.y);
        socket.emit("turnflag", { position: cellPosition, correct: c });
    }

    tryUnflag() {
        console.log("Cannot unflag.")
    }

    enemyClicked(cellPosition) {
        this.updateGameBoard(cellPosition, this.playerGameBoard, this.playerDisplay, this.enemyMine);
    }

    enemyFlagged(cellPosition, correct) {
        let value = "P2F";
        console.log(cellPosition)
        console.log(correct)
        if (correct) {
            value += "1";
            this.scoreUpdate(this.flagReward, "enemy");
            this.enemyScoreboard.changeFlagCount();
        }
        else {
            value += "2";
            this.scoreUpdate(this.flagPenalty, "enemy");
        }
        this.playerDisplay.uncoverCell(value, cellPosition.x, cellPosition.y);
    }

}

class Menu {
    constructor() {
        this.timedBtn = new Path2D();
        this.turnBtn = new Path2D();

        this.drawMenu();

    }

    drawMenu() {

        this.timedBtn.rect(300, 100, 300, 50);
        ctx.fillStyle = "black";
        ctx.fill(this.timedBtn);
        ctx.fillStyle = "white";
        //ctx.font(12)
        ctx.fillText("PLAY TIMED", 418, 127);

        ctx.lineWidth = 3;
        ctx.strokeStyle = "white";
        ctx.stroke(this.timedBtn);

        this.turnBtn.rect(300, 200, 300, 50);
        ctx.fillStyle = "black";
        ctx.fill(this.turnBtn);
        ctx.fillStyle = "white";
        ctx.fillText("PLAY TURN-BASED", 404, 227);
        ctx.stroke(this.turnBtn);

    }

    menuClicked(e) {
        console.log("mClick")
        if (ctx.isPointInPath(this.timedBtn, e.offsetX, e.offsetY)) {
            ctx.clearRect(0, 0, 900, 450);
            return 1;
        }
        else if ((ctx.isPointInPath(this.turnBtn, e.offsetX, e.offsetY))) {
            ctx.clearRect(0, 0, 900, 450);
            return 0;
        }
        return null;
    }
}


class Timer {
    constructor(time, timedMode) {
        this.time = time;
        this.timedMode = timedMode;
        this.startTime;
        this.endTime;
    }

    drawTimer() {
        ctx.fillStyle = "white"
        ctx.clearRect(370, 30, 100, 100)//x=500
        ctx.fillStyle = "red";
        ctx.font = "bold 30px Azeret Mono";
        let time = Math.floor((Date.now() - this.startTime) / 1000);
        ctx.fillText(("00" + time).slice(-3), 400, 70);
    }

    startTimer() {
        this.startTime = Date.now();
    }
    endTimer() {
        this.endTime = Date.now();
    }
}

/*
let cell = new Path2D();
let xPos = (this.padding + i * (this.cellSize + 3));
let yPos = (30 + j * (this.cellSize + 3));

cell.rect(xPos, yPos, this.cellSize, this.cellSize);
cellColumn.push(cell);
if ((i == Math.floor((gridSize.x - 1) / 2)) && (j == Math.floor((gridSize.y - 1) / 2))) {
    ctx.fillStyle = "black";
}
else {
    ctx.fillStyle = "grey";
}
ctx.fill(cell);*/


function Main() {
    console.log("Loaded")
    ctx.clearRect(0, 0, canvas.width, canvas.height,);

    menu = new Menu();
    canvas.addEventListener("click", clicked);

}


function clicked(e) {
    let startTimed = menu.menuClicked(e)
    if (startTimed == 1) {
        enterWaitingRoom(true);
    }
    else if (startTimed == 0) {
        enterWaitingRoom(false);
    }
}

function enterWaitingRoom(timed) {
    canvas.removeEventListener("click", clicked);
    ctx.font = "14px arial";
    ctx.fillText("WAITING FOR PLAYERS...", 370, 100);
    console.log("game initiating")
    socket.emit("queue", timed);
}

function StartTimedGame(x, y, mines) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var game = new TimedGameController(x, y, mines, { x: (0.1 * canvas.height), y: (0.1 * canvas.height) }, true);

}


function StartTurnGame(x, y, mines) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var game = new TurnGameController(x, y, mines, { x: 240, y: 30 }, false);
}

function countdown(data, callback) {

    let x = data[0];
    let y = data[1];
    let mines = data[2];
    console.log(data[3]);

    ctx.font = "30px arial";
    ctx.fillStyle = "white";

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillText("3", 440, 220);
    setTimeout(function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillText("2", 440, 220);
    }, 1000)
    setTimeout(function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillText("1", 440, 220);
    }, 2000)
    setTimeout(function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillText("GO", 440, 220);
        socket.emit("roomready", (data[3]));
        callback(x, y, mines)
    }, 3000)
}

socket.on("join", (data) => {
    username = data;
});

socket.on("joined", (data) => {
    if (data[4]) {
        countdown(data, StartTimedGame);
    }
    else {
        countdown(data, StartTurnGame);
    }
});

socket.on("playerleave", () => {
    console.log("error");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "16px arial";
    ctx.fillText("A CONNECTION ERROR HAS OCCURED. PLEASE REFRESH THE PAGE", 290, 100)
    socket.emit("halt");
});


