
class RunningData {
    constructor(size) {
        this.n = size;
        this.data = new Array(this.n);
    }

    newDataPoint(val) {
        this.data.push(val);
        if (this.data.length > this.n) {
            this.data.shift(); // ignore this point
        }
    }

    getSample(length) {
        if (length > this.data.length) {
            return this.data;
        } else {
            let end = this.data.length;
            let start = end - length;
            return this.data.slice(start, end);
        }
    }

}

module.exports = {
    RunningData
};
