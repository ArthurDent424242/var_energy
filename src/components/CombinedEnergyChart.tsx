import React, { useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Legend
} from 'recharts';
import { format } from 'date-fns';

export interface ChartDataPoint {
    timestamp: Date;
    valueInCents: number; // Cent/kWh
}

interface CombinedEnergyChartProps {
    data1: ChartDataPoint[];
    data2: ChartDataPoint[];
    data3?: ChartDataPoint[];
    color1?: string;
    color2?: string;
    color3?: string;
    name1?: string;
    name2?: string;
    name3?: string;
}

export const CombinedEnergyChart: React.FC<CombinedEnergyChartProps> = ({
    data1,
    data2,
    data3,
    color1 = 'var(--primary)',
    color2 = '#805AD5',
    color3 = '#38A169',
    name1 = 'Current',
    name2 = 'Day-Ahead',
    name3 = 'Customer Prices'
}) => {
    if (!data1 || data1.length === 0 || !data2 || data2.length === 0) {
        return <div className="loading-container">No data available</div>;
    }

    // Format data for Recharts by combining the two arrays
    const chartData = useMemo(() => {
        if (data1.length === 0 || data2.length === 0) return [];

        return data1.map((d1, index) => {
            const d2 = data2[index];
            if (!d2) return null;

            const d3 = data3 ? data3[index] : null;

            return {
                time: d1.timestamp.getTime(),
                displayTime: format(d1.timestamp, 'HH:mm'),
                dateName: format(d1.timestamp, 'dd.MM.yyyy'),
                price1: +d1.valueInCents.toFixed(2),
                price2: +d2.valueInCents.toFixed(2),
                price3: d3 ? +d3.valueInCents.toFixed(2) : undefined,
                priceEuro1: (d1.valueInCents / 100).toFixed(3),
                priceEuro2: (d2.valueInCents / 100).toFixed(3),
                priceEuro3: d3 ? (d3.valueInCents / 100).toFixed(3) : undefined,
            };
        }).filter(Boolean);
    }, [data1, data2]);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const dataPoint = payload[0].payload;
            return (
                <div className="card" style={{ padding: '0.75rem', minWidth: '200px' }}>
                    <p style={{ fontWeight: 600, margin: 0, color: 'var(--text-main)', fontSize: '0.875rem' }}>
                        {dataPoint.dateName} - {dataPoint.displayTime}
                    </p>
                    <div style={{ margin: '0.5rem 0 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div>
                            <span style={{ color: color1, fontWeight: 600, display: 'block' }}>
                                {name1}
                            </span>
                            <span style={{ color: color1, fontWeight: 600 }}>
                                {dataPoint.price1} Cent / kWh
                            </span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginLeft: '8px' }}>
                                ({dataPoint.priceEuro1} €/kWh)
                            </span>
                        </div>
                        <div>
                            <span style={{ color: color2, fontWeight: 600, display: 'block' }}>
                                {name2}
                            </span>
                            <span style={{ color: color2, fontWeight: 600 }}>
                                {dataPoint.price2} Cent / kWh
                            </span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginLeft: '8px' }}>
                                ({dataPoint.priceEuro2} €/kWh)
                            </span>
                        </div>
                        {data3 && dataPoint.price3 !== undefined && (
                            <div>
                                <span style={{ color: color3, fontWeight: 600, display: 'block' }}>
                                    {name3}
                                </span>
                                <span style={{ color: color3, fontWeight: 600 }}>
                                    {dataPoint.price3} Cent / kWh
                                </span>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginLeft: '8px' }}>
                                    ({dataPoint.priceEuro3} €/kWh)
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div style={{ width: '100%', height: 350 }}>
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
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <ReferenceLine y={0} stroke="var(--border-color)" />
                    <Line
                        name={name1}
                        type="stepAfter"
                        dataKey="price1"
                        stroke={color1}
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 6, fill: color1, stroke: 'white', strokeWidth: 2 }}
                        animationDuration={1000}
                    />
                    <Line
                        name={name2}
                        type="stepAfter"
                        dataKey="price2"
                        stroke={color2}
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 6, fill: color2, stroke: 'white', strokeWidth: 2 }}
                        animationDuration={1000}
                    />
                    {data3 && (
                        <Line
                            name={name3}
                            type="stepAfter"
                            dataKey="price3"
                            stroke={color3}
                            strokeWidth={2.5}
                            dot={false}
                            activeDot={{ r: 6, fill: color3, stroke: 'white', strokeWidth: 2 }}
                            animationDuration={1000}
                        />
                    )}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};
