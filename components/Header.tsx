import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { GraduationCap, Menu, X } from 'lucide-react';

const Header: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
        `text-sm transition-colors font-normal ${
            isActive
                ? 'text-white font-semibold'
                : 'text-gray-300 hover:text-white'
        }`;
    
    const mobileNavLinkClasses = ({ isActive }: { isActive: boolean }) =>
        `block py-2 px-3 rounded-md text-base font-medium ${
            isActive ? 'bg-primary-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        }`;

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative flex items-center justify-between h-16">
                    {/* Left-aligned content */}
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center gap-3">
                            <GraduationCap className="text-primary-500" size={28} />
                             <span className="text-white text-lg font-semibold">
                                <span className="sm:hidden">WSU Majors</span>
                                <span className="hidden sm:inline">WSU Major Explorer</span>
                            </span>
                        </Link>
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
                    <div className="flex items-center">
                        <div className="md:hidden">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                type="button"
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
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
                        <NavLink to="/explore" className={mobileNavLinkClasses} onClick={() => setIsMenuOpen(false)}>Explore</NavLink>
                        <NavLink to="/compare" className={mobileNavLinkClasses} onClick={() => setIsMenuOpen(false)}>Compare</NavLink>
                        <NavLink to="/advisor" className={mobileNavLinkClasses} onClick={() => setIsMenuOpen(false)}>Advisor</NavLink>
                        <NavLink to="/about" className={mobileNavLinkClasses} onClick={() => setIsMenuOpen(false)}>About</NavLink>
                    </nav>
                </div>
            )}
        </header>
    );
};

export default Header;
