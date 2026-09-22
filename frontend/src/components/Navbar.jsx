import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from './common/NotificationBell';

const links = [
  { to: '/',            label: '🏠 หน้าแรก' },
  { to: '/players',     label: '⚽ ทำเนียบนักเตะ' },
  { to: '/marketplace', label: '🏪 ตลาดซื้อขายไอดี' },
];

export default function Navbar() {
  const { isAuthenticated } = useAuth();

  return (
    <nav style={{
      background: '#1a1a2e', padding: '0.8rem 1.5rem',
      display: 'flex', gap: '1.5rem', alignItems: 'center',
    }}>
      <span style={{ color: '#e94560', fontWeight: 700, fontSize: '1.1rem', marginRight: 'auto' }}>
        ⚡ eFootball Market
      </span>
      {links.map(({ to, label }) => (
        <Link key={to} to={to} style={{ color: '#a8dadc', textDecoration: 'none', fontWeight: 500 }}>
          {label}
        </Link>
      ))}
      {isAuthenticated && <NotificationBell />}
    </nav>
  );
}

