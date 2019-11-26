const {Packet} = require("./Packet");

// Custom wrapper class on the packet to remove any
// non-essential data (speed-up processing)
class PacketFactory {
    constructor() {
        this._channelData = [];
        this._sampleNumber = 0;
        this._valid = false;
        this._timestamp = 0;
    }
    static fromSample(sample) {
        let p = new PacketFactory();
        p.setChannelData([...sample.channelData]);
        p.setSampleNumber(sample.sampleNumber);
        p.setTimestamp(sample.timestamp);
        p.setValid(sample.valid);
        return new Packet(p);
    }

    setChannelData(channelData) {
        this._channelData = channelData;
    }

    getChannelData() {
        return this._channelData;
    }

    setSampleNumber(sampleNumber) {
        this._sampleNumber = sampleNumber;
    }

    getSampleNumber() {
        return this._sampleNumber;
    }

    setValid(valid) {
        this._valid = valid;
    }

    getValid() {
        return this._valid;
    }

    setTimestamp(timestamp) {
        this._timestamp = timestamp;
    }

    getTimestamp() {
        return this._timestamp;
    }
}

module.exports = {
    PacketFactory
};
