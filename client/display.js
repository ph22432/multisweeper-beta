class Scoreboard {

    constructor(padding, timed, mineCount) {

        this.padding = padding;
        this.mineCount = mineCount;
        this.flagCount = 0;
        this.timed = timed;
        this.drawScoreboard();
        this.drawScore(0);
        this.drawMineCount();
    }

    drawScoreboard() {
        ctx.font = "bold 16px arial"
        ctx.fillStyle = "white"
        if (this.timed) {
            ctx.fillText("Score:", this.padding.x, this.padding.y - 12);
            ctx.fillText("Mines:", this.padding.x + 200, this.padding.y - 12);
        }
        else {
            ctx.fillText("Score:", this.padding.x - 150, this.padding.y + 90);
            ctx.fillText("Mines:", this.padding.x - 150, this.padding.y + 120);
        }
    }

    drawScore(score) {
        console.log("score drawn")
        ctx.font = "bold 16px arial"
        ctx.fillStyle = "red";
        if (this.timed) {
            ctx.clearRect(this.padding.x + 55, this.padding.y - 30, 100, 20);
            ctx.fillText(score, this.padding.x + 55, this.padding.y - 12);
        }
        else {
            ctx.clearRect(this.padding.x - 95, this.padding.y + 72, 80, 20);
            ctx.fillText(score, this.padding.x - 95, this.padding.y + 90);
        }
    }

    changeMineCount(increase) {
        if (increase) {
            this.mineCount += 1;
        }
        else {
            this.mineCount -= 1;
        }
        this.drawMineCount();
    }

    changeFlagCount() {
        this.flagCount += 1;
        this.drawMineCount();
    }



    drawMineCount() {
        ctx.font = "bold 16px arial"
        ctx.fillStyle = "red";
        if (this.timed) {
            ctx.clearRect(this.padding.x + 255, this.padding.y - 30, 100, 20);
            ctx.fillText(this.mineCount, this.padding.x + 255, this.padding.y - 12);
        }
        else {
            ctx.clearRect(this.padding.x - 95, this.padding.y + 102, 80, 20)
            ctx.fillText(this.flagCount, this.padding.x - 95, this.padding.y + 120);
        }

    }


}

class Display {
    constructor(canvSize, gridSize, padding) {
        this.dimensions = { w: canvSize.x, h: canvSize.y }
        this.gridSize = { x: gridSize.x, y: gridSize.y }
        this.cellSize = this.calculateCellSize(canvSize.y, gridSize)
        this.displayGrid = [];
        this.padding = { x: padding.x, y: padding.y };
        this.uncoveredCells = [];

        this.drawGrid(this.gridSize);
    }

    calculateCellSize(h, gridSize) {
        console.log(this.gridSize)
        console.log("h = " + h);
        let c = (h - 80) / gridSize.y;
        console.log("cellsize = " + c);
        return (h - 80) / gridSize.y;

    }
    //calculatePadding(w, gridSize.y twoBoards){

    drawGrid(gridSize) {
        //ctx.clearRect(0, 0, canvas.width, canvas.height,);

        for (let i = 0; i < gridSize.x; i++) {

            let cellColumn = [];

            for (let j = 0; j < gridSize.y; j++) {

                let cell = new Path2D();
                let xPos = (this.padding.x + i * (this.cellSize + 3));
                let yPos = (this.padding.y + j * (this.cellSize + 3));

                cell.rect(xPos, yPos, this.cellSize, this.cellSize);
                cellColumn.push(cell);
                if ((i == Math.floor((gridSize.x - 1) / 2)) && (j == Math.floor((gridSize.y - 1) / 2))) {
                    ctx.fillStyle = "black";
                }
                else {
                    ctx.fillStyle = "grey";
                }
                ctx.fill(cell);
            }

            this.displayGrid.push(cellColumn);


        }
    }

    isPointInCell(pointerX, pointerY) {
        for (const item of this.displayGrid) {
            for (const button of item) {
                try {
                    if (ctx.isPointInPath(button, pointerX, pointerY)) {
                        let cellX = this.displayGrid.indexOf(item);
                        let cellY = item.indexOf(button);
                        return { x: cellX, y: cellY };
                    }
                }
                catch (error) { console.log("null value searched"); }
            }
        }
        return null;
    }

    uncoverCell(value, cellX, cellY) {
        if (!this.uncoveredCells.some(c => c.x == cellX && c.y == cellY)) {
            //draw cell background
            this.drawCell(value, cellX, cellY);
            this.uncoveredCells.push({ x: cellX, y: cellY });
        }
    }

    drawCell(value, cellX, cellY) {
        //fill colour
        switch (value) {
            case "X":
                ctx.fillStyle = "red";
                break;
            case "F0":
                ctx.fillStyle = "pink";
                value = "\u2691";
                break;
            case "P1F1":
                ctx.fillStyle = "fuchsia";
                value = "\u2691";
                break;
            case "P1F2":
                ctx.fillStyle = "hotpink";
                value = "🞮";
                break;
            case "P2F1":
                ctx.fillStyle = "blue"
                value = "\u2691";
                break;
            case "P2F2":
                ctx.fillStyle = "cornflowerblue"
                value = "🞮";
                break;
            case "":
                ctx.fillStyle = "grey";
                break;
            default:
                ctx.fillStyle = "white";
        }

        ctx.fill(this.displayGrid[cellX][cellY]);
        ///////////////////////////
        //draw cell text
        this.drawTextOnCell(value, cellX, cellY);
    }

    drawTextOnCell(value, cellX, cellY) {
        //text colour
        let xOffset = this.cellSize * 0.4
        let yOffset = this.cellSize * 0.65
        switch (value.toString()) {
            case "0":
                ctx.fillStyle = "white";
                break;
            case '1':
                ctx.fillStyle = "#0000FF";
                break;
            case '2':
                ctx.fillStyle = "#007B00";
                break;
            case '3':
                ctx.fillStyle = "#FF0000";
                break;
            case '4':
                ctx.fillStyle = "#00007B";
                break;
            case '5':
                ctx.fillStyle = "#7B0000";
                break;
            case '6':
                ctx.fillStyle = "#007B7B";
                break;
            case '7':
                ctx.fillStyle = "#7B7B00";
                break;
            case '8':
                ctx.fillStyle = "#7B7B7B";
                break;
            case "X":
                ctx.fillStyle = "black"
                value = "\u2388";
                xOffset = this.cellSize * 0.28
                yOffset = this.cellSize * 0.68
                break;
            case "🞮":
                ctx.fillStle = "black"
                xOffset = this.cellSize * 0.25
                yOffset = this.cellSize * 0.68
            default:
                ctx.fillStyle = "black";
        }


        ctx.font = "12px helvetica";
        ///!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        let xPos = this.cellToPosition(cellX, "x") + xOffset;
        let yPos = this.cellToPosition(cellY, "y") + yOffset;
        ctx.fillText(value, xPos, yPos);
    }

    cellToPosition(posValue, isX) {
        return this.padding[isX] + posValue * (this.cellSize + 3);
    }
}
