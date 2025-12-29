"use client"

import React from 'react'

export default function BeforeLogin() {
  return (
    <div className="mb-10 text-center">
      <div className="mb-6">
        <div className="text-3xl font-extralight mb-5 tracking-tight text-gray-400">
          Welcome to
        </div>
        <div className="flex items-center justify-center mb-3">
          <span className="text-6xl md:text-7xl font-bold text-white">ORCA</span>
          <span className="text-6xl md:text-7xl font-bold gradient-text">CLUB</span>
          <span className="text-base md:text-lg text-gray-400 font-light ml-3">est 2025</span>
        </div>
      </div>
      <p className="text-base text-gray-400 font-light">
        Content Management System
      </p>
    </div>
  )
}
