'use client';

import { use } from 'react';
import { motion } from 'framer-motion';
import { CreditCard } from 'lucide-react';

interface UserBillingPageProps {
  params: Promise<{ user: string }>;
}

export default function UserBillingPage({ params }: UserBillingPageProps) {
  const { user: userId } = use(params);

  return (
    <div className="p-6 space-y-6 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900/50 backdrop-blur-md rounded-2xl p-8 border border-gray-800"
      >
        <h2 className="text-2xl font-bold text-white mb-6">Billing & Subscription</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg">
            <div>
              <p className="text-sm text-gray-400">Current Plan</p>
              <p className="text-xl font-bold text-white capitalize">Free</p>
            </div>
            <div className="px-3 py-1 rounded-full text-sm font-medium bg-gray-500/20 text-gray-400">
              Active
            </div>
          </div>

          <a
            href="/pricing"
            className="w-full block py-3 bg-gradient-to-r from-cyan-600 to-blue-700 text-white rounded-lg font-medium transition-all hover:shadow-lg hover:shadow-cyan-500/30 text-center"
          >
            View Pricing Plans
          </a>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-900/50 backdrop-blur-md rounded-2xl p-8 border border-gray-800"
      >
        <h3 className="text-xl font-bold text-white mb-4">Billing Information</h3>
        <p className="text-gray-400 text-sm">Billing features are currently unavailable.</p>
      </motion.div>
    </div>
  );
}
