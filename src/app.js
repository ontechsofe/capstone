const io = require('socket.io');
const {applyFilters} = require("./DataProcessing");
const {arrMin, arrMax, normalize, toHex} = require("./Extras");
const {RunningData} = require("./RunningData");
const {CytonBoard} = require("./CytonBoard");
let cytonBoard = new CytonBoard();
const TOTAL_HISTORY = 320;
let data = new RunningData(TOTAL_HISTORY);

let main = io.listen(12345);
main.on('connection', connection);

let THE_DATA = "";
let THE_DATA_FLAG = false;

let THE_SAVE_FLAG = false;
let THE_SAVE_PREDICTION_FLAG = false;
let THE_DISCONNECT_FLAG = false;

let THE_STREAM_FLAG = false;

let THE_PREDICTION_FLAG = false;
let THE_PREDICTION_DATA = null;

function connection(socket) {
    console.log('new_INTERFACE_CONNECTED:', socket.client.id);
    setInterval(() => {
        socket.emit('graph-sample', data.getSample(TOTAL_HISTORY));
    }, 50);
    setInterval(() => {
        if (data.getSample(TOTAL_HISTORY).length >= TOTAL_HISTORY) {
            socket.emit('image-data', turnDataIntoColours());
        }
    }, 50);
    setInterval(() => {
        if (THE_PREDICTION_FLAG) {
            THE_PREDICTION_FLAG = false;
            socket.emit('give prediction', THE_PREDICTION_DATA);
        }
    }, 0);
    socket.on('image', (b64data) => {
        if (b64data.label === "PRE") {
            THE_DATA = b64data;
            THE_STREAM_FLAG = true;
        } else {
            THE_DATA = b64data;
            THE_DATA_FLAG = true;
        }
    });
    socket.on('send-save', () => {
        THE_SAVE_FLAG = true;
    });
    socket.on('send-predict-save', () => {
        THE_SAVE_PREDICTION_FLAG = true;
    });
    socket.on('send-disconnect', () => {
        THE_DISCONNECT_FLAG = true;
    });
    socket.on('disconnect', () => {
        console.log(socket.client.id, 'has committed seppuku :O')
    })
}

let mlio = io.listen(5555);
mlio.on('connection', (socket) => {
    console.log("new_LABELER_CONNECTED:", socket.client.id);
    setInterval(() => {
        if (THE_DATA_FLAG) {
            THE_DATA_FLAG = false;
            socket.emit('label', THE_DATA);
        }
        if (THE_SAVE_FLAG) {
            THE_SAVE_FLAG = false;
            socket.emit('save_data', false);
        }
        if (THE_SAVE_PREDICTION_FLAG) {
            THE_SAVE_PREDICTION_FLAG = false;
            console.log('SAVING PREDICTIONS');
            socket.emit('save_predictions', false);
        }
        if (THE_DISCONNECT_FLAG) {
            THE_DISCONNECT_FLAG = false;
            socket.emit('disc', false);
        }
        if (THE_STREAM_FLAG) {
            THE_STREAM_FLAG = false;
            socket.emit('predict', {
                name: 'MARCUS',
                data: THE_DATA.data
            });
        }
    }, 0);
    socket.on('disconnect', () => {
        console.log(socket.client.id, 'has committed seppuku :O')
    });
    socket.on('send_prediction', (data) => {
        THE_PREDICTION_FLAG = true;
        THE_PREDICTION_DATA = data;
    })
});

function splitDataByChannel(d) {
    let ret = {};
    d.forEach((time, index) =>
        time._channelData.forEach((channel, channelIndex) => {
            if (!Array.isArray(ret[channelIndex])) {
                ret[channelIndex] = [];
            }
            ret[channelIndex].push(channel);
        }));
    return ret;
}

function turnDataIntoColours() {
    // let nData = splitDataByChannel(data.getSample(TOTAL_HISTORY));
    let rData = splitDataByChannel(data.getSample(TOTAL_HISTORY));
    let imageData = new Array(8).fill(new Array(TOTAL_HISTORY));
    for (let i = 0; i < 8; i++) {
        // let wholeArray = nData[i];
        let recentArray = rData[i];
        let nMin = arrMin(recentArray);
        let nMax = arrMax(recentArray);
        let n = normalize(nMin, nMax);
        imageData[i] = recentArray
            .map(n)
            .map(toHex);
    }
    return imageData;
}

cytonBoard.startStream((packet) => {
    applyFilters(packet).then(filtered => data.newDataPoint(filtered))
});

process.on("SIGINT", () => {
    cytonBoard.stopStream(() => {
        process.exit(0);
    });
});
