// File full of promise chain processing of a packet

/**
 * TODO: USE THIS REPO TO MODEL SOME OF THE PROCESSING
 * https://github.com/neurosity/eeg-pipes/blob/master/src/pipes/filtering/bandpassFilter.js
 *
 */

// start the processing

const voltsToMicrovolts = (packet) => new Promise(((resolve, reject) => {
    packet.channelData = packet.channelData.map(volt => Math.pow(10, 6) * volt);
    resolve(packet);
}));

const normalize = (min, max) => (packet) => new Promise(((resolve, reject) => {
    packet.channelData = packet.channelData.map(uV => (uV - min) / (max - min));
    resolve(packet);
}));

const padHex = (hexString) => `${"0".repeat(6 - hexString.length)}${hexString}`;
const toHex = (packet) => new Promise(((resolve, reject) => {
    packet.channelData = packet.channelData.map(normalized => {
        let pre_hex = Math.floor(Math.pow(256, 3) * normalized);
        let hexString = pre_hex.toString(16);
        return padHex(hexString);
    });
    resolve(packet);
}));

module.exports = {
    voltsToMicrovolts,
    normalize,
    toHex
};
