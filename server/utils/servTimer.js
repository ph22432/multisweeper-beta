var startTime;
var currentTime;
var endTime;

function startTimer() {
    startTime = Date.now();
}

function onTick() {
    currentTime = Math.floor((Date.now() - this.startTime) / 1000);
}
function timeToDisplay(timed) {

    if (timed) {
        if (((Date.now() - startTime) / 1000) > 10);
        return ("00" + currentTime).slice(-3);
    }
    return currentTime;

}

function stopTimer() {
    endTime = Date.now()
}

module.exports = { startTimer, onTick, timeToDisplay, stopTimer, startTime, endTime };