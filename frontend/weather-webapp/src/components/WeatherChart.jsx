import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';
import styled from 'styled-components';

const ChartContainer = styled.div`
  width: 100%;
  height: 200px;
  margin-top: 20px;
`;

const StatsContainer = styled.div`
  display: flex;
  justify-content: space-around;
  margin-top: 10px;
  font-size: 0.9em;
  color: #888;
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

  return (
    <>
      <ChartContainer>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis
              dataKey="time"
              type="number"
              domain={['auto', 'auto']}
              tickFormatter={(time) => new Date(time).toLocaleTimeString()}
              stroke="#666"
            />
            <YAxis
              stroke="#666"
              domain={sensorType === 'rain' ? [0, 'auto'] : ['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{ background: '#1a1a2e', border: '1px solid #0ff' }}
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