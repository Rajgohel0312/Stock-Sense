import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';

// Layouts
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';

// Route Guards
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';
import SignupPage from '../pages/auth/SignupPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';

// Dashboard
import DashboardPage from '../pages/dashboard/DashboardPage';

// Catalog
import ProductListPage from '../pages/products/ProductListPage';
import ProductDetailPage from '../pages/products/ProductDetailPage';
import CategoryListPage from '../pages/categories/CategoryListPage';

// Facilities & Master Data
import WarehouseListPage from '../pages/warehouses/WarehouseListPage';
import LocationListPage from '../pages/warehouses/LocationListPage';
import SupplierListPage from '../pages/suppliers/SupplierListPage';
import CustomerListPage from '../pages/customers/CustomerListPage';

// Operational Workflows
import ReceiptListPage from '../pages/receipts/ReceiptListPage';
import ReceiptDetailPage from '../pages/receipts/ReceiptDetailPage';
import DeliveryListPage from '../pages/deliveries/DeliveryListPage';
import DeliveryDetailPage from '../pages/deliveries/DeliveryDetailPage';
import TransferListPage from '../pages/transfers/TransferListPage';
import TransferDetailPage from '../pages/transfers/TransferDetailPage';
import AdjustmentListPage from '../pages/adjustments/AdjustmentListPage';
import AdjustmentDetailPage from '../pages/adjustments/AdjustmentDetailPage';

// Inventory & Audits
import StockListPage from '../pages/inventory/StockListPage';
import LedgerListPage from '../pages/inventory/LedgerListPage';
import ReservationListPage from '../pages/inventory/ReservationListPage';
import DocumentListPage from '../pages/inventory/DocumentListPage';

// Alerts & Profile
import AlertListPage from '../pages/alerts/AlertListPage';
import ProfilePage from '../pages/profile/ProfilePage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.SIGNUP} element={<SignupPage />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
      </Route>

      {/* Protected Operations & Inventory Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />

          {/* Catalog */}
          <Route path={ROUTES.PRODUCTS} element={<ProductListPage />} />
          <Route path={ROUTES.PRODUCT_DETAIL} element={<ProductDetailPage />} />
          <Route path={ROUTES.CATEGORIES} element={<CategoryListPage />} />

          {/* Warehouses & Locations */}
          <Route path={ROUTES.WAREHOUSES} element={<WarehouseListPage />} />
          <Route path={ROUTES.LOCATIONS} element={<LocationListPage />} />

          {/* Suppliers & Customers */}
          <Route path={ROUTES.SUPPLIERS} element={<SupplierListPage />} />
          <Route path={ROUTES.CUSTOMERS} element={<CustomerListPage />} />

          {/* Operations */}
          <Route path={ROUTES.RECEIPTS} element={<ReceiptListPage />} />
          <Route path={ROUTES.RECEIPT_DETAIL} element={<ReceiptDetailPage />} />

          <Route path={ROUTES.DELIVERIES} element={<DeliveryListPage />} />
          <Route path={ROUTES.DELIVERY_DETAIL} element={<DeliveryDetailPage />} />

          <Route path={ROUTES.TRANSFERS} element={<TransferListPage />} />
          <Route path={ROUTES.TRANSFER_DETAIL} element={<TransferDetailPage />} />

          <Route path={ROUTES.ADJUSTMENTS} element={<AdjustmentListPage />} />
          <Route path={ROUTES.ADJUSTMENT_DETAIL} element={<AdjustmentDetailPage />} />

          {/* Inventory & Ledger */}
          <Route path={ROUTES.STOCK} element={<StockListPage />} />
          <Route path={ROUTES.LEDGER} element={<LedgerListPage />} />
          <Route path={ROUTES.RESERVATIONS} element={<ReservationListPage />} />
          <Route path={ROUTES.DOCUMENTS} element={<DocumentListPage />} />

          {/* System & Profile */}
          <Route path={ROUTES.ALERTS} element={<AlertListPage />} />
          <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Fallback to Dashboard */}
      <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
    </Routes>
  );
}
