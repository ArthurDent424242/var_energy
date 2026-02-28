const API_KEY = '709036a4-0733-4934-8903-b80bba4b636b';
const domain = '10Y1001A1001A82H';
const periodStart = '202602280000';
const periodEnd = '202603010000';

const urls = [
    // A86 Imbalance prices
    `https://web-api.tp.entsoe.eu/api?securityToken=${API_KEY}&documentType=A86&in_Domain=${domain}&out_Domain=${domain}&periodStart=${periodStart}&periodEnd=${periodEnd}`,
    // A11 Aggregated Energy Data
    `https://web-api.tp.entsoe.eu/api?securityToken=${API_KEY}&documentType=A11&in_Domain=${domain}&out_Domain=${domain}&periodStart=${periodStart}&periodEnd=${periodEnd}`
];

async function test() {
    for (const url of urls) {
        console.log("Fetching:", url.split('&documentType=')[1].split('&')[0]);
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
