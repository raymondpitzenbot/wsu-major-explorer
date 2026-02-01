
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Program, Department, DataSource, Club } from '../types';
import { getAllPrograms, getDepartments, dataSources, clubs } from '../services/dataService';

interface DataContextType {
    programs: Program[];
    departments: Department[];
    dataSources: DataSource[];
    clubs: Club[];
    loading: boolean;
    getProgramById: (id: string) => Program | undefined;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [programs, setPrograms] = useState<Program[]>([]);
    const [departments, setDepartmentsState] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const programsData = getAllPrograms();
        const departmentsData = getDepartments();
        setPrograms(programsData);
        setDepartmentsState(departmentsData);
        setLoading(false);
    }, []);

    const getProgramById = (id: string): Program | undefined => {
        return programs.find(p => p.program_id === id);
    }
    
    const value = {
        programs,
        departments,
        dataSources,
        clubs,
        loading,
        getProgramById
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = (): DataContextType => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
