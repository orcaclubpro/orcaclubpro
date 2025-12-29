"use client"

import React from 'react'

export default function BeforeLogin() {
  return (
    <div className="mb-8 text-center">
      <div className="mb-4">
        <div className="text-2xl font-extralight mb-3 tracking-tight text-gray-400">
          Welcome to
        </div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-4xl md:text-5xl font-bold text-white">ORCA</span>
          <span className="text-4xl md:text-5xl font-bold gradient-text">CLUB</span>
          <span className="text-sm md:text-base text-gray-400 font-light">est 2025</span>
        </div>
      </div>
      <p className="text-sm text-gray-400 font-light">
        Content Management System
      </p>
    </div>
  )
}
