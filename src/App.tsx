import { useEffect, useState, useMemo } from 'react';
import { Header } from './components/Header';
import { Card } from './components/Card';
import { EnergyChart, type ChartDataPoint } from './components/EnergyChart';
import { fetchDayAheadPrices } from './services/entsoe';
import { format, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

function App() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [entsoeCurrent, setEntsoeCurrent] = useState<ChartDataPoint[]>([]);
  const [entsoeDayAhead, setEntsoeDayAhead] = useState<ChartDataPoint[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Target Date (Current)
        const dateCurrent = new Date(selectedDate);
        // Target Date + 1 (Day Ahead)
        const dateDayAhead = addDays(selectedDate, 1);

        const [entsoeDataCurrent, entsoeDataDayAhead] = await Promise.allSettled([
          fetchDayAheadPrices(dateCurrent),
          fetchDayAheadPrices(dateDayAhead)
        ]);

        if (entsoeDataCurrent.status === 'fulfilled') {
          // Convert ENTSO-E EUR/MWh to Cent/kWh (/ 10)
          setEntsoeCurrent(entsoeDataCurrent.value.map(d => ({
            timestamp: d.timestamp,
            valueInCents: d.price / 10
          })));
        } else {
          setEntsoeCurrent([]);
          console.error(entsoeDataCurrent.reason);
        }

        if (entsoeDataDayAhead.status === 'fulfilled') {
          setEntsoeDayAhead(entsoeDataDayAhead.value.map(d => ({
            timestamp: d.timestamp,
            valueInCents: d.price / 10
          })));
        } else {
          setEntsoeDayAhead([]);
        }

      } catch (err: any) {
        setError(err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedDate]);

  // Calculate Difference: Current minus Day-Ahead 
  // (Note: To compare apples to apples, we match by hour. If day-ahead is cheaper, difference is positive)
  const priceDifference = useMemo(() => {
    if (entsoeCurrent.length === 0 || entsoeDayAhead.length === 0) return [];

    return entsoeCurrent.map((currentPoint, index) => {
      const dayAheadPoint = entsoeDayAhead[index];
      // If the arrays align perfectly (which they usually do for 24h ENTSO-E data)
      if (dayAheadPoint) {
        return {
          timestamp: currentPoint.timestamp,
          // e.g. Current (10ct) - DayAhead(8ct) = +2ct difference
          valueInCents: currentPoint.valueInCents - dayAheadPoint.valueInCents
        }
      }
      return { timestamp: currentPoint.timestamp, valueInCents: 0 };
    });
  }, [entsoeCurrent, entsoeDayAhead]);

  // Variable representation for German Customer Prices (Dynamic/Variable Tariff Simulation)
  // Usually Wholesale Day-Ahead + ~18 to 20 cents for taxes, grid fees, and levies depending on region.
  const variableCustomerPrices = useMemo(() => {
    if (entsoeDayAhead.length === 0) return [];
    return entsoeDayAhead.map(p => ({
      timestamp: p.timestamp,
      valueInCents: p.valueInCents + 18.5 // Base price + 18.5 ct/kWh estimated overhead
    }));
  }, [entsoeDayAhead]);


  const handlePrevDay = () => setSelectedDate(prev => subDays(prev, 1));
  const handleNextDay = () => setSelectedDate(prev => addDays(prev, 1));
  const handleToday = () => setSelectedDate(new Date());

  return (
    <div className="app-container">
      <Header />

      <main className="container">
        <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="dashboard-title">Energy Overview</h1>
            <p className="dashboard-subtitle">Visualizing Day-Ahead & Current Prices</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface)', padding: '0.25rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
            <button onClick={handlePrevDay} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem' }} title="Previous Day">
              <ChevronLeft size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 1rem', fontWeight: 600 }}>
              <Calendar size={18} color="var(--primary)" />
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
            <p>Fetching market data...</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <Card title={<><span style={{ color: 'var(--primary)' }}>●</span> ENTSO-E: Current Energy Prices</>}>
              <div style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Date: {format(selectedDate, 'dd.MM.yyyy')} | Source: ENTSO-E (DE-LU)</div>
              <EnergyChart data={entsoeCurrent} color="var(--primary)" />
            </Card>

            <Card title={<><span style={{ color: '#805AD5' }}>●</span> ENTSO-E: Day-Ahead Prices</>}>
              <div style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Date: {format(addDays(selectedDate, 1), 'dd.MM.yyyy')} | Source: ENTSO-E (DE-LU)</div>
              {entsoeDayAhead.length > 0 ? (
                <EnergyChart data={entsoeDayAhead} color="#805AD5" />
              ) : (
                <div className="loading-container" style={{ height: '200px' }}>No day-ahead data available yet for this date.</div>
              )}
            </Card>

            <Card title={<><span style={{ color: '#E53E3E' }}>●</span> Price Difference (Current vs. Day-Ahead)</>}>
              <div style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Delta: Current Date Prices minus Day-Ahead Prices. Values above 0 mean Current is more expensive.</div>
              {priceDifference.length > 0 ? (
                <EnergyChart data={priceDifference} color="#E53E3E" />
              ) : (
                <div className="loading-container" style={{ height: '200px' }}>Waiting for both datasets to compute difference...</div>
              )}
            </Card>

            <Card title={<><span style={{ color: '#38A169' }}>●</span> Variable Energy Prices (Dynamic Customer Tariff)</>}>
              <div style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Date: {format(addDays(selectedDate, 1), 'dd.MM.yyyy')} | Source: Day-Ahead + Estimated overhead (~18.5ct for taxes, grid fees)</div>
              {variableCustomerPrices.length > 0 ? (
                <EnergyChart data={variableCustomerPrices} color="#38A169" />
              ) : (
                <div className="loading-container" style={{ height: '200px' }}>Waiting for dataset to compute dynamic prices...</div>
              )}
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
