import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = 'postgresql://postgres:Shreyas@2593@db.radpjeksfeufuzmokpec.supabase.co:5432/postgres';
const pool = new pg.Pool({ connectionString });

async function run() {
  try {
    const sqlPath = path.join(__dirname, '../backend/clear_activity.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log("Cleaning up activity data...");
    await pool.query(sql);
    console.log("Activity data cleared successfully!");

    // Verify counts
    const attendanceRes = await pool.query('SELECT count(*) FROM public.attendance');
    const sessionsRes = await pool.query('SELECT count(*) FROM public.sessions');
    const materialsRes = await pool.query('SELECT count(*) FROM public.materials');
    const importLogRes = await pool.query('SELECT count(*) FROM public.import_log');
    const studentsRes = await pool.query('SELECT count(*) FROM public.students');
    const usersRes = await pool.query('SELECT count(*) FROM public.users');

    console.log("\nVerification:");
    console.log(`Attendance count: ${attendanceRes.rows[0].count} (Expected: 0)`);
    console.log(`Sessions count: ${sessionsRes.rows[0].count} (Expected: 0)`);
    console.log(`Materials count: ${materialsRes.rows[0].count} (Expected: 0)`);
    console.log(`Import Log count: ${importLogRes.rows[0].count} (Expected: 0)`);
    console.log(`Students count: ${studentsRes.rows[0].count} (Preserved)`);
    console.log(`Users count: ${usersRes.rows[0].count} (Preserved)`);

  } catch (e) {
    console.error("Error during cleanup:", e);
  } finally {
    await pool.end();
  }
}

run();
