import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';
import { LanguageContext } from '../contexts/LanguageContext';
import { translations } from '../config/translations';

const StatsContainer = styled.div`
  background: rgba(16, 16, 28, 0.95);
  border-radius: 15px;
  padding: 15px;
  margin: 20px auto;
  width: 90%;
  max-width: 600px;
  border: 1px solid #0ff;
  color: #fff;
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-top: 10px;
`;

const StatItem = styled.div`
  text-align: center;
  padding: 10px;
  border: 1px solid #0ff3;
  border-radius: 8px;
`;

const StatValue = styled.div`
  color: #0ff;
  font-size: 1.5em;
  margin: 5px 0;
`;

const StatLabel = styled.div`
  color: #888;
  font-size: 0.9em;
`;

const SiteStats = () => {
  const [stats, setStats] = useState(null);
  const { language } = useContext(LanguageContext);
  const t = translations[language];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/stats`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  if (!stats) return null;

  return (
    <StatsContainer>
      <StatGrid>
        <StatItem>
          <StatValue>{stats.total_visits}</StatValue>
          <StatLabel>{t.stats.totalVisits}</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue>{stats.unique_visitors}</StatValue>
          <StatLabel>{t.stats.uniqueVisitors}</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue>{stats.last_24h_visits}</StatValue>
          <StatLabel>{t.stats.last24h}</StatLabel>
        </StatItem>
      </StatGrid>
    </StatsContainer>
  );
};

export default SiteStats; 