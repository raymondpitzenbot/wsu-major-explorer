import React, { useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, Menu, X, Hammer } from 'lucide-react';


const Header: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isConstructionTooltipOpen, setIsConstructionTooltipOpen] = useState(false);

    const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
        `text-sm transition-colors font-normal ${isActive
            ? 'text-gray-900 font-semibold'
            : 'text-gray-500 hover:text-gray-900'
        }`;

    const mobileNavLinkClasses = ({ isActive }: { isActive: boolean }) =>
        `block py-2 px-3 rounded-md text-base font-medium ${isActive ? 'bg-primary-100 text-primary-900' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`;

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300">
                <div className="relative flex items-center justify-between h-16 transition-all duration-300">
                    { }
                    <div className="flex items-center transition-all duration-300 ease-in-out">
                        <div
                            role="link"
                            tabIndex={0}
                            onPointerUp={(e) => {
                                e.preventDefault();
                                navigate('/');
                            }}
                            className="flex items-center gap-3 group relative z-20 touch-manipulation cursor-pointer"
                        >
                            <div className="p-2 rounded-lg border border-gray-200 bg-white/50 transition-all duration-300">
                                <GraduationCap className="text-primary-600" size={24} />
                            </div>
                            <span className="text-gray-900 text-lg font-semibold tracking-tight transition-all duration-300 hidden lg:block">
                                Winona State Explorer
                            </span>
                        </div>
                    </div>

                    { }
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex">
                        <nav className="flex items-center space-x-10">
                            <NavLink to="/explore" className={navLinkClasses}>
                                Catalog
                            </NavLink>
                            <NavLink to="/compare" className={navLinkClasses}>
                                Compare
                            </NavLink>
                            <NavLink to="/advisor" className={navLinkClasses}>
                                Advisor
                            </NavLink>
                            <NavLink to="/about" className={navLinkClasses}>
                                About
                            </NavLink>
                        </nav>
                    </div>

                    { }
                    <div className="flex items-center gap-2 sm:gap-4">
                        { }
                        <div className="hidden xl:flex items-center gap-2 px-3 py-1 text-sm font-medium text-yellow-500 bg-yellow-500/10 rounded-full border border-yellow-500/20">
                            <Hammer size={16} />
                            <span>This site is actively under construction as of 2/2/2026</span>
                        </div>

                        { }
                        <div className="xl:hidden relative">
                            <button
                                className="flex items-center justify-center p-2 text-yellow-500 bg-yellow-500/10 rounded-full border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors"
                                onClick={() => setIsConstructionTooltipOpen(!isConstructionTooltipOpen)}
                                onMouseEnter={() => setIsConstructionTooltipOpen(true)}
                                onMouseLeave={() => setIsConstructionTooltipOpen(false)}
                                aria-label="Under construction info"
                            >
                                <Hammer size={18} />
                            </button>

                            { }
                            <div
                                className={`absolute right-0 top-full mt-2 w-56 p-4 bg-white border border-gray-200 rounded-xl shadow-xl shadow-gray-200/50 text-sm font-medium text-gray-800 transition-all duration-200 z-50 transform origin-top-right ${isConstructionTooltipOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}
                            >
                                <div className="absolute -top-1.5 right-3 w-3 h-3 bg-white border-t border-l border-gray-200 transform rotate-45 shadow-sm"></div>
                                <div className="flex gap-2">
                                    <Hammer size={16} className="text-yellow-500 shrink-0 mt-0.5" />
                                    <p>This site is actively under construction as of 2/2/2026.</p>
                                </div>
                            </div>
                        </div>

                        <div className="md:hidden">
                            <button
                                onPointerUp={(e) => {
                                    e.preventDefault();
                                    setIsMenuOpen(!isMenuOpen);
                                }}
                                type="button"
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 active:text-gray-900 active:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 transition-colors touch-manipulation"
                                aria-controls="mobile-menu"
                                aria-expanded={isMenuOpen}
                            >
                                <span className="sr-only">Open main menu</span>
                                {isMenuOpen ? <X className="block h-6 w-6" aria-hidden="true" /> : <Menu className="block h-6 w-6" aria-hidden="true" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {isMenuOpen && (
                <div className="md:hidden" id="mobile-menu">
                    <nav className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {['/explore', '/compare', '/advisor', '/about'].map((path) => {
                            const name = path.substring(1).charAt(0).toUpperCase() + path.substring(2);
                            const isActive = location.pathname === path;
                            return (
                                <div
                                    key={path}
                                    role="link"
                                    tabIndex={0}
                                    className={mobileNavLinkClasses({ isActive })}
                                    onPointerUp={(e) => {
                                        e.preventDefault();
                                        navigate(path);
                                        setIsMenuOpen(false);
                                    }}
                                >
                                    {path === '/explore' ? 'Catalog' : name}
                                </div>
                            );
                        })}
                    </nav>
                </div>
            )}
        </header>
    );
};

export default Header;
