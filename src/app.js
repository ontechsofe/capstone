const io = require('socket.io');
const {RunningData} = require("./RunningData");
const {voltsToMicrovolts, normalize, toHex} = require("./DataProcessing");
const {CytonBoard} = require("./CytonBoard");
let cytonBoard = new CytonBoard();
let data = new RunningData(100);
let r = 0;

let main = io.listen(12345);
main.on('connection', connection);
function connection(socket) {
    console.log('connected:', socket.client.id);
    setInterval(() => {
        socket.emit('sample', data);
    }, 0)
}

cytonBoard.startStream((packet) => {
    voltsToMicrovolts(packet)
        .then(packet => normalize(-200, 200)(packet))
        .then(packet => toHex(packet))
        .then(packet => {
            if (r === 5) {
                data.newDataPoint(packet);
                r = 0;
            } else {
                r++;
            }
        })
});

process.on("SIGINT", () => {
    cytonBoard.stopStream(() => {
        process.exit(0);
    });
});
