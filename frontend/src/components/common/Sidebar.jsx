/**
 * @fileoverview Sidebar điều hướng theo vai trò.
 * Nhận danh sách items từ props để tái sử dụng cho cả 3 role.
 * Hỗ trợ toggle collapse/expand với animation mượt.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

/** Các root path cần exact match (dashboard pages) */
const ROOT_PATHS = new Set(['/admin', '/giao-vien', '/sinh-vien']);

/**
 * @param {{
 *   items: Array<{to: string, label: string, icon?: string}>,
 *   title?: string
 * }} props
 */
const Sidebar = ({ items, title }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [tooltip, setTooltip] = useState({ text: '', top: 0, visible: false });
  const tooltipTimeout = useRef(null);

  // Cleanup tooltip timeout on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
    };
  }, []);

  const showTooltip = useCallback((e, label) => {
    if (!collapsed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
    tooltipTimeout.current = setTimeout(() => {
      setTooltip({ text: label, top: rect.top + rect.height / 2, visible: true });
    }, 150);
  }, [collapsed]);

  const hideTooltip = useCallback(() => {
    if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
    setTooltip(prev => ({ ...prev, visible: false }));
  }, []);

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      {/* Toggle button */}
      <button
        className="sidebar__toggle"
        onClick={() => setCollapsed(c => !c)}
        aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
        title={collapsed ? 'Mở rộng' : 'Thu gọn'}
      >
        <svg
          className={`sidebar__toggle-icon ${collapsed ? 'sidebar__toggle-icon--rotated' : ''}`}
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Title / Header */}
      <div className="sidebar__header">
        {title && (
          <span className={`sidebar__title ${collapsed ? 'sidebar__title--hidden' : ''}`}>
            {title}
          </span>
        )}
        {collapsed && title && (
          <span className="sidebar__title-collapsed">{title.charAt(0)}</span>
        )}
      </div>

      {/* Navigation items */}
      <nav className="sidebar__nav">
        {items.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={ROOT_PATHS.has(to)}
            className={({ isActive }) =>
              `sidebar__item ${isActive ? 'sidebar__item--active' : ''}`
            }
            onMouseEnter={(e) => showTooltip(e, label)}
            onMouseLeave={hideTooltip}
          >
            {/* Active indicator bar */}
            <span className="sidebar__active-indicator" />

            {/* Icon */}
            {icon && <span className="sidebar__icon">{icon}</span>}

            {/* Label - hidden when collapsed */}
            <span className={`sidebar__label ${collapsed ? 'sidebar__label--hidden' : ''}`}>
              {label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Tooltip for collapsed mode */}
      {collapsed && tooltip.visible && (
        <div
          className="sidebar__tooltip"
          style={{ top: `${tooltip.top}px` }}
        >
          {tooltip.text}
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
