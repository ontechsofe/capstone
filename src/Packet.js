class Packet {
    constructor(packetFactory) {
        this._channelData = packetFactory.getChannelData();
        this._nChannels = this._channelData.length;
        this._valid = packetFactory.getValid();
        this._sampleNumber = packetFactory.getSampleNumber();
        this._timestamp = packetFactory.getTimestamp();
    }

    getDataFromChannel(channel) {
        return channel >= 0 && channel < this._nChannels ? this._channelData[channel] : null;
    }

    get channelData() {
        return this._channelData;
    }

    set channelData(value) {
        this._channelData = value;
    }

    get nChannels() {
        return this._nChannels;
    }

    set nChannels(value) {
        this._nChannels = value;
    }

    get valid() {
        return this._valid;
    }

    set valid(value) {
        this._valid = value;
    }

    get sampleNumber() {
        return this._sampleNumber;
    }

    set sampleNumber(value) {
        this._sampleNumber = value;
    }

    get timestamp() {
        return this._timestamp;
    }

    set timestamp(value) {
        this._timestamp = value;
    }
}

module.exports = {
    Packet
};
