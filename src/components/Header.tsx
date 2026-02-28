import React from 'react';
import { Activity } from 'lucide-react';

export const Header: React.FC = () => {
    return (
        <header className="app-header">
            <div className="brand">
                <Activity className="brand-icon" size={28} />
                <span>Homematic IP Energy</span>
            </div>
            <div>
                {/* Potentially add user profile or settings icons here */}
            </div>
        </header>
    );
};
