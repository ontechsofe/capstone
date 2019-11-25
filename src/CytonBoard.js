const {PacketFactory} = require("./PacketFactory");
const Cyton = require("@openbci/cyton");

const cytonBoardOptions = {
    verbose: true,
    debug: false,
    simulate: true
};
const theBoard = new Cyton(cytonBoardOptions);

class CytonBoard {

    constructor() {
        this.fsHzSerialCyton = 250;
        this.ADS1299_Vref = 4.5;
        this.ADS1299_gain = 24.0;
        this.openBCI_series_resistor_ohms = 2200;
        this.scale_fac_uVolts_per_count = this.ADS1299_Vref / ((Math.pow(2, 23) - 1)) / this.ADS1299_gain * 1000000;
        this.leadOffDrive_amps = 6.0e-9;
    }

    getSampleRate() {
        return this.fsHzSerialCyton;
    }

    get_series_resistor() {
        return this.openBCI_series_resistor_ohms;
    }

    get_scale_fac_uVolts_per_count() {
        return this.scale_fac_uVolts_per_count;
    }

    get_leadOffDrive_amps() {
        return this.leadOffDrive_amps;
    }

    startStream(callback) {
        theBoard.on("ready", this.boardReady);
        theBoard.on("sample", (sample) => {
            callback(PacketFactory.fromSample(sample));
        });
        theBoard
            .listPorts()
            .then(ports => {
                theBoard.connect(ports[0].comName).catch((err) => {
                    console.log('ERROR');
                    console.log(err);
                });
            });
    }

    stopStream(callback) {
        console.log('\nClosing Stream...');
        theBoard.streamStop().then(() => {
            theBoard.disconnect().then(callback);
        }).catch(err => {
            console.log("Error closing stream: " + err);
        });
    }

    boardReady() {
        console.log("Ready!");
        console.log(theBoard);
        theBoard.streamStart().then(() => {
            console.log("Streaming...");
        }).catch(err => {
            console.log("error starting stream: " + err);
        });
    }
}

module.exports = {CytonBoard};
