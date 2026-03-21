import { useEffect, useState } from 'react';
import { Card } from './Card';
import { EnergyChart, type ChartDataPoint } from './EnergyChart';
import { fetchPreisenergiePrices, fetchAvailableTariffs, type PreisenergieTariff } from '../services/preisenergie';
import { format, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

export function PreisenergieTab() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [priceData, setPriceData] = useState<ChartDataPoint[]>([]);
  const [tariffs, setTariffs] = useState<PreisenergieTariff[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch prices for the selected date (from selectedDate to selectedDate + 1)
        const dateDayAhead = addDays(selectedDate, 1);
        const [data, tariffsData] = await Promise.all([
          fetchPreisenergiePrices(selectedDate, dateDayAhead),
          fetchAvailableTariffs()
        ]);

        setTariffs(tariffsData);

        const mappedData: ChartDataPoint[] = data.map(item => ({
          timestamp: new Date(item.valid_from),
          valueInCents: item.gross_value
        }));

        setPriceData(mappedData);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'Failed to fetch tariff data');
        } else {
          setError('Failed to fetch tariff data');
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedDate]);

  const handlePrevDay = () => setSelectedDate(prev => subDays(prev, 1));
  const handleNextDay = () => setSelectedDate(prev => addDays(prev, 1));
  const handleToday = () => setSelectedDate(new Date());

  return (
    <div className="dashboard-content" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="dashboard-title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Dynamic Tariffs (preisenergie.de)</h2>
          <p className="dashboard-subtitle">Gelsenkirchen (45889) • Tariff Overview</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface)', padding: '0.25rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
          <button onClick={handlePrevDay} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem' }} title="Previous Day">
            <ChevronLeft size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 1rem', fontWeight: 600 }}>
            <Calendar size={18} color="#2B6CB0" />
            {format(selectedDate, 'dd.MM.yyyy')}
          </div>
          <button onClick={handleNextDay} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem' }} title="Next Day">
            <ChevronRight size={20} />
          </button>
          <button onClick={handleToday} style={{ borderLeft: '1px solid var(--border-color)', borderRadius: '0 8px 8px 0', marginLeft: '0.25rem' }}>
            Today
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Fetching tariff prices...</p>
        </div>
      ) : (
        <>
          <Card title={<><span style={{ color: '#2B6CB0' }}>●</span> Gross Values for Selected Date</>}>
            <div style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Date: {format(selectedDate, 'dd.MM.yyyy')} | Source: preisenergie.de</div>
            {priceData.length > 0 ? (
              <EnergyChart data={priceData} color="#2B6CB0" />
            ) : (
              <div className="loading-container" style={{ height: '200px' }}>No tariff data available for this date.</div>
            )}
          </Card>

          <Card title="Available API Configurations">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-main)' }}>Dynamically Loaded Tariffs</h3>
                <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                  {tariffs.map(t => (
                    <li key={t.id} style={{ padding: '0.75rem', background: 'var(--surface)', borderRadius: 'var(--radius)', marginBottom: '0.5rem', border: '1px solid var(--border-color)' }}>
                      <strong>{t.name}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>ID: {t.id}</div>
                    </li>
                  ))}
                  {tariffs.length === 0 && <li style={{ color: 'var(--text-muted)' }}>No tariffs found.</li>}
                </ul>
              </div>

              <div>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-main)' }}>Known Available Regions</h3>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
                  The API requires a specific ZIP code to verify location availability. Based on the provided demo configuration, the following regions are guaranteed to be accessible:
                </div>
                <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)', lineHeight: 1.6 }}>
                  <strong>City:</strong> Gelsenkirchen<br/>
                  <strong>Available PLZ (ZIPs):</strong> 45889, 45891, 45892, 45894, 61118<br/>
                  <strong>DSO Code:</strong> 9900221000006
                </div>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
