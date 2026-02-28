const API_KEY = '709036a4-0733-4934-8903-b80bba4b636b';
const domain = '10Y1001A1001A82H';
const periodStart = '202602270000'; // Yesterday
const periodEnd = '202602280000'; // Today

const urls = [
    // A07 Intraday contract
    `https://web-api.tp.entsoe.eu/api?securityToken=${API_KEY}&documentType=A44&contract_MarketAgreement.Type=A07&in_Domain=${domain}&out_Domain=${domain}&periodStart=${periodStart}&periodEnd=${periodEnd}`,
    // A74 Standard Market Time Unit
    `https://web-api.tp.entsoe.eu/api?securityToken=${API_KEY}&documentType=A74&in_Domain=${domain}&out_Domain=${domain}&periodStart=${periodStart}&periodEnd=${periodEnd}`
];

async function test() {
    for (const url of urls) {
        console.log("Fetching:", url);
        try {
            const res = await fetch(url);
            const text = await res.text();
            console.log("Status Code:", res.status);
            console.log(text.substring(0, 500));
            console.log('-----------------------------');
        } catch (e) { console.error(e) }
    }
}

test();
