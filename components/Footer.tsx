import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-gray-50 border-t border-gray-200">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                    <div className="col-span-2 lg:col-span-1 text-left">
                        <Link to="/" className="inline-flex items-center gap-2">
                            <GraduationCap className="text-primary-600" size={28} />
                            <span className="text-gray-900 text-lg font-semibold">Winona State Explorer</span>
                        </Link>
                        <p className="mt-4 text-sm text-gray-500 font-body">
                            Helping students find their path at Winona State University.
                        </p>
                    </div>
                    <div className="col-span-1 text-left">
                        <h3 className="font-semibold text-gray-900 tracking-wider uppercase">Official Links</h3>
                        <ul className="mt-4 space-y-2 text-sm font-body">
                            <li><a href="https://www.winona.edu/academics/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary-600">WSU Academics</a></li>
                            <li><a href="https://www.winona.edu/advising/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary-600">Advising Services</a></li>
                            <li><a href="https://www.winona.edu/admissions/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary-600">Admissions</a></li>
                            <li><a href="https://www.winona.edu/studentservices/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary-600">Student Services</a></li>
                        </ul>
                    </div>
                    <div className="col-span-1 text-left">
                        <h3 className="font-semibold text-gray-900 tracking-wider uppercase">Data Sources</h3>
                        <ul className="mt-4 space-y-2 text-sm font-body">
                            <li><a href="https://www.winona.edu/about/leadership/institutional-data/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary-600">WSU IPAR</a></li>
                            <li><a href="https://apps.deed.state.mn.us/lmi/oes/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary-600">Minnesota DEED</a></li>
                        </ul>
                    </div>
                    <div className="col-span-2 lg:col-span-1 text-left">
                        <h3 className="font-semibold text-gray-900 tracking-wider uppercase">Disclaimer</h3>
                        <p className="mt-4 text-sm text-gray-500 font-body">
                            This tool is for informational purposes only. Always confirm program details with an official WSU academic advisor.
                        </p>
                    </div>
                </div>
                <div className="mt-12 pt-8 border-t border-gray-200 text-center">
                    <p className="text-sm text-gray-500 font-body">
                        &copy; {new Date().getFullYear()} Winona State Explorer. An independent project, not an official WSU resource.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
