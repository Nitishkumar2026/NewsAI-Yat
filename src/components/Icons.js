import React from 'react';

export const SearchIcon = ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

export const MicIcon = ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
        <line x1="12" y1="19" x2="12" y2="23"></line>
        <line x1="8" y1="23" x2="16" y2="23"></line>
    </svg>
);

export const YatAiLogo = ({ size = 40 }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" rx="20" fill="#1e3a8a" />
        <path d="M30 40H70" stroke="#0891b2" strokeWidth="4" strokeLinecap="round" />
        <path d="M30 50H70" stroke="#0891b2" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        <path d="M30 60H70" stroke="#0891b2" strokeWidth="4" strokeLinecap="round" />
        <path d="M50 30V70" stroke="#0891b2" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
        <text x="50" y="58" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold" fontFamily="Arial">AI</text>
        <circle cx="30" cy="40" r="3" fill="#0891b2" />
        <circle cx="70" cy="60" r="3" fill="#0891b2" />
    </svg>
);
