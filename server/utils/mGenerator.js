
function generateMines(x, y, mines) {
    let minePositions = [];

    for (let i = 0; i < mines; i++) {
        let xPos = Math.floor(Math.random() * x);
        let yPos = Math.floor(Math.random() * y);
        let found = minePositions.some(position => (position.x == xPos && position.y == yPos));
        /*the above iterates through all positions to check for repeated co-ordinates. Must check
        individual values as co-ordinates are saved as objects (reference types)*/

        let midX = Math.floor((x - 1) / 2)
        let midY = Math.floor((y - 1) / 2)
        if (!found && !((xPos > (midX - 2) && xPos < (midX + 2)) && (yPos > (midY - 2) && yPos < (midY + 2)))) { //ensures generated mine positions are not in the "safe zone" in the center.
            let generatedPos = { x: xPos, y: yPos };
            minePositions.push(generatedPos);
        }
        else {
            i--; //if repeated, another must be generated so loop is decremented
        }
    }

    return minePositions;
}

module.exports = generateMines;