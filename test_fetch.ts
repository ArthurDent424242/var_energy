import { fetchDayAheadPrices } from './src/services/entsoe.js';
import { fetchOctopusPrices } from './src/services/octopus.js';

async function test() {
    const targetDate = new Date('2026-02-28T12:00:00Z');
    console.log("Testing data for:", targetDate);

    try {
        const entsoeData = await fetchDayAheadPrices(targetDate);
        console.log("ENTSO-E Data Points:", entsoeData.length);
        if (entsoeData.length > 0) {
            console.log("ENTSO-E First:", entsoeData[0].timestamp.toISOString(), entsoeData[0].timestamp.getHours());
        }

        const octopusData = await fetchOctopusPrices(targetDate);
        console.log("Octopus Data Points:", octopusData.length);
        if (octopusData.length > 0) {
            console.log("Octopus First:", octopusData[0].timestamp.toISOString(), octopusData[0].timestamp.getHours());
        }

        // Test difference mapping manually
        if (entsoeData.length > 0 && octopusData.length > 0) {
            let matchCount = 0;
            octopusData.forEach(octoPoint => {
                const currentHour = octoPoint.timestamp.getHours();
                const entsoePoint = entsoeData.find(d => d.timestamp.getHours() === currentHour);
                if (entsoePoint) matchCount++;
            });
            console.log(`Matched ${matchCount} out of ${octopusData.length} Octopus points to ENTSO-E data.`);
        }

    } catch (err) {
        console.error(err);
    }
}

test();
