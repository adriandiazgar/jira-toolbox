import React from 'react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ReferenceLine, ReferenceArea } from 'recharts';

export const BurndownChart = ({ data, todayIndex }) => {
    if (!data || data.length === 0) return <p className="text-center text-gray-500">Not enough data for burndown chart.</p>;
    
    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <defs>
                    <linearGradient id="colorAhead" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#dcfce7" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#dcfce7" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorBehind" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#fee2e2" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#fee2e2" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis label={{ value: 'Story Points', angle: -90, position: 'insideLeft' }} domain={[0, 'dataMax + 5']} />
                <Tooltip />
                <Legend />
                {data.map((entry, index) => {
                    if (index === 0) return null;
                    const prevEntry = data[index - 1];
                    const isAhead = prevEntry.remaining <= prevEntry.ideal;
                    return (
                        <ReferenceArea
                            key={`area-${index}`}
                            x1={prevEntry.day}
                            x2={entry.day}
                            y1={0}
                            y2="dataMax + 10"
                            fill={isAhead ? 'url(#colorAhead)' : 'url(#colorBehind)'}
                            stroke="none"
                        />
                    );
                })}
                <Line type="monotone" dataKey="ideal" stroke="#8884d8" strokeDasharray="5 5" name="Ideal Burndown" dot={false} />
                <Line type="monotone" dataKey="remaining" stroke="#16a34a" strokeWidth={2} name="Actual Burndown" />
                {typeof todayIndex === 'number' && todayIndex >= 0 && (
                    <ReferenceLine x={`Day ${todayIndex}`} stroke="red" strokeDasharray="3 3" label={{ value: 'Today', position: 'insideTop' }} />
                )}
            </LineChart>
        </ResponsiveContainer>
    );
};
