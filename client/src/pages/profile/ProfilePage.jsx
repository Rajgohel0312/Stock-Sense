import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, ShieldCheck, LogOut, CheckCircle } from 'lucide-react';
import { profileService } from '../../services/profile.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ROUTES } from '../../constants/routes';
import { ROLE_LABELS } from '../../constants/roles';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';

export default function ProfilePage() {
  const { user, refreshUser, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Name Update Form
  const [name, setName] = useState(user?.name || '');
  const [nameLoading, setNameLoading] = useState(false);

  // Password Change Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Logout All Loading
  const [logoutAllLoading, setLogoutAllLoading] = useState(false);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user]);

  const handleUpdateName = async (e) => {
    e.preventDefault();
    setNameLoading(true);
    try {
      await profileService.updateProfile({ name });
      toast.success('Profile updated successfully!');
      refreshUser();
    } catch (err) {
      toast.error(err.userMessage || 'Failed to update profile');
    } finally {
      setNameLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setPasswordLoading(true);
    try {
      await profileService.updatePassword({ currentPassword, newPassword });
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.userMessage || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogoutAll = async () => {
    if (!window.confirm('Revoke all active sessions on all devices and log out?')) return;
    setLogoutAllLoading(true);
    try {
      await profileService.logoutAll();
      toast.success('All sessions revoked');
      await logout();
      navigate(ROUTES.LOGIN);
    } catch (err) {
      toast.error(err.userMessage || 'Failed to revoke sessions');
    } finally {
      setLogoutAllLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Account & Security</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your personal details, credentials, and active device sessions
        </p>
      </div>

      {/* Account Overview Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-md shadow-indigo-500/20">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{user?.name}</h2>
              <Badge variant="default" size="sm">
                {ROLE_LABELS[user?.role] || user?.role}
              </Badge>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Personal Details */}
        <Card title="Personal Information" subtitle="Update your profile display name">
          <form onSubmit={handleUpdateName} className="space-y-4">
            <Input
              label="Full Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={User}
            />

            <Input
              label="Email Address"
              disabled
              value={user?.email || ''}
              helperText="Email addresses cannot be modified directly."
            />

            <Button type="submit" variant="primary" loading={nameLoading}>
              Save Changes
            </Button>
          </form>
        </Card>

        {/* Change Password */}
        <Card title="Security Credentials" subtitle="Update your system login password">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              icon={Lock}
            />

            <Input
              label="New Password"
              type="password"
              required
              placeholder="Min 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              icon={Lock}
            />

            <Input
              label="Confirm New Password"
              type="password"
              required
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={Lock}
            />

            <Button type="submit" variant="primary" loading={passwordLoading}>
              Update Password
            </Button>
          </form>
        </Card>
      </div>

      {/* Session Management */}
      <Card
        title="Session Security"
        subtitle="Manage authentication tokens across multiple browsers and devices"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h4 className="text-sm font-semibold text-slate-800">Revoke All Device Sessions</h4>
            <p className="text-xs text-slate-500 mt-0.5 max-w-md">
              Immediately invalidates all existing JWT tokens by incrementing your security token version.
              You will need to sign in again everywhere.
            </p>
          </div>
          <Button
            variant="danger"
            icon={LogOut}
            loading={logoutAllLoading}
            onClick={handleLogoutAll}
          >
            Logout All Devices
          </Button>
        </div>
      </Card>
    </div>
  );
}
