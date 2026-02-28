export interface EnergyPrice {
    timestamp: Date;
    price: number;
}

const API_KEY = '709036a4-0733-4934-8903-b80bba4b636b';

// Helper to format Date to YYYYMMDDHH00
const formatEntsoeDate = (date: Date): string => {
    const yyyy = date.getUTCFullYear();
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(date.getUTCDate()).padStart(2, '0');
    const hh = String(date.getUTCHours()).padStart(2, '0');
    return `${yyyy}${mm}${dd}${hh}00`;
};

export const fetchDayAheadPrices = async (targetDate: Date): Promise<EnergyPrice[]> => {
    // Get start of the target day
    const periodStartDate = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate(), 0, 0, 0));

    // Get end of the target day (start of next day)
    const periodEndDate = new Date(periodStartDate);
    periodEndDate.setUTCDate(periodEndDate.getUTCDate() + 1);

    const periodStart = formatEntsoeDate(periodStartDate);
    const periodEnd = formatEntsoeDate(periodEndDate);

    // Germany (BZN DE-LU) Domain
    const domain = '10Y1001A1001A82H';

    const targetUrl = `https://web-api.tp.entsoe.eu/api?securityToken=${API_KEY}&documentType=A44&in_Domain=${domain}&out_Domain=${domain}&periodStart=${periodStart}&periodEnd=${periodEnd}`;

    // Use Vite proxy in local dev, and public CORS proxy in production (since GitHub Pages is static)
    const url = import.meta.env.PROD
        ? `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`
        : `/api/entsoe?securityToken=${API_KEY}&documentType=A44&in_Domain=${domain}&out_Domain=${domain}&periodStart=${periodStart}&periodEnd=${periodEnd}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            console.error("ENTSO-E API Error Response:", errorText);
            throw new Error(`HTTP error! status: ${response.status} - ENTSO-E might not have data for this date yet.`);
        }

        const textData = await response.text();
        return parseEntsoeXml(textData);
    } catch (error) {
        console.error("Error fetching ENTSO-E data:", error);
        throw error;
    }
};

const parseEntsoeXml = (xmlStr: string): EnergyPrice[] => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlStr, "text/xml");

    const prices: EnergyPrice[] = [];

    // Find all TimeSeries elements
    const timeSeriesList = xmlDoc.getElementsByTagName("TimeSeries");

    for (let i = 0; i < timeSeriesList.length; i++) {
        const timeSeries = timeSeriesList[i];

        const period = timeSeries.getElementsByTagName("Period")[0];
        if (!period) continue;

        const timeInterval = period.getElementsByTagName("timeInterval")[0];
        const resolution = period.getElementsByTagName("resolution")[0]?.textContent; // e.g., PT60M, PT15M

        if (!timeInterval || !resolution) continue;

        const startStr = timeInterval.getElementsByTagName("start")[0]?.textContent;
        if (!startStr) continue;

        // Base start time
        const periodStart = new Date(startStr);

        // Calculate millisecond increment based on resolution
        let incrementMs = 60 * 60 * 1000; // default PT60M (1 hour)
        if (resolution === 'PT15M') incrementMs = 15 * 60 * 1000;
        if (resolution === 'PT30M') incrementMs = 30 * 60 * 1000;

        const points = period.getElementsByTagName("Point");
        for (let j = 0; j < points.length; j++) {
            const point = points[j];
            const positionNode = point.getElementsByTagName("position")[0];
            const priceNode = point.getElementsByTagName("price.amount")[0];

            if (positionNode && priceNode) {
                const position = parseInt(positionNode.textContent || "1", 10);
                const price = parseFloat(priceNode.textContent || "0");

                // Position is 1-indexed for the period
                const pointTime = new Date(periodStart.getTime() + (position - 1) * incrementMs);

                prices.push({
                    timestamp: pointTime,
                    price: price
                });
            }
        }
    }

    // Sort chronically just in case
    prices.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return prices;
};
