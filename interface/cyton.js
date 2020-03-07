const Cyton = require("@openbci/cyton");
const ourBoard = new Cyton({
    verbose: true
});

let incomingData = [];
let packetCount = 0;

const io = require('socket.io');

let main = io.listen(12345);
main.on('connection', connection);

function connection(socket) {
    console.log('connected:', socket.client.id);
    setInterval(() => {
        if (incomingData.length > 0) {
            socket.emit('sample', incomingData.shift());
        }
    }, 0)
}

const p = io.listen(5555);
p.on('connection', processingConnection);

function processingConnection(socket) {
    console.log('PROCESSING CONNECTED:', socket.client.id);
    setInterval(() => {
        socket.emit('fuck-off', "iVBORw0KGgoAAAANSUhEUgAAAGQAAAAICAYAAAAP1Fp1AAAE/klEQVRISzWWeVDUZRjHfz/YhcVdjl1uEEI5KiqQMQwtTWUqO6CcabqmDGs6ZqqpqcaaajS7pmxMc2rKzlGnC9Rpsmwi6I7wKKwwRUQQjGu5d1n3YJcmvh/2n8887/vu+3vf5/g+r2ls3DZt/P+r2zUDw54pdj4mrm4U6+eLUX4xdbEY+kL0JYuJzcyzT6hXdteN4rJ+0TouNs0Vc1eK4YdFm1NMuFs0v2Hf0+Jkvth9oZj9oTh0uZhzUmz/W0y3if3ZopPzp3bIXvCn2LhEfPIucRP3d7lle7eKcQ+JbSNiwRD7n4s9LH4bEm18txQ/Tnyl8cF/xbQNMzCN1vUKyGilJsKt4qsviM7V4rpcMXJCDH0uRt8vmuvEMx+IR3HAvDTZLW+IvTjY0sd+p8QlOMhHQA/qWMZ0iehK4js4zPxddgyBmE2kcBHj74hd2FNXsN8R0XGVOML3Cr+T7c8TT18v9iwXk3aK+QQ6Eb90ErDeTs171otrJ8Va7m89KLsMvxT+LLv7a9F99QxMY3Ozbt5yRhMXcNFsbO+oxg/ZxeEKscAqxo4xHi3mJYgpGeKJoJhORkwUyx4gwwd3yC65RXS/LPb+IC59nf2rxM4nROs5oh3HTBLYcb5b3K75YyRO5R7ZQ4Oi5SWxhwpNLpCdtkBse08MXiNWDIjLc8R9BHaU/zuOabzYIu5HCewEdA2JsYPzVOGvGhLsJsfM30zj9u0KSDMZGAlrw/CP4uQcsSxdPPCLWH6eWMoFd5fLnmPy//PFki7x+83ME7DAs7LNd8W0i0Qb+1uRUFubxjORxiM97E+mJXwqewIH20kgO9JqXqn5HAIUQHLcd2rcj9QUIUmOpzTe8qu4LCAu3M/57xHLPhPv5R4rn2Y9Ell/n+xqEralVHb/QnFxrbiFRIiNnzFNY8NxBaSKkvO/r4U7iWjNx7L3bBJLKWkfB+/j4qNk1uDzWlf1nLiXTFn1gOyGFDGNHtVF4LKnNJ7FgU/SG6o/0vh2ekM1gXqb/+WjyWGkq2OF1mdQKYWcrwepHVql+SmkwjFPdpiKnUsvcbPP2qOar6XHeZHyx3G8/RnN//SmWESlvNYge9EB8Qbus2u37BQSPylG9jZVuGl03KaAjKGxafSQNjKqzaU/5BaKoVtFJ5qbsFT2mJqSkUflTFws+zABiaqXPUVzC+KwyG8atyBB/Z+w/1uiD832vYh9rThND0j8S7YbCbHSO8b+0fgEzTWei7sv03iQivXw/WkSpv86zcfRM+xItXGJxvuopMFHZFfS3OPZJ4qAtOCXCiQ6OU7rO1kXppJpLYZL/jCNrXUKSAavgx5eRyU0p8ZZTWZ+nMhakBAHperitdHI66h8iw5w6aPiITTZT2/oofSDSFwZGdX+oNaXEcDAItn+w2ID0rpir2xDpW7YveIpek7eRtlDJNQImT8faTs+q/F/aF0fvTELbbdR4R7G6dHGyBqtH8MPcVSaC0WJIKG9WezLeTMjsgcIYMw+2ZlIftOXM6ZpDNyhgMRSUiEC4uEiEV4JXhwZz3PQw+vHwzPVJDPOpupDsRw4iMO6kaK4WUc2cbEaMcwFLJR0dJnGfTjyLInhpCf0vaJ5F6+zYbQ4SEb76jQfwCFTvBIN7jNAhjrJeCeBaEWKrGh+ECm3oAB+7mlSkRHuY6HyPSiDj0SLohcHkFzvzTqXjVdmiGd8QOf4D4uLmhsnTMJ1AAAAAElFTkSuQmCC");
        // console.log("SENDING FUCK OFF");
    }, 1000);
    socket.on('fuck-you', (data) => {
        console.log('fuck-you:', data);
    })
}

function boardReady() {
    console.log("Ready!");
    console.log(ourBoard.getInfo());
    ourBoard.streamStart().then(() => {
        console.log("Streaming...");
    }).catch(err => {
        console.log("error starting stream: " + err);
    });
}

function processSample(sample) {
    if (packetCount === 5) {
        incomingData.push(sample);
        packetCount = 0;
    } else {
        packetCount++;
    }
    if (incomingData.length > 100) {
        incomingData.shift();
    }
}

function gotImpedanceArray(impedenceArray) {
    console.log(impedenceArray);
}

function stopStream() {
    console.log('\nClosing Stream...');
    ourBoard.streamStop().then(() => {
        ourBoard.disconnect();
        process.exit(0);
    }).catch(err => {
        console.log("Error closing stream: " + err);
        process.exit(1);
    });
}

ourBoard.on("ready", boardReady);
ourBoard.on("sample", processSample);
ourBoard.on('impedanceArray', gotImpedanceArray);
process.on('SIGINT', stopStream);

ourBoard
    .listPorts()
    .then(ports => {
        ourBoard
            .connect(ports[0].comName)
            .catch((err) => {
                console.log('ERROR');
                console.log(err);
            });
    });
