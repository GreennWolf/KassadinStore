import React, { useState } from 'react';

export const StatusToolTip = ({ status }) => {
    const [isVisible, setIsVisible] = useState(false);
    // console.log(status)

    if (!status.description) {
        return <span>{status.status}</span>;
    }


    const getBorderStyle = (color) => ({
        borderBottom: '1px dotted',
        borderColor: color || '#3b82f6', // fallback to blue-500 if no color provided
        cursor: 'help'
    });

    const getArrowStyle = (color) => ({
        position: 'absolute',
        width: '0.75rem',
        height: '0.75rem',
        backgroundColor: color, // bg-gray-800
        transform: 'rotate(45deg)',
        marginLeft: '-0.375rem',
        bottom: '-0.375rem',
        left: '50%'
    });

    return (
        <div className="relative inline-block">
            <span
                style={getBorderStyle(status.color)}
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
            >
                {status.status || 'Pendiente'}
            </span>
            
            {isVisible && (
                <div className="absolute z-50 min-w-64 p-2 text-sm bg-black text-white rounded-md shadow-lg left-1/2 -translate-x-1/2 bottom-full mb-2">
                    <div style={getArrowStyle('#000')} />
                    <p className="relative z-10">{status.description}</p>
                </div>
            )}
        </div>
    );
};