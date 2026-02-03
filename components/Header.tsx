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
            ? 'text-white font-semibold'
            : 'text-gray-300 hover:text-white'
        }`;

    const mobileNavLinkClasses = ({ isActive }: { isActive: boolean }) =>
        `block py-2 px-3 rounded-md text-base font-medium ${isActive ? 'bg-primary-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        }`;

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300">
                <div className="relative flex items-center justify-between h-16 transition-all duration-300">
                    {/* Left-aligned content */}
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
                            <div className="p-2 rounded-lg border border-gray-800 bg-gray-900/50 transition-all duration-300 group-hover:border-primary-500/50 group-hover:bg-primary-500/10 group-hover:shadow-[0_0_15px_-3px_rgba(99,102,241,0.3)]">
                                <GraduationCap className="text-primary-500 transition-transform duration-300 group-hover:scale-110" size={24} />
                            </div>
                            <span className="text-white text-lg font-semibold tracking-tight transition-all duration-300 hidden lg:block">
                                WSU Major Explorer
                            </span>
                        </div>
                    </div>

                    {/* Centered navigation for medium screens and up */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex">
                        <nav className="flex items-center space-x-10">
                            <NavLink to="/explore" className={navLinkClasses}>
                                Explore
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

                    {/* Right-aligned content */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* Desktop: Full text badge */}
                        <div className="hidden xl:flex items-center gap-2 px-3 py-1 text-sm font-medium text-yellow-500 bg-yellow-500/10 rounded-full border border-yellow-500/20">
                            <Hammer size={16} />
                            <span>This site is actively under construction as of 2/2/2026</span>
                        </div>

                        {/* Mobile/Tablet: Icon only with popover */}
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

                            {/* Popover */}
                            <div
                                className={`absolute right-0 top-full mt-2 w-48 p-3 bg-gray-900 border border-gray-700 rounded-lg shadow-xl text-xs text-yellow-500 transition-all duration-200 z-50 ${isConstructionTooltipOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}
                            >
                                <div className="absolute top-0 right-3 -mt-1 w-2 h-2 bg-gray-900 border-t border-l border-gray-700 transform rotate-45"></div>
                                This site is actively under construction as of 2/2/2026.
                            </div>
                        </div>

                        <div className="md:hidden">
                            <button
                                onPointerUp={(e) => {
                                    e.preventDefault();
                                    setIsMenuOpen(!isMenuOpen);
                                }}
                                type="button"
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 active:text-white active:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition-colors touch-manipulation"
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
                                    {name}
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
