import { useEffect, useState, useMemo } from 'react';
import { Header } from './components/Header';
import { Card } from './components/Card';
import { EnergyChart, type ChartDataPoint } from './components/EnergyChart';
import { CombinedEnergyChart } from './components/CombinedEnergyChart';
import { fetchDayAheadPrices } from './services/entsoe';
import { format, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

function App() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [entsoeCurrent, setEntsoeCurrent] = useState<ChartDataPoint[]>([]);
  const [entsoeData, setEntsoeData] = useState<ChartDataPoint[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch Current (Selected Date) and Day-Ahead (Selected Date + 1)
        const dateCurrent = new Date(selectedDate);
        const dateDayAhead = addDays(selectedDate, 1);

        const [fetchedCurrent, fetchedDayAhead] = await Promise.all([
          fetchDayAheadPrices(dateCurrent),
          fetchDayAheadPrices(dateDayAhead)
        ]);

        setEntsoeCurrent(fetchedCurrent.map(d => ({
          timestamp: d.timestamp,
          valueInCents: d.price / 10
        })));

        setEntsoeData(fetchedDayAhead.map(d => ({
          timestamp: subDays(d.timestamp, 1), // Shift timestamp back by 1 day so they align on the selectedDate axis!
          valueInCents: d.price / 10
        })));
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'Failed to fetch data');
        } else {
          setError('Failed to fetch data');
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedDate]);

  // Variable representation for German Customer Prices (Dynamic/Variable Tariff Simulation)
  // Usually Wholesale Day-Ahead + ~18.5 cents for taxes, grid fees, and levies depending on region.
  const variableCustomerPrices = useMemo(() => {
    if (entsoeCurrent.length === 0) return [];
    return entsoeCurrent.map(p => ({
      timestamp: p.timestamp,
      valueInCents: p.valueInCents + 18.5
    }));
  }, [entsoeCurrent]);

  // Calculate Difference: Current Entso-E minus Day-Ahead Entso-E
  const priceDifference = useMemo(() => {
    if (entsoeCurrent.length === 0 || entsoeData.length === 0) return [];

    return entsoeCurrent.map((currentPoint, index) => {
      const dayAheadPoint = entsoeData[index];
      if (dayAheadPoint) {
        return {
          timestamp: currentPoint.timestamp,
          valueInCents: currentPoint.valueInCents - dayAheadPoint.valueInCents
        }
      }
      return { timestamp: currentPoint.timestamp, valueInCents: 0 };
    });
  }, [entsoeCurrent, entsoeData]);


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
            <Card title={<><span style={{ color: 'var(--text-main)' }}>●</span> 1. Combined View: Current vs Day-Ahead Prices</>}>
              <div style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Date: {format(selectedDate, 'dd.MM.yyyy')} | Source: ENTSO-E (DE-LU) | Overlay of Today and for this day's datasets</div>
              {entsoeCurrent.length > 0 && entsoeData.length > 0 ? (
                <CombinedEnergyChart
                  data1={entsoeCurrent}
                  data2={entsoeData}
                  color1="var(--primary)"
                  color2="#805AD5"
                  name1="Current (Today)"
                  name2="Day-Ahead (for this day)"
                />
              ) : (
                <div className="loading-container" style={{ height: '200px' }}>No data available for combination view.</div>
              )}
            </Card>

            <Card title={<><span style={{ color: 'var(--primary)' }}>●</span> 2. ENTSO-E: Current Energy Prices</>}>
              <div style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Date: {format(selectedDate, 'dd.MM.yyyy')} | Source: ENTSO-E (DE-LU)</div>
              {entsoeCurrent.length > 0 ? (
                <EnergyChart data={entsoeCurrent} color="var(--primary)" />
              ) : (
                <div className="loading-container" style={{ height: '200px' }}>No current data available for this date.</div>
              )}
            </Card>

            <Card title={<><span style={{ color: '#805AD5' }}>●</span> 3. ENTSO-E: Day-Ahead Prices (Wholesale Reference)</>}>
              <div style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Date: {format(selectedDate, 'dd.MM.yyyy')} | Source: ENTSO-E (DE-LU)</div>
              {entsoeData.length > 0 ? (
                <EnergyChart data={entsoeData} color="#805AD5" />
              ) : (
                <div className="loading-container" style={{ height: '200px' }}>No day-ahead data available yet for this date.</div>
              )}
            </Card>

            <Card title={<><span style={{ color: '#E53E3E' }}>●</span> 4. Price Difference (Current vs Day-Ahead)</>}>
              <div style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Delta: Current Prices minus Day-Ahead Prices.</div>
              {priceDifference.length > 0 ? (
                <EnergyChart data={priceDifference} color="#E53E3E" />
              ) : (
                <div className="loading-container" style={{ height: '200px' }}>Waiting for dataset to compute difference...</div>
              )}
            </Card>

            <Card title={<><span style={{ color: '#38A169' }}>●</span> 5. Average Customer Prices in Germany (Variable Tariff)</>}>
              <div style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Date: {format(selectedDate, 'dd.MM.yyyy')} | Source: Simulated overhead added to Wholesale</div>
              {variableCustomerPrices.length > 0 ? (
                <EnergyChart data={variableCustomerPrices} color="#38A169" />
              ) : (
                <div className="loading-container" style={{ height: '200px' }}>Waiting for dataset to compute dynamic prices...</div>
              )}
            </Card>

            <Card title={<><span style={{ color: 'var(--text-main)' }}>●</span> 6. Combined View: Current, Day-Ahead & Customer Prices</>}>
              <div style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Date: {format(selectedDate, 'dd.MM.yyyy')} | Source: Overlay of all major datasets</div>
              {entsoeCurrent.length > 0 && entsoeData.length > 0 && variableCustomerPrices.length > 0 ? (
                <CombinedEnergyChart
                  data1={entsoeCurrent}
                  data2={entsoeData}
                  data3={variableCustomerPrices}
                  color1="var(--primary)"
                  color2="#805AD5"
                  color3="#38A169"
                  name1="Current (Today)"
                  name2="Day-Ahead (for this day)"
                  name3="Average Customer Prices"
                />
              ) : (
                <div className="loading-container" style={{ height: '200px' }}>No data available for combination view.</div>
              )}
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
