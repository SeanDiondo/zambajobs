import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";

// Configure Neon WebSocket
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function ensureCategoriesColumn() {
  try {
    // Check if categories column exists in jobs table
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'jobs' 
      AND column_name = 'categories'
    `);
    
    if (checkResult.rows.length === 0) {
      console.log("Adding categories column to jobs table...");
      await pool.query(`
        ALTER TABLE jobs ADD COLUMN categories TEXT[]
      `);
      
      // Migrate existing category values if category column exists
      const checkOldCategory = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'jobs' 
        AND column_name = 'category'
      `);
      
      if (checkOldCategory.rows.length > 0) {
        console.log("Migrating existing category values...");
        await pool.query(`
          UPDATE jobs 
          SET categories = ARRAY[category] 
          WHERE category IS NOT NULL AND category != ''
        `);
      }
    }
    
    // Check if categories column exists in jobSeekerProfiles table
    const checkProfileResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'jobSeekerProfiles' 
      AND column_name = 'categories'
    `);
    
    if (checkProfileResult.rows.length === 0) {
      console.log("Adding categories column to jobSeekerProfiles table...");
      await pool.query(`
        ALTER TABLE jobSeekerProfiles ADD COLUMN categories TEXT[]
      `);
    }
    
    console.log("Database schema is up to date!");
    
  } catch (error) {
    console.error("Error ensuring categories column:", error);
    // Don't throw error, just log it so the app can continue
  }
}
