import React from 'react';

const colorPalettes = [
    ['rgba(79, 70, 229, 0.35)', 'rgba(22, 163, 74, 0.25)', 'rgba(244, 63, 94, 0.25)'], // Original
    ['rgba(124, 58, 237, 0.35)', 'rgba(234, 179, 8, 0.25)', 'rgba(219, 39, 119, 0.25)'], // Purple, Amber, Pink
    ['rgba(30, 64, 175, 0.35)', 'rgba(6, 182, 212, 0.3)', 'rgba(5, 150, 105, 0.3)'], // Blue, Cyan, Emerald
    ['rgba(147, 51, 234, 0.3)', 'rgba(244, 63, 94, 0.3)', 'rgba(249, 115, 22, 0.25)'], // Fuchsia, Rose, Orange
];

const blobColors = ['bg-primary-600', 'bg-emerald-500', 'bg-rose-500', 'bg-indigo-500', 'bg-amber-500', 'bg-cyan-500'];

const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

const generateRandomStyles = () => {
    // Randomize Aurora
    const [color1, color2, color3] = shuffleArray(colorPalettes[Math.floor(Math.random() * colorPalettes.length)]);
    const auroraStyles = {
        '--pos1': `${Math.random() * 100}% ${Math.random() * 100}%`,
        '--pos2': `${Math.random() * 100}% ${Math.random() * 100}%`,
        '--pos3': `${Math.random() * 100}% ${Math.random() * 100}%`,
        '--color1': color1,
        '--color2': color2,
        '--color3': color3,
    } as React.CSSProperties;

    // Randomize Blobs
    const shuffledColors = shuffleArray(blobColors);
    const blobs = [
        {
            position: { top: `${Math.random() * 40 - 20}%`, left: `${Math.random() * 40 - 20}%` },
            size: `${Math.floor(Math.random() * 200 + 400)}px`,
            color: shuffledColors[0],
            duration: `${Math.floor(Math.random() * 5 + 8)}s`,
            delay: '0s',
        },
        {
            position: { bottom: `${Math.random() * 40 - 20}%`, right: `${Math.random() * 40 - 20}%` },
            size: `${Math.floor(Math.random() * 200 + 300)}px`,
            color: shuffledColors[1],
            duration: `${Math.floor(Math.random() * 5 + 9)}s`,
            delay: `${Math.random() * 3}s`,
        },
        {
            position: { top: `${Math.random() * 60 + 20}%`, right: `${Math.random() * 60 - 10}%` },
            size: `${Math.floor(Math.random() * 150 + 250)}px`,
            color: shuffledColors[2],
            duration: `${Math.floor(Math.random() * 5 + 7)}s`,
            delay: `${Math.random() * 3 + 2}s`,
        },
    ];

    return { auroraStyles, blobs };
};

const memoizedStyles = generateRandomStyles();

const DynamicBackground: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className }) => {
    const { auroraStyles, blobs } = memoizedStyles;

    return (
        <div className={`aurora-background ${className || ''}`} style={auroraStyles}>
            <div className="absolute inset-0 z-0">
                {blobs.map((blob, i) => (
                    <div
                        key={i}
                        className={`blob ${blob.color}`}
                        style={{
                            ...blob.position,
                            width: blob.size,
                            height: blob.size,
                            animationDuration: blob.duration,
                            animationDelay: blob.delay,
                        }}
                    />
                ))}
            </div>
            {children}
        </div>
    );
};

export default DynamicBackground;