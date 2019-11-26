const {DataProcessing, padHex} = require("./Extras");

let dataProcessing =  new DataProcessing();

const applyFilters = (packet) => new Promise(((resolve, reject) => {
    packet.channelData = dataProcessing.process(packet.channelData);
    resolve(packet);
}));

const voltsToMicrovolts = (packet) => new Promise(((resolve, reject) => {
    packet.channelData = packet.channelData.map(volt => Math.pow(10, 6) * volt);
    resolve(packet);
}));

const normalize = (min, max) => (packet) => new Promise(((resolve, reject) => {
    packet.channelData = packet.channelData.map(uV => (uV - min) / (max - min));
    resolve(packet);
}));

const toHex = (packet) => new Promise(((resolve, reject) => {
    packet.channelData = packet.channelData.map(normalized => {
        let pre_hex = Math.floor(Math.pow(256, 1) * normalized);
        let hexString = pre_hex.toString(16);
        return padHex(hexString);
    });
    resolve(packet);
}));
module.exports = {
    voltsToMicrovolts,
    normalize,
    toHex,
    applyFilters
};
