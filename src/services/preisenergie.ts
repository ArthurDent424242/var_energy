import { format } from 'date-fns';

export interface PreisenergieTariff {
  id: string;
  name: string;
}

export interface PreisenergiePrice {
  valid_from: string;
  valid_to: string;
  net_value: number;
  gross_value: number;
  unit: string;
  components: Record<string, number>;
}

export async function fetchPreisenergiePrices(startDate: Date, endDate: Date): Promise<PreisenergiePrice[]> {
  const tenantId = 'EykeL1N6UaSLntzWV9tqRviPRct08ZpuZaTbzTXwYWheKLuz7h';
  const tariffId = '0e54e80c-7992-4da2-a957-5ef20b7cd480';
  const zipCode = '45889';
  const dsoCode = '9900221000006';
  const city = 'Gelsenkirchen';
  
  // Start is the start of requested date, End is start of next day
  const startStr = format(startDate, "yyyy-MM-dd'T'00:00:00'Z'");
  const endStr = format(endDate, "yyyy-MM-dd'T'00:00:00'Z'");

  const targetUrl = `https://portal.preisenergie.de/dynamic-tariffs/external-api/v1/tenants/${tenantId}/tariffs/${tariffId}/prices?zip_code=${zipCode}&dso_code=${dsoCode}&city=${city}&valid_from=${startStr}&valid_to=${endStr}`;
  const localUrl = `/api/preisenergie/dynamic-tariffs/external-api/v1/tenants/${tenantId}/tariffs/${tariffId}/prices?zip_code=${zipCode}&dso_code=${dsoCode}&city=${city}&valid_from=${startStr}&valid_to=${endStr}`;

  const url = import.meta.env.PROD
    ? `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`
    : localUrl;

  const response = await fetch(url, {
    headers: {
      'x-pe-tenant-api-key': 'fe2d30d6-bbca-4b71-b536-81520110bdf1'
    }
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Failed to fetch preisenergie prices: ${response.statusText} ${errText}`);
  }

  return response.json();
}

export async function fetchAvailableTariffs(): Promise<PreisenergieTariff[]> {
  const tenantId = 'EykeL1N6UaSLntzWV9tqRviPRct08ZpuZaTbzTXwYWheKLuz7h';
  
  const targetUrl = `https://portal.preisenergie.de/dynamic-tariffs/external-api/v1/tenants/${tenantId}/tariffs`;
  const localUrl = `/api/preisenergie/dynamic-tariffs/external-api/v1/tenants/${tenantId}/tariffs`;

  const url = import.meta.env.PROD
    ? `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`
    : localUrl;

  const response = await fetch(url, {
    headers: {
      'x-pe-tenant-api-key': 'fe2d30d6-bbca-4b71-b536-81520110bdf1'
    }
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Failed to fetch tariffs: ${response.statusText} ${errText}`);
  }

  return response.json();
}
