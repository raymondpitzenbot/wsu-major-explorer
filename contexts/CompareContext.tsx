
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Program } from '../types';

interface CompareContextType {
    compareList: Program[];
    addToCompare: (program: Program) => boolean;
    removeFromCompare: (programId: string) => void;
    clearCompare: () => void;
    isComparing: (programId: string) => boolean;
}

const MAX_COMPARE = 4;

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export const CompareProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [compareList, setCompareList] = useState<Program[]>([]);

    const addToCompare = (program: Program) => {
        if (compareList.length < MAX_COMPARE && !compareList.find(p => p.program_id === program.program_id)) {
            setCompareList([...compareList, program]);
            return true;
        }
        return false;
    };

    const removeFromCompare = (programId: string) => {
        setCompareList(compareList.filter(p => p.program_id !== programId));
    };

    const clearCompare = () => {
        setCompareList([]);
    };

    const isComparing = (programId: string) => {
        return compareList.some(p => p.program_id === programId);
    };

    return (
        <CompareContext.Provider value={{ compareList, addToCompare, removeFromCompare, clearCompare, isComparing }}>
            {children}
        </CompareContext.Provider>
    );
};

export const useCompare = (): CompareContextType => {
    const context = useContext(CompareContext);
    if (context === undefined) {
        throw new Error('useCompare must be used within a CompareProvider');
    }
    return context;
};
