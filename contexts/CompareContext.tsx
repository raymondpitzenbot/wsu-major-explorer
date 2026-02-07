
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Program } from '../types';

interface CompareContextType {
    compareList: Program[];
    addToCompare: (program: Program) => boolean;
    setCompareList: (programs: Program[]) => void;
    removeFromCompare: (programId: string) => void;
    clearCompare: () => void;
    isComparing: (programId: string) => boolean;
    isTrayVisible: boolean;
    setIsTrayVisible: (visible: boolean) => void;
}

const MAX_COMPARE = 4;

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export const CompareProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [compareList, setCompareListState] = useState<Program[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('wsu_compare_list');
            try {
                return saved ? JSON.parse(saved) : [];
            } catch (e) {
                return [];
            }
        }
        return [];
    });
    const [isTrayVisible, setIsTrayVisible] = useState(false);

    const setCompareList = (programs: Program[]) => {
        setCompareListState(programs);
        if (typeof window !== 'undefined') {
            localStorage.setItem('wsu_compare_list', JSON.stringify(programs));
        }
    };

    const addToCompare = (program: Program) => {
        if (compareList.length < MAX_COMPARE && !compareList.find(p => p.program_id === program.program_id)) {
            const newList = [...compareList, program];
            setCompareList(newList);
            // setIsTrayVisible(true); // Removed auto-open behavior
            return true;
        }
        return false;
    };

    const removeFromCompare = (programId: string) => {
        const newList = compareList.filter(p => p.program_id !== programId);
        setCompareList(newList);
    };

    const clearCompare = () => {
        setCompareList([]);
    };

    const isComparing = (programId: string) => {
        return compareList.some(p => p.program_id === programId);
    };

    return (
        <CompareContext.Provider value={{ compareList, addToCompare, setCompareList, removeFromCompare, clearCompare, isComparing, isTrayVisible, setIsTrayVisible }}>
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
