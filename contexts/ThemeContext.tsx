
import React, { createContext, useEffect, useContext } from 'react';

type Theme = 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void; // Kept for API compatibility, but is now a no-op
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    useEffect(() => {
        const root = window.document.documentElement;
        // Ensure dark mode is always applied and light mode is removed
        root.classList.add('dark');
        root.classList.remove('light');
        // Clean up any old theme settings from local storage
        localStorage.removeItem('theme');
    }, []);

    const value = {
        theme: 'dark' as Theme,
        toggleTheme: () => {}, // No-op function does nothing when called
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
