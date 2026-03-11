import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

async function test(url, name) {
    console.log(`Testing ${name}...`);
    const client = new Client({ connectionString: url });
    try {
        await client.connect();
        console.log(`✅ ${name} connected successfully!`);
        await client.end();
    } catch (err) {
        console.error(`❌ ${name} failed:`, err.message);
    }
}

async function run() {
    await test(process.env.DATABASE_URL, 'DATABASE_URL (Pooler)');
    await test(process.env.DIRECT_URL, 'DIRECT_URL (Direct)');
}

run();
