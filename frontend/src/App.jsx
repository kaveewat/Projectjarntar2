import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import UserLayout from './layouts/UserLayout';
import HandoverLayout from './layouts/HandoverLayout';
import AdminLayout from './layouts/AdminLayout';

// Guards
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';

// Components & Placeholders
import PagePlaceholder from './components/common/PagePlaceholder';
import HomePage from './pages/HomePage';
import MarketplacePage from './pages/MarketplacePage';
import ListingDetailPage from './pages/ListingDetailPage';
import PlayersPage from './pages/PlayersPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import KYCPage from './pages/KYCPage';
import NotFoundPage from './pages/NotFoundPage';

// Seller Hub Pages (Phase 13)
import SellerDashboardPage from './pages/seller/SellerDashboardPage';
import MyListingsPage from './pages/seller/MyListingsPage';
import CreateListingPage from './pages/seller/CreateListingPage';

// Buyer & Escrow Order Pages (Phase 14)
import BuyerDashboardPage from './pages/buyer/BuyerDashboardPage';
import MyOrdersPage from './pages/buyer/MyOrdersPage';
import OrderDetailPage from './pages/buyer/OrderDetailPage';
import PaymentSubmitPage from './pages/buyer/PaymentSubmitPage';
import HandoverRoomPage from './pages/shared/HandoverRoomPage';
import OpenDisputePage from './pages/buyer/OpenDisputePage';
import DisputeDetailPage from './pages/shared/DisputeDetailPage';
import NotificationsPage from './pages/shared/NotificationsPage';
import PayoutHistoryPage from './pages/seller/PayoutHistoryPage';

// Admin Console Pages (Phase 15)
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminOrderDetailPage from './pages/admin/AdminOrderDetailPage';
import DisputeManagementPage from './pages/admin/DisputeManagementPage';
import DisputeDetailAdminPage from './pages/admin/DisputeDetailAdminPage';
import KYCReviewPage from './pages/admin/KYCReviewPage';
import KYCDetailPage from './pages/admin/KYCDetailPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import UserDetailPage from './pages/admin/UserDetailPage';
import PlatformSettingsPage from './pages/admin/PlatformSettingsPage';
import EscrowManagementPage from './pages/admin/EscrowManagementPage';
import PayoutManagementPage from './pages/admin/PayoutManagementPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import AuditLogsPage from './pages/admin/AuditLogsPage';
import ListingModerationPage from './pages/admin/ListingModerationPage';
import PlayerManagementPage from './pages/admin/PlayerManagementPage';

export default function App() {
  return (
    <Routes>
      {/* ─────────────────────────────────────────────────────────
          1. Public Routes (PublicLayout)
      ───────────────────────────────────────────────────────── */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/marketplace/:id" element={<ListingDetailPage />} />
        <Route path="/players" element={<PlayersPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/verify-email"
          element={<PagePlaceholder title="Email Verification" category="Authentication" phase="Phase 11" />}
        />
      </Route>

      {/* ─────────────────────────────────────────────────────────
          2. User Routes (Buyer & Seller) — ProtectedRoute + UserLayout
      ───────────────────────────────────────────────────────── */}
      <Route
        element={
          <ProtectedRoute>
            <UserLayout />
          </ProtectedRoute>
        }
      >
        {/* Buyer Routes (Phase 14) */}
        <Route path="/dashboard" element={<BuyerDashboardPage />} />
        <Route path="/orders" element={<MyOrdersPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        <Route path="/orders/:id/payment" element={<PaymentSubmitPage />} />
        <Route path="/disputes/new" element={<OpenDisputePage />} />
        <Route path="/disputes/:id" element={<DisputeDetailPage />} />
        <Route path="/disputes/order/:order_id" element={<DisputeDetailPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        {/* Seller Routes */}
        <Route path="/seller/dashboard" element={<SellerDashboardPage />} />
        <Route path="/seller/listings" element={<MyListingsPage />} />
        <Route path="/seller/listings/new" element={<CreateListingPage />} />
        <Route
          path="/seller/listings/:id/edit"
          element={<PagePlaceholder title="Edit Listing" category="Seller Hub" phase="Phase 13" />}
        />
        <Route path="/seller/orders" element={<MyOrdersPage role="seller" />} />
        <Route path="/seller/kyc" element={<KYCPage />} />
        <Route path="/seller/payouts" element={<PayoutHistoryPage />} />
      </Route>

      {/* ─────────────────────────────────────────────────────────
          3. Handover Vault Routes — ProtectedRoute + HandoverLayout
      ───────────────────────────────────────────────────────── */}
      <Route
        element={
          <ProtectedRoute>
            <HandoverLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/handover/:order_id" element={<HandoverRoomPage />} />
      </Route>

      {/* ─────────────────────────────────────────────────────────
          4. Admin Routes — AdminRoute + AdminLayout
      ───────────────────────────────────────────────────────── */}
      <Route
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/users" element={<UserManagementPage />} />
        <Route path="/admin/users/:id" element={<UserDetailPage />} />
        <Route path="/admin/kyc" element={<KYCReviewPage />} />
        <Route path="/admin/kyc/:id" element={<KYCDetailPage />} />
        <Route path="/admin/listings" element={<ListingModerationPage />} />
        <Route path="/admin/orders" element={<AdminOrdersPage />} />
        <Route path="/admin/orders/:id" element={<AdminOrderDetailPage />} />
        <Route path="/admin/escrow" element={<EscrowManagementPage />} />
        <Route path="/admin/disputes" element={<DisputeManagementPage />} />
        <Route path="/admin/disputes/:id" element={<DisputeDetailAdminPage />} />
        <Route path="/admin/payouts" element={<PayoutManagementPage />} />
        <Route path="/admin/players" element={<PlayerManagementPage />} />
        <Route path="/admin/analytics" element={<AnalyticsPage />} />
        <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
        <Route path="/admin/settings" element={<PlatformSettingsPage />} />
      </Route>

      {/* ─────────────────────────────────────────────────────────
          5. Fallback 404 Catch-All
      ───────────────────────────────────────────────────────── */}
      <Route element={<PublicLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
