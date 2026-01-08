import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";

// Configure Neon WebSocket
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function applyMigration() {
  console.log("Applying database migration for categories...");
  
  try {
    // Add categories column to jobs table
    console.log("Adding categories column to jobs table...");
    await pool.query(`
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS categories TEXT[]
    `);
    
    // Migrate existing single category values to the new categories array
    console.log("Migrating existing category values to categories array...");
    await pool.query(`
      UPDATE jobs 
      SET categories = ARRAY[category] 
      WHERE category IS NOT NULL AND category != ''
    `);
    
    // Add categories column to job_seeker_profiles table
    console.log("Adding categories column to job_seeker_profiles table...");
    await pool.query(`
      ALTER TABLE job_seeker_profiles ADD COLUMN IF NOT EXISTS categories TEXT[]
    `);
    
    console.log("Migration completed successfully!");
    
    // Verify the changes
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name IN ('jobs', 'job_seeker_profiles') 
      AND column_name IN ('category', 'categories')
      ORDER BY table_name, column_name
    `);
    
    console.log("Current schema:");
    console.table(result.rows);
    
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration
applyMigration().catch(console.error);
