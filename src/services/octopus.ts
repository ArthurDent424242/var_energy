// Octopus services

export interface OctopusPrice {
    timestamp: Date;
    price_exc_vat: number;
    price_inc_vat: number;
}

// Using a standard UK Agile tariff as a default public endpoint for demonstration
const TARIFF_CODE = 'E-1R-AGILE-FLEX-22-11-25-C';
const PRODUCT_CODE = 'AGILE-FLEX-22-11-25';

export const fetchOctopusPrices = async (targetDate: Date): Promise<OctopusPrice[]> => {
    // Octopus API expects ISO strings
    // Get start of the target day
    const periodStart = new Date(targetDate);
    periodStart.setHours(0, 0, 0, 0);

    // Get end of the target day
    const periodEnd = new Date(periodStart);
    periodEnd.setDate(periodEnd.getDate() + 1);

    const startStr = periodStart.toISOString();
    const endStr = periodEnd.toISOString();

    const url = `https://api.octopus.energy/v1/products/${PRODUCT_CODE}/tariffs/${TARIFF_CODE}/standard-unit-rates/?period_from=${startStr}&period_to=${endStr}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // The response is JSON with a 'results' array
        /* 
        Example format:
        {
          "count": 48,
          "results": [
            {
              "value_exc_vat": 10.5,
              "value_inc_vat": 11.025,
              "valid_from": "2024-03-01T23:30:00Z",
              "valid_to": "2024-03-02T00:00:00Z"
            },
            ...
          ]
        }
        */
        const data = await response.json();

        const prices: OctopusPrice[] = data.results.map((item: any) => ({
            // Map valid_from as the timestamp for this 30m slot
            timestamp: new Date(item.valid_from),
            price_exc_vat: item.value_exc_vat,
            // Octopus values are already in pence (cents) per kWh usually
            price_inc_vat: item.value_inc_vat
        }));

        // Results from Octopus are often descending, sort ascending by time
        prices.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        return prices;
    } catch (error) {
        console.error("Error fetching Octopus data:", error);
        throw error;
    }
};
