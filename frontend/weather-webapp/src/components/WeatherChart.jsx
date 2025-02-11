import React from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import styled from 'styled-components';

const ChartContainer = styled.div`
  height: 200px;
  margin: 20px 0;
`;

const StatsContainer = styled.div`
  display: flex;
  justify-content: space-around;
  margin-top: 10px;
  color: #888;
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  color: #0ff;
  font-size: 1.2em;
`;

const WeatherChart = ({ data, unit, precision, sensorType }) => {
  if (!data?.history) return null;

  const formatValue = (value) => Number(value).toFixed(precision);

  // Special handling for rain data
  const processData = (history) => {
    if (sensorType === 'rain') {
      // Only keep non-zero values and values that change
      return history.filter((item, index, arr) => {
        const value = parseFloat(item.state);
        const prevValue = index > 0 ? parseFloat(arr[index - 1].state) : 0;
        return value > 0 || prevValue > 0;
      });
    }
    return history;
  };

  const processedData = processData(data.history);

  return (
    <>
      <ChartContainer>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={processedData}>
            <XAxis
              dataKey="last_updated"
              tickFormatter={(time) => new Date(time).toLocaleTimeString()}
              stroke="#888"
            />
            <YAxis
              domain={sensorType === 'rain' ? [0, 'auto'] : ['auto', 'auto']}
              stroke="#888"
            />
            <Line
              type="monotone"
              dataKey="state"
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