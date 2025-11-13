class Board {
    constructor(xLen, yLen, minePositions) {
        this.size = { x: xLen, y: yLen };
        this.mineCount = minePositions.length;
        this.minePos = minePositions;
        this.grid = this.generateBoard(xLen, yLen, this.minePos);
        this.fillBoard();
        this.uncoveredCells = [];
    }

    uncoverCell(x, y) {
        this.uncoveredCells.push({ x: x, y: y });
    }

    generateBoard(x, y, minePos) {

        let grid = new Array(x);
        for (let i = 0; i < x; i++) {
            grid[i] = new Array(y); //creates 2-dimensional array
        }

        minePos.forEach(function (item) {
            grid[item.x][item.y] = "X"
        })
        return grid;
    }

    getGridValue(x, y) {
        return this.grid[x][y];
    }

    containsMine(x, y) {
        if (this.grid[x][y] == "X") {
            return true;
        }
        return false;
    }

    checkNeighbours(cellX, cellY, callback) {

        for (let k = Math.max(0, cellX - 1); k < Math.min(this.size.x, cellX + 2); k++) {
            for (let l = Math.max(0, cellY - 1); l < Math.min(this.size.y, cellY + 2); l++) {
                //loops through all neighbours of the cell
                /*min/max statements ensure if checking at border,
                no cell out of range is checked */
                callback(this.grid[k][l], k, l);
            }
        }
    }

    iterateBoard(callback) {
        for (let i = 0; i < this.size.x; i++) {
            for (let j = 0; j < this.size.y; j++) {
                callback(this.grid[i][j], i, j);
            }
        }
    }

    countMines(x, y) {
        let mineCount = 0;
        this.checkNeighbours(x, y, function (val) {
            if (val == "X")
                mineCount++;
        })
        return mineCount
    }

    fillBoard() {

        let self = this;
        this.iterateBoard(function (val, x, y) {
            if (val != "X") {
                let mineCount = 0;
                self.checkNeighbours(x, y, function (nVal) {
                    if (nVal == "X") {
                        mineCount++;
                    }
                })
                self.grid[x][y] = mineCount;
            }
        })
    }

    checkCellsToUncover(cellPos) {
        let allDisplayed = false;

        let emptyCells = [cellPos];
        let checkedCells = [];
        let valueCells = [];

        let self = this;
        while (!allDisplayed) {

            let currentPos = emptyCells.shift();

            this.checkNeighbours(currentPos.x, currentPos.y, function (val, i, j) {

                let currentNeighbour = { x: i, y: j, value: val };

                if (val == "0") {
                    if (!emptyCells.some((n) => n.x === i && n.y === j) &&
                        !checkedCells.some((o) => o.x === i && o.y === j)) {
                        emptyCells.push(currentNeighbour);

                        console.log(emptyCells);
                    }
                }
                else if (val != "X" &&
                    !checkedCells.some(n => n.x == i && n.y == j)) {
                    checkedCells.push(currentNeighbour);
                }
            })

            if (emptyCells.length == 0) {
                allDisplayed = true;
            }
            checkedCells.push({ x: currentPos.x, y: currentPos.y, value: this.grid[currentPos.x][currentPos.y] });
        }
        this.uncoveredCells = this.uncoveredCells.concat(checkedCells);
        return checkedCells;
    }

    addFlag(x, y) {
        this.grid[x][y] += "F";
    }

    removeFlag(x, y) {
        this.grid[x][y] = this.grid[x][y][0];
    }

    isFlagged(x, y) {
        if (this.grid[x][y][1] == "F") {
            return true;
        }
        return false;
    }
}