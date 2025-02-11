import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';
import styled from 'styled-components';

const ChartContainer = styled.div`
  width: 100%;
  height: 200px;
  margin-top: 20px;

  @media (min-width: 1024px) {
    width: 65%;
    margin: 20px auto;
  }
`;

const StatsContainer = styled.div`
  display: flex;
  justify-content: space-around;
  margin-top: 10px;
  font-size: 0.9em;
  color: #888;

  @media (min-width: 1024px) {
    width: 65%;
    margin: 10px auto;
  }
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  color: #0ff;
  font-size: 1.1em;
  margin-top: 2px;
`;

const WeatherChart = ({ data, unit, precision, sensorType }) => {
  if (!data?.history) return null;

  const formatValue = (value) => Number(value).toFixed(precision);

  // Process data for chart
  let chartData = data.history.map(item => ({
    time: new Date(item.last_updated).getTime(),
    value: parseFloat(item.state)
  }));

  // Special handling for rain data
  if (sensorType === 'rain') {
    chartData = chartData.filter((item, index, arr) => {
      const value = item.value;
      const prevValue = index > 0 ? arr[index - 1].value : 0;
      return value > 0 || prevValue > 0;
    });
  }

  // Get time domain to remove gaps
  const timeRange = chartData.reduce(
    (acc, item) => ({
      min: Math.min(acc.min, item.time),
      max: Math.max(acc.max, item.time),
    }),
    { min: Infinity, max: -Infinity }
  );

  return (
    <>
      <ChartContainer>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={chartData}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <XAxis
              dataKey="time"
              type="number"
              domain={[timeRange.min, timeRange.max]}
              tickFormatter={(time) => new Date(time).toLocaleTimeString()}
              stroke="#666"
              padding={{ left: 0, right: 0 }}
            />
            <YAxis
              stroke="#666"
              domain={sensorType === 'rain' ? [0, 'auto'] : ['auto', 'auto']}
              padding={{ top: 10, bottom: 10 }}
            />
            <Tooltip
              contentStyle={{ 
                background: '#1a1a2e', 
                border: '1px solid #0ff',
                borderRadius: '4px',
                padding: '8px'
              }}
              labelFormatter={(time) => new Date(time).toLocaleString()}
              formatter={(value) => [value.toFixed(precision) + unit]}
            />
            <ReferenceLine y={data.min} stroke="#4444ff" strokeDasharray="3 3" />
            <ReferenceLine y={data.max} stroke="#ff4444" strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#0ff"
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
      <StatsContainer>
        <StatItem>
          <div>Minimum</div>
          <StatValue>{formatValue(data.min)}{unit}</StatValue>
        </StatItem>
        <StatItem>
          <div>Maximum</div>
          <StatValue>{formatValue(data.max)}{unit}</StatValue>
        </StatItem>
      </StatsContainer>
    </>
  );
};

export default WeatherChart; 