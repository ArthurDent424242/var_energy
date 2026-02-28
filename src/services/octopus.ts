import { format, addDays } from 'date-fns';

export interface OctopusDataPoint {
    timestamp: Date;
    valueInCents: number; // Cent/kWh
}

/**
 * Fetches dynamic prices from the public Octopus Energy DE API.
 * The API returns gross prices in cent/kWh directly.
 */
export async function fetchOctopusPrices(targetDate: Date): Promise<OctopusDataPoint[]> {
    // We fetch a 48h window to ensure we cover the entire requested day in local time
    const periodStart = format(targetDate, "yyyy-MM-dd'T'00:00:00.000'Z'");
    const nextDay = addDays(targetDate, 2);
    const periodEnd = format(nextDay, "yyyy-MM-dd'T'00:00:00.000'Z'");

    const url = `https://api.octopus.energy/v1/products/AGILE-FLEX-23-11-20/electricity-tariffs/E-1R-AGILE-FLEX-23-11-20-C/standard-unit-rates/?period_from=${periodStart}&period_to=${periodEnd}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Octopus API Error: ${response.status}`);
        }

        const data = await response.json();
        const results = data.results || [];

        // Parse and sort the results chronologically
        const parsedData: OctopusDataPoint[] = results.map((item: { valid_from: string, value_inc_vat: number }) => ({
            timestamp: new Date(item.valid_from),
            valueInCents: item.value_inc_vat // Use the gross value (includes taxes/fees)
        })).sort((a: OctopusDataPoint, b: OctopusDataPoint) => a.timestamp.getTime() - b.timestamp.getTime());

        // Filter out only the data points that belong specifically to the targetDate
        const targetDateString = format(targetDate, 'yyyy-MM-dd');
        const filteredData = parsedData.filter(d => format(d.timestamp, 'yyyy-MM-dd') === targetDateString);

        return filteredData;

    } catch (error) {
        console.error("Error fetching Octopus prices:", error);
        throw error;
    }
}
