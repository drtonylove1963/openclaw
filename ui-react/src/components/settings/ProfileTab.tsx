import { useState, useEffect } from 'react';
import { User, Lock, Mail, Save } from 'lucide-react';
import { GlassCard } from '../shared/GlassCard';
import { NeuralButton } from '../shared/NeuralModal';
import { useSettingsStore } from '../../stores/settingsStore';
import { useAuth } from '../../contexts/AuthContext';

export function ProfileTab() {
  const { user } = useAuth();
  const { profile, loading, loadProfile, updateProfile, changePassword } = useSettingsStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setEmail(profile.email || '');
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    try {
      await updateProfile({ full_name: fullName, email });
      setSaveMessage('Profile updated successfully');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage((error as Error).message);
      setTimeout(() => setSaveMessage(''), 5000);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordMessage('Passwords do not match');
      setTimeout(() => setPasswordMessage(''), 3000);
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage('Password must be at least 8 characters');
      setTimeout(() => setPasswordMessage(''), 3000);
      return;
    }

    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage('Password changed successfully');
      setTimeout(() => setPasswordMessage(''), 3000);
    } catch (error) {
      setPasswordMessage((error as Error).message);
      setTimeout(() => setPasswordMessage(''), 5000);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) {return user?.username?.substring(0, 2).toUpperCase() || 'U';}
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return '#8b5cf6';
      case 'ENTERPRISE':
        return '#f59e0b';
      case 'PRO':
        return '#00d4ff';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <GlassCard variant="bordered" style={{ padding: '32px' }}>
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div
            className="flex-shrink-0 flex items-center justify-center text-[28px] font-bold"
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #00d4ff 0%, #8b5cf6 100%)',
              color: '#f0f0f5',
            }}
          >
            {getInitials(fullName || profile?.full_name)}
          </div>

          {/* Profile Fields */}
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-[13px] font-medium mb-2"
                  style={{ color: '#6b7280' }}
                >
                  Full Name
                </label>
                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2"
                    style={{ color: '#6b7280' }}
                  />
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full text-[14px] border-0 outline-none transition-all duration-200"
                    style={{
                      padding: '12px 12px 12px 44px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      color: '#f0f0f5',
                    }}
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-[13px] font-medium mb-2"
                  style={{ color: '#6b7280' }}
                >
                  Email
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2"
                    style={{ color: '#6b7280' }}
                  />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-[14px] border-0 outline-none transition-all duration-200"
                    style={{
                      padding: '12px 12px 12px 44px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      color: '#f0f0f5',
                    }}
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Username (readonly) */}
              <div>
                <label
                  htmlFor="username"
                  className="block text-[13px] font-medium mb-2"
                  style={{ color: '#6b7280' }}
                >
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={profile?.username || user?.username || ''}
                  readOnly
                  className="w-full text-[14px] border-0 outline-none"
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    color: '#6b7280',
                    cursor: 'not-allowed',
                  }}
                />
              </div>

              {/* Role */}
              <div>
                <label
                  htmlFor="role"
                  className="block text-[13px] font-medium mb-2"
                  style={{ color: '#6b7280' }}
                >
                  Account Tier
                </label>
                <div
                  className="inline-flex items-center gap-2 text-[14px] font-semibold"
                  style={{
                    padding: '12px 20px',
                    borderRadius: '12px',
                    background: `${getRoleBadgeColor(profile?.role || user?.role || 'FREE')}20`,
                    border: `1px solid ${getRoleBadgeColor(profile?.role || user?.role || 'FREE')}40`,
                    color: getRoleBadgeColor(profile?.role || user?.role || 'FREE'),
                  }}
                >
                  {profile?.role || user?.role || 'FREE'}
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center gap-3 pt-2">
              <NeuralButton
                variant="primary"
                onClick={handleSaveProfile}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <Save size={16} />
                Save Changes
              </NeuralButton>
              {saveMessage && (
                <span
                  className="text-[13px]"
                  style={{
                    color: saveMessage.includes('success') ? '#10b981' : '#ef4444',
                  }}
                >
                  {saveMessage}
                </span>
              )}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Change Password */}
      <GlassCard variant="bordered" style={{ padding: '32px' }}>
        <div className="flex items-start gap-4 mb-6">
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'rgba(139, 92, 246, 0.15)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              color: '#8b5cf6',
            }}
          >
            <Lock size={24} />
          </div>
          <div>
            <h3
              className="text-[18px] font-semibold mb-1"
              style={{ color: '#f0f0f5' }}
            >
              Change Password
            </h3>
            <p className="text-[14px]" style={{ color: '#6b7280' }}>
              Update your password to keep your account secure
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Current Password */}
          <div>
            <label
              htmlFor="currentPassword"
              className="block text-[13px] font-medium mb-2"
              style={{ color: '#6b7280' }}
            >
              Current Password
            </label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full text-[14px] border-0 outline-none transition-all duration-200"
              style={{
                padding: '12px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                color: '#f0f0f5',
              }}
              placeholder="Enter current password"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* New Password */}
            <div>
              <label
                htmlFor="newPassword"
                className="block text-[13px] font-medium mb-2"
                style={{ color: '#6b7280' }}
              >
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full text-[14px] border-0 outline-none transition-all duration-200"
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  color: '#f0f0f5',
                }}
                placeholder="Enter new password"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-[13px] font-medium mb-2"
                style={{ color: '#6b7280' }}
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full text-[14px] border-0 outline-none transition-all duration-200"
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  color: '#f0f0f5',
                }}
                placeholder="Confirm new password"
              />
            </div>
          </div>

          {/* Change Password Button */}
          <div className="flex items-center gap-3 pt-2">
            <NeuralButton
              variant="secondary"
              onClick={handleChangePassword}
              disabled={loading || !currentPassword || !newPassword || !confirmPassword}
            >
              Update Password
            </NeuralButton>
            {passwordMessage && (
              <span
                className="text-[13px]"
                style={{
                  color: passwordMessage.includes('success') ? '#10b981' : '#ef4444',
                }}
              >
                {passwordMessage}
              </span>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
