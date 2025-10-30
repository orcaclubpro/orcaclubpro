'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const PRICING_TIERS = [
  {
    name: 'Free',
    price: '$0',
    features: [
      'Basic workspace access',
      '5 projects',
      'Community support',
      '1 GB storage',
    ],
  },
  {
    name: 'Basic',
    price: '$9',
    features: [
      'Everything in Free',
      'Unlimited projects',
      'Priority support',
      '10 GB storage',
      'Custom branding',
    ],
  },
  {
    name: 'Pro',
    price: '$29',
    features: [
      'Everything in Basic',
      'Advanced analytics',
      'Team collaboration',
      '100 GB storage',
      'API access',
      'Custom integrations',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    features: [
      'Everything in Pro',
      'Unlimited storage',
      'Dedicated support',
      'SLA guarantee',
      'Custom development',
      'On-premise deployment',
    ],
  },
];

export default function PricingPage() {
  const handleSubscribe = (tierName: string) => {
    // Navigate to contact or signup page
    console.log(`Selected tier: ${tierName}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-400">
            Select the perfect plan for your needs
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {PRICING_TIERS.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative bg-gray-900/50 backdrop-blur-md rounded-2xl p-8 border ${
                tier.popular
                  ? 'border-cyan-500 shadow-xl shadow-cyan-500/20'
                  : 'border-gray-800'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-white">{tier.price}</span>
                  {tier.price !== 'Custom' && <span className="text-gray-400 ml-2">/month</span>}
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <Check className="h-5 w-5 text-cyan-400 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(tier.name)}
                className={`w-full py-3 rounded-lg font-medium transition-all ${
                  tier.popular
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white hover:shadow-lg hover:shadow-cyan-500/30'
                    : 'bg-gray-800 text-white hover:bg-gray-700'
                }`}
              >
                {tier.price === 'Custom' ? (
                  'Contact Sales'
                ) : tier.price === '$0' ? (
                  'Get Started'
                ) : (
                  'Subscribe'
                )}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
