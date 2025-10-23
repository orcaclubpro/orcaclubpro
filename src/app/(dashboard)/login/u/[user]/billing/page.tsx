'use client';

import { use, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Download, ExternalLink, Loader2 } from 'lucide-react';

interface UserBillingPageProps {
  params: Promise<{ user: string }>;
}

export default function UserBillingPage({ params }: UserBillingPageProps) {
  const { user: userId } = use(params);
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/stripe/status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      });

      const { url, error } = await response.json();

      if (error) {
        alert('Error opening billing portal');
        return;
      }

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error(error);
      alert('Error opening billing portal');
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900/50 backdrop-blur-md rounded-2xl p-8 border border-gray-800"
      >
        <h2 className="text-2xl font-bold text-white mb-6">Billing & Subscription</h2>

        {status && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg">
              <div>
                <p className="text-sm text-gray-400">Current Plan</p>
                <p className="text-xl font-bold text-white capitalize">{status.tier}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                status.status === 'active' ? 'bg-green-500/20 text-green-400' :
                status.status === 'trialing' ? 'bg-blue-500/20 text-blue-400' :
                status.status === 'canceled' ? 'bg-red-500/20 text-red-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {status.status}
              </div>
            </div>

            {status.status !== 'free' && (
              <button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-700 text-white rounded-lg font-medium transition-all hover:shadow-lg hover:shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {portalLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Opening Portal...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 mr-2" />
                    Manage Subscription
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </>
                )}
              </button>
            )}

            {status.status === 'free' && (
              <a
                href="/pricing"
                className="w-full block py-3 bg-gradient-to-r from-cyan-600 to-blue-700 text-white rounded-lg font-medium transition-all hover:shadow-lg hover:shadow-cyan-500/30 text-center"
              >
                Upgrade to Pro
              </a>
            )}
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-900/50 backdrop-blur-md rounded-2xl p-8 border border-gray-800"
      >
        <h3 className="text-xl font-bold text-white mb-4">Recent Invoices</h3>
        <p className="text-gray-400 text-sm">Your invoice history will appear here.</p>
      </motion.div>
    </div>
  );
}
