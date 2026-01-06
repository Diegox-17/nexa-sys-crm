import React from 'react';

const Logo = ({ size = 'medium' }) => {
    const isSmall = size === 'small';
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'var(--font-mono)',
            fontWeight: '700',
            letterSpacing: '2px',
            fontSize: isSmall ? '1.2rem' : '1.8rem',
            color: 'white'
        }}>
            <span style={{
                color: 'var(--color-secondary)',
                border: `2px solid var(--color-secondary)`,
                padding: isSmall ? '2px 6px' : '4px 8px',
                borderRadius: '2px'
            }}>NX</span>
            <span>SYS</span>
        </div>
    );
};

export default Logo;
