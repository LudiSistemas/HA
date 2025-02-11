import React from 'react';
import styled, { keyframes } from 'styled-components';

const rotate = (degrees) => keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(${degrees}deg);
  }
`;

const CompassContainer = styled.div`
  width: 150px;
  height: 150px;
  position: relative;
  margin: 20px auto;
`;

const CompassRose = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid #0ff;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 0 10px #0ff;

  &::before {
    content: 'N';
    position: absolute;
    top: 5px;
    color: #0ff;
  }

  &::after {
    content: 'S';
    position: absolute;
    bottom: 5px;
    color: #0ff;
  }
`;

const Arrow = styled.div`
  width: 4px;
  height: 80%;
  background: linear-gradient(to bottom, #ff4444 50%, #4444ff 50%);
  position: absolute;
  top: 10%;
  animation: ${props => rotate(props.degrees)} 1s ease-out forwards;
`;

const WindSpeed = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #0ff;
  font-size: 1.2em;
  text-shadow: 0 0 5px #0ff;
`;

const getWindDirection = (degrees) => {
  const directions = ['S', 'JJI', 'JI', 'IJI', 'I', 'ISI', 'SI', 'SSI', 
                     'S', 'SSZ', 'SZ', 'ZSZ', 'Z', 'ZJZ', 'JZ', 'JJZ'];
  return directions[Math.round(degrees / 22.5) % 16];
};

const WindCompass = ({ direction, speed, gust }) => {
  const degrees = parseFloat(direction);
  const windDir = getWindDirection(degrees);

  return (
    <CompassContainer>
      <CompassRose>
        <Arrow degrees={degrees} />
        <WindSpeed>
          {speed} m/s
          {gust && <div>Max: {gust} m/s</div>}
        </WindSpeed>
      </CompassRose>
      <div style={{ textAlign: 'center', marginTop: '10px', color: '#888' }}>
        {windDir} - {degrees}°
      </div>
    </CompassContainer>
  );
};

export default WindCompass; 