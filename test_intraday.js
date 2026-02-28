const https = require('https');

const API_KEY = '709036a4-0733-4934-8903-b80bba4b636b';
const domain = '10Y1001A1001A82H';
const periodStart = '202602280000';
const periodEnd = '202603010000';

const url = `https://web-api.tp.entsoe.eu/api?securityToken=${API_KEY}&documentType=A44&contract_MarketAgreement.Type=A07&in_Domain=${domain}&out_Domain=${domain}&periodStart=${periodStart}&periodEnd=${periodEnd}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log("Status Code:", res.statusCode);
        console.log(data.substring(0, 500));
    });
}).on('error', err => console.error(err));
