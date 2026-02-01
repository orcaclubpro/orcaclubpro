#!/usr/bin/env bun

/**
 * Comprehensive Build Script for Next.js + Payload CMS with Bun
 * 
 * This script handles:
 * - Environment validation
 * - Payload CMS type generation and migrations
 * - Next.js build process
 * - Production optimizations
 * - Error handling and logging
 */

import { $ } from 'bun';
import { existsSync } from 'fs';
import { join } from 'path';

// ANSI color codes for better console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Logging utilities
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  step: (msg) => console.log(`${colors.cyan}${colors.bright}→${colors.reset} ${msg}`)
};

// Build configuration
const config = {
  isProduction: process.env.NODE_ENV === 'production',
  skipMigrations: process.env.SKIP_MIGRATIONS === 'true',
  verbose: process.env.VERBOSE === 'true',
  useBunRuntime: process.env.USE_BUN_RUNTIME !== 'false' // Default to true
};

// Validation functions
function validateEnvironment() {
  log.step('Validating environment...');
  
  const requiredFiles = [
    'package.json',
    'next.config.mjs',
    'payload.config.ts'
  ];

  for (const file of requiredFiles) {
    if (!existsSync(file)) {
      log.error(`Required file missing: ${file}`);
      process.exit(1);
    }
  }

  log.success('Environment validation complete');
}

async function validateDependencies() {
  log.step('Validating dependencies...');

  try {
    const packageJson = JSON.parse(await Bun.file('package.json').text());
    const requiredDeps = [
      'next',
      'payload',
      '@payloadcms/next',
      '@payloadcms/db-mongodb'
    ];

    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    for (const dep of requiredDeps) {
      if (!allDeps[dep]) {
        log.error(`Required dependency missing: ${dep}`);
        process.exit(1);
      }
    }

    log.success('Dependencies validation complete');
  } catch (error) {
    log.error(`Failed to validate dependencies: ${error.message}`);
    process.exit(1);
  }
}

// Build steps
async function cleanBuild() {
  log.step('Cleaning previous build...');
  
  try {
    await $`rm -rf .next out node_modules/.cache`;
    log.success('Build artifacts cleaned');
  } catch (error) {
    log.warning('Some build artifacts could not be cleaned');
    if (config.verbose) {
      log.error(error.message);
    }
  }
}

async function generatePayloadTypes() {
  log.step('Generating Payload types...');
  
  try {
    const command = config.useBunRuntime 
      ? $`bun --bun payload generate:types`
      : $`bun payload generate:types`;
    
    await command;
    log.success('Payload types generated');
  } catch (error) {
    log.error(`Failed to generate Payload types: ${error.message}`);
    throw error;
  }
}

async function runPayloadMigrations() {
  if (config.skipMigrations) {
    log.warning('Skipping migrations (SKIP_MIGRATIONS=true)');
    return;
  }

  log.step('Running Payload migrations...');
  
  try {
    const command = config.useBunRuntime
      ? $`bun --bun payload migrate`
      : $`bun payload migrate`;
    
    await command;
    log.success('Payload migrations completed');
  } catch (error) {
    log.error(`Failed to run migrations: ${error.message}`);
    throw error;
  }
}

async function buildNextJs() {
  log.step('Building Next.js application...');
  
  try {
    const startTime = Date.now();
    
    const command = config.useBunRuntime
      ? $`bun --bun run next build`
      : $`bun run next build`;
    
    await command;
    
    const buildTime = ((Date.now() - startTime) / 1000).toFixed(2);
    log.success(`Next.js build completed in ${buildTime}s`);
  } catch (error) {
    log.error(`Failed to build Next.js application: ${error.message}`);
    throw error;
  }
}

async function optimizeForProduction() {
  if (!config.isProduction) {
    return;
  }

  log.step('Applying production optimizations...');
  
  try {
    // Set production environment variables
    process.env.NODE_ENV = 'production';
    
    // Verify .next directory was created
    if (!existsSync('.next')) {
      throw new Error('Next.js build output not found');
    }

    // Check for standalone build (if configured)
    if (existsSync('.next/standalone')) {
      log.info('Standalone build detected');
    }

    log.success('Production optimizations applied');
  } catch (error) {
    log.error(`Failed to apply production optimizations: ${error.message}`);
    throw error;
  }
}

// Main build function
async function main() {
  const startTime = Date.now();
  
  console.log(`${colors.magenta}${colors.bright}`);
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║              🚀 OrcaClubPro Build Script             ║');
  console.log('║                Next.js + Payload + Bun              ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`${colors.reset}`);
  
  log.info(`Build mode: ${config.isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  log.info(`Bun runtime: ${config.useBunRuntime ? 'ENABLED' : 'DISABLED'}`);
  log.info(`Skip migrations: ${config.skipMigrations ? 'YES' : 'NO'}`);
  
  try {
    // Validation phase
    validateEnvironment();
    await validateDependencies();
    
    // Build phase
    await cleanBuild();
    await generatePayloadTypes();
    await runPayloadMigrations();
    await buildNextJs();
    await optimizeForProduction();
    
    // Success
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n${colors.green}${colors.bright}✓ Build completed successfully in ${totalTime}s${colors.reset}\n`);
    
    // Next steps
    log.info('Next steps:');
    console.log(`  Development: ${colors.cyan}bun run dev${colors.reset}`);
    console.log(`  Production:  ${colors.cyan}bun run start${colors.reset}`);
    
  } catch (error) {
    console.log(`\n${colors.red}${colors.bright}✗ Build failed${colors.reset}`);
    
    if (config.verbose) {
      console.error('\nError details:');
      console.error(error);
    } else {
      log.error(error.message);
      log.info('Run with VERBOSE=true for more details');
    }
    
    process.exit(1);
  }
}

// Handle script arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Usage: bun run build.js [options]

Environment Variables:
  NODE_ENV=production     Build for production
  SKIP_MIGRATIONS=true    Skip database migrations
  USE_BUN_RUNTIME=false   Disable bun runtime for Next.js
  VERBOSE=true           Show detailed error information

Examples:
  bun run build.js                    # Development build
  NODE_ENV=production bun run build.js  # Production build
  SKIP_MIGRATIONS=true bun run build.js  # Skip migrations
`);
  process.exit(0);
}

// Run the build
main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
}); 