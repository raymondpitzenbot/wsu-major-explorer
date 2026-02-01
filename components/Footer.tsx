import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-gray-900 border-t border-gray-800">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div className="sm:col-span-2 lg:col-span-1 text-center sm:text-left">
                        <Link to="/" className="inline-flex items-center gap-2">
                            <GraduationCap className="text-primary-500" size={28} />
                            <span className="text-white text-lg font-semibold">WSU Major Explorer</span>
                        </Link>
                        <p className="mt-4 text-sm text-gray-400 font-body">
                            Helping students find their path at Winona State University.
                        </p>
                    </div>
                     <div className="text-center sm:text-left">
                        <h3 className="font-semibold text-gray-300 tracking-wider uppercase">Official Links</h3>
                        <ul className="mt-4 space-y-2 text-sm font-body">
                            <li><a href="https://www.winona.edu/academics/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary-400">WSU Academics</a></li>
                            <li><a href="https://www.winona.edu/advising/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary-400">Advising Services</a></li>
                            <li><a href="https://www.winona.edu/admissions/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary-400">Admissions</a></li>
                        </ul>
                    </div>
                     <div className="text-center sm:text-left">
                        <h3 className="font-semibold text-gray-300 tracking-wider uppercase">Data Sources</h3>
                        <ul className="mt-4 space-y-2 text-sm font-body">
                            <li><a href="https://www.winona.edu/about/leadership/institutional-data/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary-400">WSU IPAR</a></li>
                            <li><a href="https://apps.deed.state.mn.us/lmi/oes/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary-400">Minnesota DEED</a></li>
                            <li><Link to="/about" className="text-gray-400 hover:text-primary-400">About Our Data</Link></li>
                        </ul>
                    </div>
                     <div className="text-center sm:text-left">
                        <h3 className="font-semibold text-gray-300 tracking-wider uppercase">Disclaimer</h3>
                        <p className="mt-4 text-sm text-gray-400 font-body">
                        This tool is for informational purposes only. Always confirm program details with an official WSU academic advisor.
                        </p>
                    </div>
                </div>
                <div className="mt-12 pt-8 border-t border-gray-800 text-center">
                    <p className="text-sm text-gray-400 font-body">
                        &copy; {new Date().getFullYear()} WSU Major Explorer. An independent project, not an official WSU resource.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
