
class RunningData {
    constructor(size) {
        this.n = size;
        this.data = new Array(this.n);
    }

    newDataPoint(val) {
        this.data.push(val);
        this.data.shift(); // ignore this point
    }

}

module.exports = {
    RunningData
};
