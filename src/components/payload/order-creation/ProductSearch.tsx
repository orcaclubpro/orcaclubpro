'use client'

import React, { useState, useEffect } from 'react'
import { Search, Package, Plus, DollarSign } from 'lucide-react'
import Image from 'next/image'

interface ShopifyVariant {
  id: string
  title: string
  sku: string | null
  price: string
  inventoryQuantity: number
  availableForSale: boolean
  displayName: string
}

interface ShopifyProduct {
  id: string
  title: string
  description: string
  image?: {
    url: string
    alt: string
  }
  priceRange: {
    min: { amount: string; currency: string }
    max: { amount: string; currency: string }
  }
  variants: ShopifyVariant[]
}

export interface LineItem {
  variantId?: string
  title: string
  quantity: number
  originalUnitPrice: number
  isCustom: boolean
}

interface ProductSearchProps {
  onAddToCart: (item: LineItem) => void
}

export default function ProductSearch({ onAddToCart }: ProductSearchProps) {
  const [products, setProducts] = useState<ShopifyProduct[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCustomForm, setShowCustomForm] = useState(false)

  // Custom service form state
  const [customTitle, setCustomTitle] = useState('')
  const [customQuantity, setCustomQuantity] = useState(1)
  const [customPrice, setCustomPrice] = useState('')

  // Fetch products on mount and when search term changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        fetchProducts(`title:${searchTerm}`)
      } else {
        fetchProducts()
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  async function fetchProducts(query?: string) {
    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams({ limit: '20' })
      if (query) params.append('query', query)

      const response = await fetch(`/api/shopify/products?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }

      const data = await response.json()
      setProducts(data.products || [])
    } catch (err) {
      console.error('[Product Search] Error:', err)
      setError('Failed to load products. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleAddProduct(product: ShopifyProduct, variant: ShopifyVariant) {
    const lineItem: LineItem = {
      variantId: variant.id,
      title: `${product.title} - ${variant.title}`,
      quantity: 1,
      originalUnitPrice: parseFloat(variant.price),
      isCustom: false,
    }
    onAddToCart(lineItem)
  }

  function handleAddCustomService() {
    if (!customTitle.trim() || !customPrice || parseFloat(customPrice) <= 0) {
      alert('Please fill in all custom service fields with valid values')
      return
    }

    const lineItem: LineItem = {
      title: customTitle,
      quantity: customQuantity,
      originalUnitPrice: parseFloat(customPrice),
      isCustom: true,
    }

    onAddToCart(lineItem)

    // Reset form
    setCustomTitle('')
    setCustomQuantity(1)
    setCustomPrice('')
    setShowCustomForm(false)
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-700">
        <button
          onClick={() => setShowCustomForm(false)}
          className={`pb-3 px-4 font-medium transition-colors ${
            !showCustomForm
              ? 'border-b-2 border-blue-500 text-blue-400'
              : 'text-gray-400 hover:text-gray-100'
          }`}
        >
          Shopify Products
        </button>
        <button
          onClick={() => setShowCustomForm(true)}
          className={`pb-3 px-4 font-medium transition-colors ${
            showCustomForm
              ? 'border-b-2 border-blue-500 text-blue-400'
              : 'text-gray-400 hover:text-gray-100'
          }`}
        >
          Custom Services
        </button>
      </div>

      {/* Shopify Products Tab */}
      {!showCustomForm && (
        <div className="space-y-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 text-red-300">
              {error}
            </div>
          )}

          {/* Products List */}
          {!loading && !error && (
            <div className="flex flex-col gap-4 max-h-96 overflow-y-auto p-1">
              {products.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No products found. Try a different search term.
                </div>
              ) : (
                products.map((product) => {
                  // Use the first available variant for card click
                  const defaultVariant = product.variants.find(v => v.availableForSale) || product.variants[0]
                  const hasMultipleVariants = product.variants.length > 1

                  return (
                    <button
                      key={product.id}
                      onClick={() => defaultVariant.availableForSale && handleAddProduct(product, defaultVariant)}
                      disabled={!defaultVariant.availableForSale}
                      className="bg-gray-800 border border-gray-600 rounded-lg p-4 hover:border-blue-500 hover:bg-gray-700/50 transition-all w-full text-left disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-600 disabled:hover:bg-gray-800"
                    >
                      <div className="flex gap-4">
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          {product.image ? (
                            <Image
                              src={product.image.url}
                              alt={product.image.alt}
                              width={80}
                              height={80}
                              className="rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-20 h-20 bg-gray-700 rounded-lg flex items-center justify-center">
                              <Package className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-100 mb-1 truncate">
                            {product.title}
                          </h3>
                          <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                            {product.description || 'No description'}
                          </p>

                          {/* Price and Variant Info */}
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-400">
                                {hasMultipleVariants ? `${product.variants.length} variants` : defaultVariant.displayName}
                              </p>
                              <p className="text-lg font-semibold text-gray-100 flex items-center gap-1 mt-1">
                                <DollarSign className="w-4 h-4" />
                                {parseFloat(defaultVariant.price).toFixed(2)}
                              </p>
                            </div>
                            {defaultVariant.availableForSale && (
                              <span className="text-sm text-blue-400">
                                Click to add →
                              </span>
                            )}
                            {!defaultVariant.availableForSale && (
                              <span className="text-sm text-gray-500">
                                Unavailable
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* Custom Services Tab */}
      {showCustomForm && (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-gray-100 mb-4">Add Custom Service</h3>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Service Name *
            </label>
            <input
              type="text"
              placeholder="e.g., Web Design Consulting"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Quantity *
              </label>
              <input
                type="number"
                min="1"
                value={customQuantity}
                onChange={(e) => setCustomQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Unit Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <button
            onClick={handleAddCustomService}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Add to Cart
          </button>
        </div>
      )}
    </div>
  )
}
