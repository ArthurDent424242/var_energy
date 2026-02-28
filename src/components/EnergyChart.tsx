import React, { useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';
import { format } from 'date-fns';

export interface ChartDataPoint {
    timestamp: Date;
    valueInCents: number; // Cent/kWh
}

interface EnergyChartProps {
    data: ChartDataPoint[];
    color?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, color }: any) => {
    if (active && payload && payload.length) {
        const dataPoint = payload[0].payload;
        return (
            <div className="card" style={{ padding: '0.75rem', minWidth: '150px' }}>
                <p style={{ fontWeight: 600, margin: 0, color: 'var(--text-main)', fontSize: '0.875rem' }}>
                    {dataPoint.dateName} - {dataPoint.displayTime}
                </p>
                <div style={{ margin: '0.5rem 0 0', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ color: color, fontWeight: 600 }}>
                        {dataPoint.price} Cent / kWh
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        {dataPoint.priceEuro} € / kWh
                    </span>
                </div>
            </div>
        );
    }
    return null;
};

export const EnergyChart: React.FC<EnergyChartProps> = ({ data, color = 'var(--primary)' }) => {
    // Format data for Recharts
    const chartData = useMemo(() => {
        // Generate full 24h timeline to pad missing data points at the end of the day
        if (!data || data.length === 0) return [];

        return data.map(d => {
            const euros = (d.valueInCents / 100).toFixed(3);
            return {
                time: d.timestamp.getTime(),
                displayTime: format(d.timestamp, 'HH:mm'),
                dateName: format(d.timestamp, 'dd.MM.yyyy'),
                price: +d.valueInCents.toFixed(2),
                priceEuro: euros,
            }
        });
    }, [data]);

    if (!data || data.length === 0) {
        return <div className="loading-container">No data available</div>;
    }

    // Component moved outside

    return (
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <LineChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                    <XAxis
                        dataKey="displayTime"
                        tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: 'var(--border-color)' }}
                        interval="preserveStartEnd"
                        minTickGap={40}
                    />
                    <YAxis
                        tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value} ct`}
                        width={50}
                    />
                    <Tooltip content={(props) => <CustomTooltip {...props} color={color} />} />
                    <ReferenceLine y={0} stroke="var(--border-color)" />
                    <Line
                        type="stepAfter"
                        dataKey="price"
                        stroke={color}
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 6, fill: color, stroke: 'white', strokeWidth: 2 }}
                        animationDuration={1000}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};
