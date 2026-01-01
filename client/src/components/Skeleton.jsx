import React from 'react';

export default function Skeleton({ width, height, borderRadius = '4px', style = {}, className = '' }) {
    const styles = {
        width,
        height,
        borderRadius,
        ...style,
    };

    return (
        <div
            className={`skeleton ${className}`}
            style={styles}
            aria-hidden="true"
        />
    );
}
