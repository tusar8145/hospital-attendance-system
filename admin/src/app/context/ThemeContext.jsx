// ThemeContext.js
import { createContext, useState, useContext } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('...');
  const [hospital, setHospital] = useState(null);
  const [refreshHospital, setRefreshHospital] = useState(false);
  const [refreshHospitalList, setRefreshHospitalList] = useState(false); // Add this

  const toggleTheme = (data) => {
    setTheme(data);
  };

  const toggleHospital = (data) => {
    setHospital(data);
  };

  const toggleRefreshHospital = (data) => {
    setRefreshHospital(data);
  };

  const toggleRefreshHospitalList = (data) => { // Add this
    setRefreshHospitalList(data);
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      toggleTheme, 
      hospital,  
      toggleHospital, 
      refreshHospital,
      toggleRefreshHospital,
      refreshHospitalList, // Add this
      toggleRefreshHospitalList // Add this
    }}>
      {children} 
    </ThemeContext.Provider>
  );
};