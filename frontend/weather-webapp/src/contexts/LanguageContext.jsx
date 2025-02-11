import React, { createContext, useState, useEffect } from 'react';

export const LanguageContext = createContext();

const exYuCountries = ['RS', 'HR', 'BA', 'ME', 'MK', 'SI'];

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('sr');

  useEffect(() => {
    const detectCountry = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user-location`);
        if (response.ok) {
          const { countryCode } = await response.json();
          // Set language to English for non-ex-YU countries
          if (!exYuCountries.includes(countryCode)) {
            console.log('Non-ex-YU visitor detected, setting language to English');
            setLanguage('en');
          }
        }
      } catch (error) {
        console.error('Error detecting country:', error);
      }
    };

    detectCountry();
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}; 