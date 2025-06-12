#!/usr/bin/env node

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const resetDatabase = async () => {
  try {
    console.log('🔄 Starting database reset...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chatapp');
    console.log('✅ Connected to MongoDB');

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log('ℹ️  Database is already empty');
    } else {
      console.log(`📋 Found ${collections.length} collection(s) to remove:`);
      
      // Drop all collections
      for (const collection of collections) {
        await mongoose.connection.db.dropCollection(collection.name);
        console.log(`   🗑️  Dropped: ${collection.name}`);
      }
      console.log('\n✅ Database reset completed successfully!');
    }

    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    console.log('\n🎉 Fresh database ready! You can now start with clean data.');
    
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
};

// Run the reset
resetDatabase();
