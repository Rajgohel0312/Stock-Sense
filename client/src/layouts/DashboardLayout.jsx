import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Sliders,
  PackageSearch,
  History,
  BookmarkCheck,
  FileStack,
  FolderTree,
  Warehouse,
  MapPin,
  Truck,
  Users,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { alertService } from '../services/alert.service';
import { ROUTES } from '../constants/routes';
import { ROLE_LABELS } from '../constants/roles';
import Badge from '../components/ui/Badge';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [unresolvedAlertsCount, setUnresolvedAlertsCount] = useState(0);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await alertService.getAlerts({ is_resolved: false });
        const list = res.data?.alerts || res.data || [];
        setUnresolvedAlertsCount(list.length);
      } catch (e) {
        // quiet error
      }
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const navGroups = [
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard', path: ROUTES.DASHBOARD, icon: LayoutDashboard },
      ],
    },
    {
      title: 'Operations',
      items: [
        { label: 'Receipts', path: ROUTES.RECEIPTS, icon: ArrowDownLeft },
        { label: 'Deliveries', path: ROUTES.DELIVERIES, icon: ArrowUpRight },
        { label: 'Transfers', path: ROUTES.TRANSFERS, icon: ArrowLeftRight },
        { label: 'Adjustments', path: ROUTES.ADJUSTMENTS, icon: Sliders },
      ],
    },
    {
      title: 'Inventory & Ledger',
      items: [
        { label: 'Live Stock', path: ROUTES.STOCK, icon: PackageSearch },
        { label: 'Stock Ledger', path: ROUTES.LEDGER, icon: History },
        { label: 'Reservations', path: ROUTES.RESERVATIONS, icon: BookmarkCheck },
        { label: 'Documents', path: ROUTES.DOCUMENTS, icon: FileStack },
      ],
    },
    {
      title: 'Master Catalog',
      items: [
        { label: 'Products', path: ROUTES.PRODUCTS, icon: Boxes },
        { label: 'Categories', path: ROUTES.CATEGORIES, icon: FolderTree },
        { label: 'Warehouses', path: ROUTES.WAREHOUSES, icon: Warehouse },
        { label: 'Locations', path: ROUTES.LOCATIONS, icon: MapPin },
        { label: 'Suppliers', path: ROUTES.SUPPLIERS, icon: Truck },
        { label: 'Customers', path: ROUTES.CUSTOMERS, icon: Users },
      ],
    },
    {
      title: 'System',
      items: [
        {
          label: 'Alerts',
          path: ROUTES.ALERTS,
          icon: Bell,
          badge: unresolvedAlertsCount > 0 ? unresolvedAlertsCount : null,
        },
        { label: 'Profile', path: ROUTES.PROFILE, icon: User },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-tight">StockSense</span>
              <span className="block text-[10px] text-indigo-400 font-mono tracking-widest uppercase">
                Inventory OS
              </span>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx}>
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-2">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.path === '/'
                      ? location.pathname === '/'
                      : location.pathname.startsWith(item.path);

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 text-[11px] font-bold rounded-full bg-rose-500 text-white">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User bar at bottom of sidebar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-indigo-900/60 border border-indigo-700/50 flex items-center justify-center text-indigo-300 font-semibold text-xs shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name || 'Staff User'}</p>
                <p className="text-xs text-slate-400 truncate capitalize">
                  {ROLE_LABELS[user?.role] || user?.role || 'User'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="text-slate-400 hover:text-rose-400 p-2 rounded-lg hover:bg-slate-800/80 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden text-slate-600 hover:text-slate-900 p-1.5 rounded-lg border border-slate-200"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Inventory Management System
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Alerts notification icon */}
            <NavLink
              to={ROUTES.ALERTS}
              className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unresolvedAlertsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
              )}
            </NavLink>

            {/* User role indicator & dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden md:block text-left">
                  <span className="block text-xs font-semibold text-slate-800 leading-tight">
                    {user?.name}
                  </span>
                  <span className="block text-[11px] text-slate-500 capitalize">
                    {ROLE_LABELS[user?.role] || user?.role}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in-50"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs text-slate-400">Signed in as</p>
                    <p className="text-xs font-semibold text-slate-800 truncate">{user?.email}</p>
                  </div>
                  <NavLink
                    to={ROUTES.PROFILE}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
                  >
                    <User className="w-4 h-4" /> Profile & Security
                  </NavLink>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content body */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
