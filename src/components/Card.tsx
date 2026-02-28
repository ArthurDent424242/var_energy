import React, { type ReactNode } from 'react';

interface CardProps {
    title?: ReactNode;
    children: ReactNode;
    className?: string;
}

export const Card: React.FC<CardProps> = ({ title, children, className = '' }) => {
    return (
        <div className={`card ${className}`}>
            {title && <div className="card-title">{title}</div>}
            <div className="card-content">
                {children}
            </div>
        </div>
    );
};
