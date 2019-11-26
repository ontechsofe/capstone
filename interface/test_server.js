const io = require('socket.io');



process.on('SIGINT', () => {
    console.log("\nEXITING...");
    process.exit(0);
});

console.log("LISTENING...");
