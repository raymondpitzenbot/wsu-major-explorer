import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import CompareTray from './CompareTray';
import Footer from './Footer';

const Layout: React.FC = () => {
    const location = useLocation();
    const isComparePage = location.pathname === '/compare';

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 font-body transition-colors duration-300 flex flex-col">
            <Header />
            <main className="pt-16 flex-1 min-h-0 flex flex-col">
                <Outlet />
            </main>
            {/* CompareTray is rendered conditionally here, and also within ComparePage itself to ensure it's always present there */}
            {!isComparePage && <CompareTray />}
            <Footer />
        </div>
    );
};

export default Layout;