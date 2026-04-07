/**
 * @fileoverview Sidebar điều hướng theo vai trò.
 * Nhận danh sách items từ props để tái sử dụng cho cả 3 role.
 */

import { NavLink } from 'react-router-dom';

/**
 * @param {{
 *   items: Array<{to: string, label: string, icon?: string}>,
 *   title?: string
 * }} props
 */
const Sidebar = ({ items, title }) => {
  return (
    <aside
      style={{
        width: '240px', minHeight: '100vh', background: '#1e1b4b',
        padding: '1.5rem 0', display: 'flex', flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      {title && (
        <div style={{ padding: '0 1.25rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '0.75rem' }}>
          <span style={{ color: '#a5b4fc', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
            {title}
          </span>
        </div>
      )}

      <nav>
        {items.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.7rem 1.25rem', color: isActive ? '#fff' : '#a5b4fc',
              background: isActive ? 'rgba(99,102,241,0.3)' : 'transparent',
              textDecoration: 'none', fontSize: '0.9rem', fontWeight: isActive ? 600 : 400,
              borderLeft: isActive ? '3px solid #818cf8' : '3px solid transparent',
              transition: 'all 0.15s ease',
            })}
          >
            {icon && <span style={{ fontSize: '1.1rem' }}>{icon}</span>}
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
