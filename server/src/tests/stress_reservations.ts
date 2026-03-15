import axios from 'axios';
import { randomUUID } from 'node:crypto';

// Configuration
const BASE_URL = 'http://localhost:3000';
const NUM_REQUESTS = 10;
const COURT_ID = '388e6357-128a-45c1-925f-223403d168bd'; // Replace with a valid ID from your DB
const CLUB_ID = 'e757a3e5-820d-4054-9549-063920dc7d8f';  // Replace with a valid ID
const TOKEN = 'YOUR_ADMIN_TOKEN'; // Replace after fetching

async function stressTest() {
    console.log('🚀 Starting stress test for reservation logic...');
    
    // 1. Prepare data
    const startAt = new Date();
    startAt.setHours(15, 0, 0, 0);
    startAt.setDate(startAt.getDate() + 1); // Tomorrow
    
    const endAt = new Date(startAt.getTime() + 60 * 60 * 1000); // 1 hour duration
    
    const payload = {
        courtIds: [COURT_ID],
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString()
    };

    const headers = {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
    };

    // 2. Fire concurrent requests
    console.log(`📡 Sending ${NUM_REQUESTS} concurrent /hold requests for ${startAt.toISOString()}...`);
    
    const startTime = Date.now();
    const promises = Array.from({ length: NUM_REQUESTS }).map(() => 
        axios.post(`${BASE_URL}/reservations/hold`, payload, { headers, validateStatus: () => true })
    );

    const responses = await Promise.all(promises);
    const duration = Date.now() - startTime;

    // 3. Analyze results
    const successes = responses.filter(r => r.status === 200 || r.status === 201);
    const conflicts = responses.filter(r => r.status === 409);
    const errors = responses.filter(r => r.status !== 200 && r.status !== 201 && r.status !== 409);

    console.log('\n📊 Stress Test Results:');
    console.log(`- Total Requests: ${NUM_REQUESTS}`);
    console.log(`- Time Taken: ${duration}ms`);
    console.log(`- ✅ Successes (Hold created): ${successes.length}`);
    console.log(`- ❌ Conflicts (409 expected): ${conflicts.length}`);
    console.log(`- ⚠️ Other Errors: ${errors.length}`);

    if (successes.length > 1) {
        console.error('\n🔥 CRITICAL FAILURE: More than one reservation held for the same time slot!');
    } else if (successes.length === 1) {
        console.log('\n💎 PASS: Race condition protection worked. Only 1 hold was accepted.');
    } else {
        console.log('\n❓ No holds were accepted. Check server state or credentials.');
    }
}

// stressTest();
console.log('To run this test:');
console.log('1. Get a valid token');
console.log('2. Replace token/ids in this script');
console.log('3. Run with: npx tsx server/src/tests/stress_reservations.ts');
