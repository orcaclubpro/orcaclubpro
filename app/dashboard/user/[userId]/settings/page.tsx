'use client';

import { useState, ElementType } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  CreditCard,
  Mail,
  Phone,
  MapPin,
  Camera,
  Save,
  Eye,
  EyeOff,
  Check,
  Moon,
  Sun,
  Monitor,
  AlertTriangle,
  Settings as SettingsIcon,
  ChevronRight
} from 'lucide-react';

interface SettingsPageProps {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  params: Promise<{ userId: string }>; // Keep for potential future use, but disable linting for now
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12
    }
  }
};

const cardVariants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

const ToggleSwitch = ({ enabled, onChange, label }: { enabled: boolean; onChange: (value: boolean) => void; label: string }) => {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      <motion.button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
        }`}
        whileTap={{ scale: 0.95 }}
      >
        <motion.span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </motion.button>
    </div>
  );
};

const InputField = ({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  icon: Icon,
  error 
}: { 
  label: string; 
  type?: string; 
  value: string; 
  onChange: (value: string) => void; 
  placeholder?: string;
  icon?: ElementType;
  error?: string;
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        )}
        <motion.input
          type={type === 'password' && showPassword ? 'text' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} ${type === 'password' ? 'pr-10' : 'pr-4'} py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
            error ? 'border-red-500 focus:ring-red-500' : ''
          }`}
          animate={{
            scale: isFocused ? 1.02 : 1,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        />
        {type === 'password' && (
          <motion.button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </motion.button>
        )}
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-600 dark:text-red-400"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};

export default function SettingsPage({ /* params */ }: SettingsPageProps) {
  // const { userId } = await params; // userId extraction removed as it's unused and params is not awaited
  
  // Profile settings
  const [profile, setProfile] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    company: 'Acme Corp',
    location: 'San Francisco, CA',
    bio: 'Full-stack developer with 5+ years of experience in React and Node.js'
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    projectUpdates: true,
    invoiceReminders: true,
    marketingEmails: false,
    weeklyReports: true
  });

  // Security settings
  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    loginAlerts: true,
    sessionTimeout: '30',
    passwordExpiry: '90'
  });

  // Appearance settings
  const [appearance, setAppearance] = useState({
    theme: 'system',
    language: 'en',
    timezone: 'America/Los_Angeles',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD'
  });

  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'billing', label: 'Billing', icon: CreditCard }
  ];

  const handleSave = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const renderProfileSettings = () => (
    <motion.div variants={cardVariants} className="space-y-6">
      <div className="flex items-center space-x-6">
        <div className="relative">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold cursor-pointer"
          >
            {profile.firstName[0]}{profile.lastName[0]}
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full shadow-lg"
          >
            <Camera className="h-4 w-4" />
          </motion.button>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {profile.firstName} {profile.lastName}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">{profile.email}</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">{profile.company}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField
          label="First Name"
          value={profile.firstName}
          onChange={(value) => setProfile({ ...profile, firstName: value })}
          icon={User}
        />
        <InputField
          label="Last Name"
          value={profile.lastName}
          onChange={(value) => setProfile({ ...profile, lastName: value })}
          icon={User}
        />
        <InputField
          label="Email"
          type="email"
          value={profile.email}
          onChange={(value) => setProfile({ ...profile, email: value })}
          icon={Mail}
        />
        <InputField
          label="Phone"
          value={profile.phone}
          onChange={(value) => setProfile({ ...profile, phone: value })}
          icon={Phone}
        />
        <InputField
          label="Company"
          value={profile.company}
          onChange={(value) => setProfile({ ...profile, company: value })}
        />
        <InputField
          label="Location"
          value={profile.location}
          onChange={(value) => setProfile({ ...profile, location: value })}
          icon={MapPin}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
          Bio
        </label>
        <motion.textarea
          value={profile.bio}
          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          rows={4}
          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Tell us about yourself..."
          whileFocus={{ scale: 1.01 }}
        />
      </div>
    </motion.div>
  );

  const renderNotificationSettings = () => (
    <motion.div variants={cardVariants} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Email Notifications
        </h3>
        <div className="space-y-4">
          <ToggleSwitch
            enabled={notifications.emailNotifications}
            onChange={(value) => setNotifications({ ...notifications, emailNotifications: value })}
            label="Email notifications"
          />
          <ToggleSwitch
            enabled={notifications.projectUpdates}
            onChange={(value) => setNotifications({ ...notifications, projectUpdates: value })}
            label="Project updates"
          />
          <ToggleSwitch
            enabled={notifications.invoiceReminders}
            onChange={(value) => setNotifications({ ...notifications, invoiceReminders: value })}
            label="Invoice reminders"
          />
          <ToggleSwitch
            enabled={notifications.weeklyReports}
            onChange={(value) => setNotifications({ ...notifications, weeklyReports: value })}
            label="Weekly reports"
          />
          <ToggleSwitch
            enabled={notifications.marketingEmails}
            onChange={(value) => setNotifications({ ...notifications, marketingEmails: value })}
            label="Marketing emails"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Push Notifications
        </h3>
        <div className="space-y-4">
          <ToggleSwitch
            enabled={notifications.pushNotifications}
            onChange={(value) => setNotifications({ ...notifications, pushNotifications: value })}
            label="Push notifications"
          />
        </div>
      </div>
    </motion.div>
  );

  const renderSecuritySettings = () => (
    <motion.div variants={cardVariants} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Authentication
        </h3>
        <div className="space-y-4">
          <ToggleSwitch
            enabled={security.twoFactorAuth}
            onChange={(value) => setSecurity({ ...security, twoFactorAuth: value })}
            label="Two-factor authentication"
          />
          <ToggleSwitch
            enabled={security.loginAlerts}
            onChange={(value) => setSecurity({ ...security, loginAlerts: value })}
            label="Login alerts"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Session Management
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Session timeout (minutes)
            </label>
            <select
              value={security.sessionTimeout}
              onChange={(e) => setSecurity({ ...security, sessionTimeout: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="120">2 hours</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Password expiry (days)
            </label>
            <select
              value={security.passwordExpiry}
              onChange={(e) => setSecurity({ ...security, passwordExpiry: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="30">30 days</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
              <option value="never">Never</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Security Recommendation
            </h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              Enable two-factor authentication for enhanced account security.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderAppearanceSettings = () => (
    <motion.div variants={cardVariants} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Theme
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { id: 'light', label: 'Light', icon: Sun },
            { id: 'dark', label: 'Dark', icon: Moon },
            { id: 'system', label: 'System', icon: Monitor }
          ].map((theme) => (
            <motion.button
              key={theme.id}
              onClick={() => setAppearance({ ...appearance, theme: theme.id })}
              className={`p-4 rounded-lg border-2 transition-all ${
                appearance.theme === theme.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <theme.icon className={`h-6 w-6 mx-auto mb-2 ${
                appearance.theme === theme.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
              }`} />
              <p className={`text-sm font-medium ${
                appearance.theme === theme.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
              }`}>
                {theme.label}
              </p>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Language
          </label>
          <select
            value={appearance.language}
            onChange={(e) => setAppearance({ ...appearance, language: e.target.value })}
            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Timezone
          </label>
          <select
            value={appearance.timezone}
            onChange={(e) => setAppearance({ ...appearance, timezone: e.target.value })}
            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="America/Los_Angeles">Pacific Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/New_York">Eastern Time</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Date Format
          </label>
          <select
            value={appearance.dateFormat}
            onChange={(e) => setAppearance({ ...appearance, dateFormat: e.target.value })}
            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Currency
          </label>
          <select
            value={appearance.currency}
            onChange={(e) => setAppearance({ ...appearance, currency: e.target.value })}
            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="JPY">JPY (¥)</option>
          </select>
        </div>
      </div>
    </motion.div>
  );

  const renderBillingSettings = () => (
    <motion.div variants={cardVariants} className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Current Plan
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Professional Plan - $29/month
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg"
          >
            Upgrade Plan
          </motion.button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Payment Methods
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <CreditCard className="h-6 w-6 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  •••• •••• •••• 4242
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Expires 12/25
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 text-xs rounded-full">
                Default
              </span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <SettingsIcon className="h-4 w-4" />
              </motion.button>
            </div>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
        >
          + Add Payment Method
        </motion.button>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Billing History
        </h3>
        <div className="space-y-3">
          {[
            { date: '2024-01-01', amount: '$29.00', status: 'Paid' },
            { date: '2023-12-01', amount: '$29.00', status: 'Paid' },
            { date: '2023-11-01', amount: '$29.00', status: 'Paid' }
          ].map((invoice, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {invoice.date}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Professional Plan
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="font-medium text-gray-900 dark:text-white">
                  {invoice.amount}
                </span>
                <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 text-xs rounded-full">
                  {invoice.status}
                </span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  Download
                </motion.button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileSettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'security':
        return renderSecuritySettings();
      case 'appearance':
        return renderAppearanceSettings();
      case 'billing':
        return renderBillingSettings();
      default:
        return renderProfileSettings();
    }
  };

  return (
    <div className="p-6 min-h-screen">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your account preferences and settings
            </p>
          </div>
          
          <AnimatePresence>
            {saveSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center space-x-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 px-4 py-2 rounded-lg"
              >
                <Check className="h-5 w-5" />
                <span>Settings saved!</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all ${
                      activeTab === tab.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <tab.icon className="h-5 w-5" />
                    <span className="font-medium">{tab.label}</span>
                    <ChevronRight className={`h-4 w-4 ml-auto transition-transform ${
                      activeTab === tab.id ? 'rotate-90' : ''
                    }`} />
                  </motion.button>
                ))}
              </nav>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div variants={itemVariants} className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderTabContent()}
                </motion.div>
              </AnimatePresence>

              {/* Save Button */}
              <motion.div
                variants={itemVariants}
                className="flex justify-end mt-8 pt-6 border-t border-gray-200 dark:border-gray-700"
              >
                <motion.button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-all duration-200"
                  whileHover={{ scale: isLoading ? 1 : 1.05 }}
                  whileTap={{ scale: isLoading ? 1 : 0.95 }}
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <Save className="h-5 w-5" />
                  )}
                  <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
} 