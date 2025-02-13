import React from 'react';
import styled from 'styled-components';

const CompassContainer = styled.div`
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  margin: 1rem;
  text-align: center;
`;

const CompassRose = styled.div`
  width: 200px;
  height: 200px;
  border-radius: 50%;
  position: relative;
  margin: 20px auto;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.2);
`;

const Arrow = styled.div`
  position: absolute;
  width: 4px;
  height: 100px;
  background: #ff6b6b;
  left: 50%;
  top: 50%;
  transform-origin: bottom center;
  transform: translateX(-50%) rotate(${props => props.direction}deg);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -8px;
    width: 0;
    height: 0;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-bottom: 16px solid #ff6b6b;
  }
`;

const DirectionLabel = styled.div`
  position: absolute;
  width: 100%;
  text-align: center;
  color: white;
  font-weight: bold;
  
  &.north { top: 10px; }
  &.south { bottom: 10px; }
  &.east { right: 10px; top: 50%; transform: translateY(-50%); }
  &.west { left: 10px; top: 50%; transform: translateY(-50%); }
`;

const WindSpeed = styled.div`
  margin-top: 1rem;
  font-size: 1.2em;
  color: white;
`;

const WindCompass = ({ data, config }) => {
  if (!data) return null;

  // Convert wind direction to degrees
  const getWindDirection = (direction) => {
    // If direction is already a number, return it
    if (!isNaN(direction)) return direction;
    
    // Convert cardinal directions to degrees
    const directions = {
      'N': 0, 'NNE': 22.5, 'NE': 45, 'ENE': 67.5,
      'E': 90, 'ESE': 112.5, 'SE': 135, 'SSE': 157.5,
      'S': 180, 'SSW': 202.5, 'SW': 225, 'WSW': 247.5,
      'W': 270, 'WNW': 292.5, 'NW': 315, 'NNW': 337.5
    };
    return directions[direction] || 0;
  };

  const windDirection = getWindDirection(data.state);
  
  return (
    <CompassContainer>
      <h3>{config.display}</h3>
      <CompassRose>
        <DirectionLabel className="north">N</DirectionLabel>
        <DirectionLabel className="south">S</DirectionLabel>
        <DirectionLabel className="east">E</DirectionLabel>
        <DirectionLabel className="west">W</DirectionLabel>
        <Arrow direction={windDirection} />
      </CompassRose>
      <WindSpeed>
        Wind Direction: {data.state}°
      </WindSpeed>
    </CompassContainer>
  );
};

export default WindCompass; 