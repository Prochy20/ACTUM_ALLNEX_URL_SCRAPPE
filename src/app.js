const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const chalk = require('chalk');

const delimiter = ';';
const rawData = fs
    .readFileSync(path.join(__dirname, './data/url_all_uat.csv'))
    .toString();

const uatBaseURL = 'https://allnex-web-uat.azurewebsites.net/';
const stageBaseURL = 'https://allnex-web-stage.azurewebsites.net/';

const data = {
    uat: [],
    stage: [],
};

rawData
    .split('\n')
    .forEach((row, index) => {
        if(index === 0) return;
        const [uat, stage] = row.split(delimiter);
        if (uat.length > 0) {
            data.uat.push(uat.replace('\r', '').replace('\n', '').trim());
        }

        if (stage.length > 0) {
            data.stage.push(stage.replace('\r', '').replace('\n', '').trim());
        }

    });

console.log('------------------------------------------------------------------');
console.log(chalk.green.bold('STAGE RECORDS:'), data.stage.length)
console.log(chalk.green.bold('UAT RECORDS:'), data.uat.length)
console.log('------------------------------------------------------------------');

const UATFiltered = data.uat.filter((item) => !data.stage.includes(item)); // URLS which are not on stage but are in UAT
const stageFiltered = data.stage.filter((item) => !data.uat.includes(item)); // URLS which are not in UAT but are in stage

console.log(chalk.green.bold('Missing in STAGE:'), UATFiltered.length)
console.log(chalk.green.bold('Missing in UAT:'), stageFiltered.length)

console.log('------------------------------------------------------------------');
console.log(chalk.redBright.bold('TESTING URLS MISSING IN stage', '\n\n\n'));

const sleep = (ms) => new Promise( res => setTimeout(res, ms));

(async () => {
    let i = 1;
    for (const link of UATFiltered) {
        const url = new URL(link, stageBaseURL);
        const req = await fetch(url.toString());
        if (req.status === 200) {
            console.log(chalk.magentaBright(`${i}/${UATFiltered.length} `), chalk.bgGreen.bold(req.statusText), ' --> ', url.toString());
        } else {
            console.log(chalk.magentaBright(`${i}/${UATFiltered.length} `), chalk.bgRed.bold(req.statusText), ' --> ', url.toString());
        }

        i += 1;
        await sleep(200);
    }

    console.log('------------------------------------------------------------------');
    console.log(chalk.redBright.bold('TESTING URLS MISSING IN UAT', '\n\n\n'));

    i = 1;
    for (const link of stageFiltered) {
        const url = new URL(link, uatBaseURL);
        const req = await fetch(url.toString());
        if (req.status === 200) {
            console.log(chalk.magentaBright(`${i}/${stageFiltered.length} `), chalk.bgGreen.bold(req.statusText), ' --> ', url.toString());
        } else {
            console.log(chalk.magentaBright(`${i}/${stageFiltered.length} `), chalk.bgRed.bold(req.statusText), ' --> ', url.toString());
        }

        i += 1;
        await sleep(200);
    }
})();



