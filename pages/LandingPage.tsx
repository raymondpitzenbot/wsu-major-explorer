import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, MessageSquare, Scale, ArrowRight } from 'lucide-react';
import { interestMappings } from '../data/wsuData';
import { useData } from '../contexts/DataContext';
import DynamicBackground from '../components/DynamicBackground';


const useAnimateOnScroll = (ref: React.RefObject<HTMLElement>) => {
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.1 }
        );

        const currentRef = ref.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [ref]);
};

const FeatureStatCard: React.FC<{ value: string, label: string, gradient: string }> = ({ value, label, gradient }) => (
    <div className={`relative rounded-xl p-8 flex-grow flex items-center justify-center ${gradient}`}>
        <div className="text-center">
            <p className="text-7xl lg:text-8xl font-bold text-white" style={{ textShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>{value}</p>
            <p className="text-lg text-gray-200 mt-2 font-body" style={{ textShadow: '0 2px 5px rgba(0,0,0,0.3)' }}>{label}</p>
        </div>
    </div>
);

const FeatureBlock: React.FC<{
    title: string;
    description: string;
    linkTo: string;
    linkText: string;
    stat: React.ReactNode;
    orientation: 'left' | 'right';
}> = ({ title, description, linkTo, linkText, stat, orientation }) => {
    const sectionRef = useRef(null);
    useAnimateOnScroll(sectionRef);

    const textOrder = orientation === 'left' ? '' : 'lg:order-last';

    return (
        <div ref={sectionRef} className="scroll-animate grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className={`flex flex-col justify-center ${textOrder} order-2 lg:order-none`}>
                <h3 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h3>
                <p className="mt-4 text-lg text-gray-400 font-body">{description}</p>
                <div className="mt-8">
                    <Link to={linkTo} className="font-body inline-flex items-center gap-2 text-lg font-semibold text-primary-400 mouse:hover:text-primary-300 transition-colors">
                        {linkText} <ArrowRight size={20} />
                    </Link>
                </div>
            </div>
            <div className="flex min-h-[300px] order-1 lg:order-none">
                {stat}
            </div>
        </div>
    );
};


const LandingPage: React.FC = () => {
    const { programs } = useData();
    const [currentPrompt, setCurrentPrompt] = useState(0);

    const promptBubbles = React.useMemo(() => {
        const bubbles = Object.keys(interestMappings);
        return [...bubbles].sort(() => Math.random() - 0.5);
    }, []);

    useEffect(() => {
        if (promptBubbles.length === 0) return;
        const interval = setInterval(() => {
            setCurrentPrompt((prev) => (prev + 1) % promptBubbles.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [promptBubbles]);

    const textShadowStyle = { textShadow: '0 2px 10px rgba(0,0,0,0.5)' };
    const totalPrograms = programs.length || '200+';


    return (
        <>
            <DynamicBackground className="relative isolate">
                <div className="min-h-[calc(80vh)] flex items-center justify-center spotlight relative z-10">
                    <div className="text-center px-6 lg:px-8">
                        <div className="mx-auto max-w-4xl">
                            <h1 className="text-5xl font-semibold tracking-tight text-white sm:text-8xl" style={textShadowStyle}>
                                Find Your Path
                            </h1>
                            <div className="mt-8 text-lg text-white" style={textShadowStyle}>
                                <div className="relative h-10 w-80 mx-auto">
                                    {promptBubbles.map((prompt, index) => (
                                        <div
                                            key={prompt}
                                            className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-in-out ${index === currentPrompt ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`}
                                        >
                                            <Link
                                                to={`/explore?interest=${interestMappings[prompt].id}`}
                                                className="font-body cursor-pointer inline-block whitespace-nowrap rounded-full bg-gray-800/50 px-4 py-1.5 font-semibold text-white ring-1 ring-inset ring-gray-700 mouse:hover:bg-gray-800 mouse:hover:text-white"
                                            >
                                                I want to {prompt}
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <p className="mt-8 text-lg leading-8 text-white font-body" style={textShadowStyle}>
                                Explore academic programs at Winona State University, and chat with our AI advisor to find the program that's right for you.
                            </p>
                            <div className="mt-10 flex items-center justify-center gap-x-6">
                                <Link
                                    to="/explore"
                                    className="font-body flex items-center gap-2 rounded-md bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-sm mouse:hover:bg-primary-500 transition-transform transform mouse:hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                                >
                                    <Search size={16} /> Explore Programs
                                </Link>
                                <Link
                                    to="/advisor"
                                    className="font-body flex items-center gap-2 rounded-md bg-gray-800 px-5 py-3 text-sm font-semibold leading-6 text-white mouse:hover:bg-gray-700 transition-transform transform mouse:hover:scale-105"
                                >
                                    <MessageSquare size={16} /> Ask the Advisor
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </DynamicBackground>

            <div className="bg-gray-950 py-24 sm:py-32">
                <div className="container mx-auto px-4 space-y-24 lg:space-y-32">
                    <div className="text-center">
                        <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">A Toolkit for Your Academic Journey</h2>
                        <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400 font-body">
                            Everything you need to make an informed decision, all in one place.
                        </p>
                    </div>

                    <FeatureBlock
                        orientation="left"
                        title="Explore All Programs"
                        description="Dive into our comprehensive catalog of majors, minors, and pre-professional programs. Use powerful search and filtering tools to narrow down your options based on your interests, college, or degree type."
                        linkTo="/explore"
                        linkText="Start Exploring"
                        stat={<FeatureStatCard value={String(totalPrograms)} label="Programs & Pathways" gradient="bg-gradient-to-br from-cyan-500 to-blue-600" />}
                    />

                    <FeatureBlock
                        orientation="right"
                        title="Compare Side-by-Side"
                        description="Can't decide between a few options? Add them to your compare list to see a detailed, side-by-side breakdown of credits, enrollment data, career outcomes, and more."
                        linkTo="/compare"
                        linkText="Compare Programs"
                        stat={<FeatureStatCard value="4" label="Programs at once" gradient="bg-gradient-to-br from-purple-500 to-indigo-600" />}
                    />

                    <FeatureBlock
                        orientation="left"
                        title="Chat with an AI Advisor"
                        description="Have questions? Our AI-powered advisor, Warrior Bot, can provide instant answers about programs, career paths, and student life. It's available 24/7 to help you on your journey."
                        linkTo="/advisor"
                        linkText="Ask the Advisor"
                        stat={<FeatureStatCard value="24/7" label="AI Support" gradient="bg-gradient-to-br from-rose-500 to-red-600" />}
                    />
                </div>
            </div>
        </>
    );
};

export default LandingPage;