/**
 * Development Setup Script
 * This script helps with common development tasks:
 * 1. Creating a fresh database (dropping existing collections)
 * 2. Seeding initial data
 * 3. Creating a test admin user
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { connectToDatabase } = require('../database/db');
const User = require('../database/Models/userModel');
const Status = require('../database/Models/statusModel');
const Currency = require('../database/Models/currencyModel');
const PaymentMethod = require('../database/Models/paymentMethod');
const config = require('../config/config');
const logger = require('../utils/logger');

// Connect to database
connectToDatabase();

/**
 * Reset database - drops all collections
 */
async function resetDatabase() {
  logger.info('Starting database reset...');
  
  try {
    const collections = Object.keys(mongoose.connection.collections);
    
    for (const collectionName of collections) {
      const collection = mongoose.connection.collections[collectionName];
      await collection.drop();
      logger.info(`Dropped collection: ${collectionName}`);
    }
    
    logger.info('Database reset completed successfully');
  } catch (error) {
    logger.error('Error resetting database:', error);
    throw error;
  }
}

/**
 * Create initial data
 */
async function seedInitialData() {
  logger.info('Seeding initial data...');

  try {
    // Create status options
    const statusOptions = [
      { status: 'pending', color: '#FFA500', description: 'Pendiente de procesamiento' },
      { status: 'processing', color: '#1E90FF', description: 'En procesamiento' },
      { status: 'completed', color: '#32CD32', description: 'Completado' },
      { status: 'cancelled', color: '#FF0000', description: 'Cancelado' },
      { status: 'refunded', color: '#FF4500', description: 'Reembolsado' }
    ];
    
    const statuses = await Status.insertMany(statusOptions);
    logger.info(`Created ${statuses.length} status options`);
    
    // Create currencies
    const currencyOptions = [
      { name: 'Pesos Argentinos', code: 'ARS', symbol: '$', isDefault: true, image: 'pesos-argentinos.webp' },
      { name: 'US Dollar', code: 'USD', symbol: '$', image: 'usd.jpg' },
      { name: 'Euro', code: 'EUR', symbol: '€', image: 'eur.jpg' }
    ];
    
    const currencies = await Currency.insertMany(currencyOptions);
    logger.info(`Created ${currencies.length} currencies`);
    
    // Create payment methods
    const paymentOptions = [
      { name: 'Transferencia Bancaria', description: 'Transferencia a cuenta bancaria', isActive: true },
      { name: 'Mercado Pago', description: 'Pago mediante Mercado Pago', isActive: true },
      { name: 'Paypal', description: 'Pago mediante PayPal', isActive: true }
    ];
    
    const paymentMethods = await PaymentMethod.insertMany(paymentOptions);
    logger.info(`Created ${paymentMethods.length} payment methods`);
    
    return { statuses, currencies, paymentMethods };
  } catch (error) {
    logger.error('Error seeding initial data:', error);
    throw error;
  }
}

/**
 * Create admin user
 */
async function createAdminUser(existingOnly = false) {
  logger.info('Creating admin user...');
  
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    
    if (existingAdmin) {
      logger.info('Admin user already exists');
      return existingAdmin;
    }
    
    if (existingOnly) {
      logger.info('Skipping admin creation as requested');
      return null;
    }
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = new User({
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      isVerified: true,
      gold: 0
    });
    
    await adminUser.save();
    logger.info('Admin user created successfully');
    
    return adminUser;
  } catch (error) {
    logger.error('Error creating admin user:', error);
    throw error;
  }
}

/**
 * Run setup based on command line arguments
 */
async function runSetup() {
  try {
    const args = process.argv.slice(2);
    const shouldReset = args.includes('--reset');
    const seedOnly = args.includes('--seed-only');
    const adminOnly = args.includes('--admin-only');
    
    if (shouldReset) {
      await resetDatabase();
    }
    
    if (shouldReset || seedOnly) {
      await seedInitialData();
    }
    
    if (shouldReset || adminOnly) {
      await createAdminUser();
    } else {
      await createAdminUser(true);
    }
    
    logger.info('Setup completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
runSetup();