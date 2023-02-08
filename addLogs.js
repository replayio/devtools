const fs = require('fs');

fs.readFile('./node_modules/@replayio/replay/src/main.js', 'utf-8', (err, data) => {
    if (err) throw err;

    let newData = data.split('\n');
    let lineIndex = 238;
    let linesToAdd = [
        `    console.log("dir in listAllRecordings", dir);`,
        `    console.log("recordings in listAllRecordings", recordings);`
    ];

    newData.splice(lineIndex + 1, 0, ...linesToAdd);
    newData.splice(1, 0, `console.log("main.js is running");`);

    fs.writeFile('main.js', newData.join('\n'), (err) => {
        if (err) throw err;
        console.log('Log statements added to main.js file.');
    });
});
