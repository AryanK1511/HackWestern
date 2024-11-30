import React from 'react';
import Link from 'next/link';
import './Sidebar.css';

const Sidebar = () => {
    return (
        <div className="sidebar">
            <h2>Navigation</h2>
            <ul>
                <li><Link href="/">My App Home</Link></li>
                <li><Link href="/tempolabs">Analytics</Link></li>
                {/* Add more links as needed */}
            </ul>
        </div>
    );
};

export default Sidebar; 
