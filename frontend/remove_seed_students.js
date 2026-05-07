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
    const sqlPath = path.join(__dirname, '../backend/remove_seed_students.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log("Removing seed students...");
    await pool.query(sql);
    console.log("Seed students removed successfully!");

    // Verify
    const studentsRes = await pool.query('SELECT count(*) FROM public.students');
    const usersRes = await pool.query('SELECT count(*) FROM public.users');
    const mentorsRes = await pool.query("SELECT email, display_name FROM public.users WHERE role = 'mentor'");

    console.log("\nVerification:");
    console.log(`Students count: ${studentsRes.rows[0].count} (Expected: 0)`);
    console.log(`Total Users count: ${usersRes.rows[0].count} (Expected: 3 - Nischay, Varun, Shreyas)`);
    console.log("Remaining Mentors:");
    console.table(mentorsRes.rows);

  } catch (e) {
    console.error("Error during removal:", e);
  } finally {
    await pool.end();
  }
}

run();
