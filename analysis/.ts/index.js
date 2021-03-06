"use strict";
const yargs = require('yargs');
const fs = require('fs');
const path = require('path');
const os = require('os');
const argv = yargs.options({
    workdir: {
        alias: 'd',
        string: true,
        demandOption: true,
    },
    outfile: {
        alias: 'o',
        string: true,
        demandOption: true,
    }
}).argv;
function scandir(directory) {
    return fs
        .readdirSync(directory)
        .map((node) => path.join(directory, node));
}
const runRegex = /^run-(\d+)\.dat$/;
const percentileRegex = /^\s*(\d+\.\d+)\%\s*of requests handled in (\d+\.\d+)ms\.\s*$/;
function getRunResultFiles(nodes) {
    return nodes.filter(node => {
        const base = path.basename(node);
        if (runRegex.exec(base) == null) {
            return false;
        }
        const stat = fs.lstatSync(node);
        return stat.isFile();
    });
}
function parseFile(location) {
    const run = runRegex.exec(path.basename(location))[1];
    const contents = fs.readFileSync(location).toString('utf-8');
    const lines = contents.split(os.EOL);
    const percentiles = [];
    lines.forEach(line => {
        const match = percentileRegex.exec(line);
        if (match != null) {
            const percentile = match[1];
            const delay = match[2];
            percentiles.push({
                nodes: parseInt(run),
                percentile: parseFloat(percentile),
                delay: parseFloat(delay),
            });
        }
    });
    return percentiles;
}
function parseFiles(locations) {
    const percentileData = [];
    locations.forEach(location => percentileData.push(...parseFile(location)));
    return percentileData;
}
function toCSV(data) {
    return `${['nodes', 'percentile', 'delay'].join(',')}\n${data.map(data => Object.keys(data).map(key => data[key]).join(',')).join('\n')}`;
}
function writeCSV(data, outfile) {
    fs.writeFileSync(outfile, toCSV(data));
}
const workdir = argv.workdir;
const outfile = argv.outfile;
const allFiles = scandir(workdir);
const files = getRunResultFiles(allFiles);
console.log(`reading files:${os.EOL}${files.join(os.EOL)}`);
const percentiles = parseFiles(files);
writeCSV(percentiles, outfile);
//# sourceMappingURL=index.js.map