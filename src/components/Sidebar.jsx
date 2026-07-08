import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBars,
  faGaugeHigh,
  faCashRegister,
  faFileInvoiceDollar,
  faHandHoldingDollar,
  faUsers,
  faTruck,
  faChartBar,
  faFileInvoice,
  faMoneyBillTransfer,
  faWallet,
  faChevronDown,
  faTicket,
  faUserGear,
} from '@fortawesome/free-solid-svg-icons';

const NAV_POR_ROL = {
  admin: [
    { ruta: '/dashboard', icon: faGaugeHigh, label: 'Dashboard' },
    { ruta: '/caja', icon: faCashRegister, label: 'Caja diaria' },
    { ruta: '/mi-turno', icon: faWallet, label: 'Mi turno' },
    { ruta: '/planillas', icon: faFileInvoiceDollar, label: 'Planillas' },
    { ruta: '/vales/asignar', icon: faTicket, label: 'Asignar vale' },
    { ruta: '/prestamos', icon: faHandHoldingDollar, label: 'Préstamos' },
    { ruta: '/empleados', icon: faUsers, label: 'Empleados' },
    { ruta: '/proveedores', icon: faTruck, label: 'Proveedores' },
    { ruta: '/usuarios', icon: faUserGear, label: 'Usuarios' },
    { ruta: '/facturas-pendientes', icon: faFileInvoice, label: 'Facturas pendientes' },
    { ruta: '/gastos-externos', icon: faMoneyBillTransfer, label: 'Gastos externos' },
    { ruta: '/reportes', icon: faChartBar, label: 'Reportes' },
  ],
  secretaria: [
    { ruta: '/dashboard', icon: faGaugeHigh, label: 'Dashboard' },
    { ruta: '/caja', icon: faCashRegister, label: 'Caja diaria', badge: 'Solo lectura' },
    { ruta: '/facturas-pendientes', icon: faFileInvoice, label: 'Facturas pendientes' },
    { ruta: '/gastos-externos', icon: faMoneyBillTransfer, label: 'Gastos externos' },
    { ruta: '/reportes', icon: faChartBar, label: 'Reportes' },
  ],
};

export default function Sidebar({ collapsed, setCollapsed, mobileAbierto, setMobileAbierto }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickFuera = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickFuera);
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, []);

  const handleToggle = () => {
    if (window.innerWidth >= 768) {
      setCollapsed(!collapsed);
    } else {
      setMobileAbierto(!mobileAbierto);
    }
  };

  const isActive = (ruta) => location.pathname === ruta || location.pathname.startsWith(`${ruta}/`);

  const itemClass = (ruta) => `flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition text-sm font-medium
    ${isActive(ruta)
      ? 'bg-slate-800 text-white dark:bg-slate-700'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'}`;

  const items = NAV_POR_ROL[user?.role] ?? [];

  return (
    <>
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center gap-4 border-b border-slate-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-900">
        <button
          type="button"
          onClick={handleToggle}
          className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <FontAwesomeIcon icon={faBars} className="h-5 w-5" />
        </button>

        <span className="text-lg font-bold text-slate-800 dark:text-slate-100">CajaFlow</span>
        <div className="flex-1" />

        {/* Usuario */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownAbierto(!dropdownAbierto)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white dark:bg-slate-600">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="hidden text-sm md:block">{user?.name}</span>
            <FontAwesomeIcon icon={faChevronDown} className="hidden h-3 w-3 text-slate-400 md:block" />
          </button>

          {dropdownAbierto && (
            <div className="absolute right-0 top-11 z-50 w-48 rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
              <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{user?.name}</p>
                <p className="text-xs capitalize text-slate-500 dark:text-slate-400">{user?.role}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-b-xl px-4 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-slate-100 dark:text-red-400 dark:hover:bg-slate-700"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Overlay móvil */}
      {mobileAbierto && (
        <div
          className="fixed inset-0 z-30 mt-14 bg-black/60"
          onClick={() => setMobileAbierto(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-14 left-0 z-40 h-[calc(100vh-3.5rem)] overflow-hidden border-r border-slate-200 bg-white transition-all duration-300 dark:border-slate-700 dark:bg-slate-900
        ${collapsed ? 'w-14' : 'w-56'}
        ${!mobileAbierto ? 'max-md:w-0' : 'max-md:w-56'}`}
      >
        <nav className="w-56 space-y-1 p-2">
          {items.map((item) => (
            <div
              key={item.ruta}
              className={itemClass(item.ruta)}
              onClick={() => {
                navigate(item.ruta);
                setMobileAbierto(false);
              }}
              title={collapsed ? item.label : ''}
            >
              <FontAwesomeIcon icon={item.icon} className="h-4 w-4 flex-shrink-0" />
              {!collapsed && (
                <span className="flex flex-1 items-center justify-between gap-2 truncate">
                  {item.label}
                  {item.badge && (
                    <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-normal text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      {item.badge}
                    </span>
                  )}
                </span>
              )}
            </div>
          ))}
        </nav>
      </div>
    </>
  );
}
