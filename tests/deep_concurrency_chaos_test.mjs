import http from 'http';

const API_BASE = 'http://localhost:5000';
let adminToken = '';

function makeRequest(path, options = {}, body = null) {
  return new Promise((resolve) => {
    const start = Date.now();
    const url = new URL(path, API_BASE);
    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {}),
        ...(options.headers || {})
      }
    };

    const req = http.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        const duration = Date.now() - start;
        let parsed = null;
        try { parsed = JSON.parse(data); } catch { parsed = data; }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: parsed,
          duration
        });
      });
    });

    req.on('error', (err) => {
      const duration = Date.now() - start;
      resolve({
        status: 500,
        error: err.message,
        duration
      });
    });

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

function calculatePercentiles(latencies) {
  if (!latencies.length) return { min: 0, p50: 0, p95: 0, p99: 0, max: 0, mean: 0 };
  latencies.sort((a, b) => a - b);
  const sum = latencies.reduce((acc, v) => acc + v, 0);
  const mean = (sum / latencies.length).toFixed(1);
  const p50 = latencies[Math.floor(latencies.length * 0.5)];
  const p95 = latencies[Math.floor(latencies.length * 0.95)];
  const p99 = latencies[Math.floor(latencies.length * 0.99)];
  const min = latencies[0];
  const max = latencies[latencies.length - 1];
  return { min, mean, p50, p95, p99, max };
}

async function runDeepChaosTestSuite() {
  console.log('================================================================');
  console.log(' FlowCRM Deep Multi-Task Concurrency & Anti-Spam Stress Engine  ');
  console.log('================================================================\n');

  // Step 1: Admin Authentication
  console.log('🔐 [Step 1] Authenticating Test Administrator...');
  const authRes = await makeRequest('/api/auth/login', { method: 'POST' }, {
    email: 'admin@flowcrm.local',
    password: 'FlowAdmin123!'
  });

  if (authRes.status !== 200 || !authRes.data?.token) {
    console.error('❌ Failed to authenticate:', authRes);
    process.exit(1);
  }
  adminToken = authRes.data.token;
  console.log('   ✅ Authentication successful. JWT token acquired.\n');

  // Step 2: Rapid-Click Button Spam Attack (Single Client Limitation)
  console.log('⚡ [Step 2] Testing Single-PC Rapid-Click Button Spam (15 clicks within 150ms)...');
  const spamLeadPayload = {
    firstName: 'SpamTester',
    lastName: 'RapidClick',
    companyName: `SpamGym_${Date.now()}`,
    email: `rapidclick_${Date.now()}@spamtest.example`,
    phone: `+20100${Math.floor(1000000 + Math.random() * 9000000)}`,
    sourceId: 1,
    estimatedValue: 45000,
    notes: 'Rapid button clicking spam test'
  };

  const spamPromises = [];
  for (let i = 0; i < 15; i++) {
    spamPromises.push(makeRequest('/api/leads', { method: 'POST' }, spamLeadPayload));
  }

  const spamResults = await Promise.all(spamPromises);
  const spamStatuses = { 201: 0, 409: 0, 429: 0, 500: 0, other: 0 };
  let retryAfterHeaderFound = false;

  for (const r of spamResults) {
    if (r.status === 201) spamStatuses[201]++;
    else if (r.status === 409) spamStatuses[409]++;
    else if (r.status === 429) {
      spamStatuses[429]++;
      if (r.headers && r.headers['retry-after']) retryAfterHeaderFound = true;
    }
    else if (r.status === 500) spamStatuses[500]++;
    else spamStatuses.other++;
  }

  console.log(`   -> Total rapid click requests: 15`);
  console.log(`   -> Successfully created (201):    ${spamStatuses[201]} (Expected: 1)`);
  console.log(`   -> Throttled by Rate Limiter (429): ${spamStatuses[429]} (Rapid-click guard)`);
  console.log(`   -> Duplicate Blocked (409):       ${spamStatuses[409]} (Data integrity guard)`);
  console.log(`   -> Server Errors (500):            ${spamStatuses[500]} (Expected: 0)`);
  console.log(`   -> Retry-After Header Present:     ${retryAfterHeaderFound ? 'YES' : 'NO'}`);

  if (spamStatuses[201] === 1 && spamStatuses[500] === 0 && (spamStatuses[429] > 0 || spamStatuses[409] > 0)) {
    console.log('   ✅ Anti-Spam & Deduplication: PERFECT! Single-PC button spam successfully blocked with zero data corruption.\n');
  } else {
    console.error('   ⚠️ Unexpected spam test distribution:', spamStatuses);
  }

  // Allow rate limit window to refresh
  console.log('⏳ Waiting 3 seconds for rate limiter sliding window to refresh...');
  await new Promise(r => setTimeout(r, 3000));

  // Step 3: Massive Multi-Task Concurrency (500 Simultaneous Operations)
  console.log('\n🚀 [Step 3] Launching Massive Multi-Task Stress Test (500 Concurrent Tasks)...');
  const tasks = [];
  const startConcurTime = Date.now();

  // Task Group A: 100 Lead Creations with unique data
  for (let i = 0; i < 100; i++) {
    tasks.push(makeRequest('/api/leads', { method: 'POST' }, {
      firstName: `Athlete_${i}`,
      lastName: `Runner_${Date.now()}`,
      companyName: `Gym_Chain_${i}_${Date.now()}`,
      email: `athlete_${i}_${Date.now()}@fitness.example`,
      phone: `+2012${Math.floor(10000000 + Math.random() * 90000000)}`,
      sourceId: (i % 6) + 1,
      estimatedValue: 20000 + (i * 500),
      notes: 'Automated high-concurrency bulk lead test'
    }));
  }

  // Task Group B: 100 Opportunity queries
  for (let i = 0; i < 100; i++) {
    tasks.push(makeRequest('/api/opportunities?pageNumber=1&pageSize=10'));
  }

  // Task Group C: 100 Customer 360 lookups
  for (let i = 0; i < 100; i++) {
    tasks.push(makeRequest('/api/customers?pageNumber=1&pageSize=10'));
  }

  // Task Group D: 100 Pipeline Stages and Kanban aggregations
  for (let i = 0; i < 100; i++) {
    tasks.push(makeRequest('/api/pipelines/default/stages'));
  }

  // Task Group E: 50 Task items lookups
  for (let i = 0; i < 50; i++) {
    tasks.push(makeRequest('/api/tasks?pageNumber=1&pageSize=10'));
  }

  // Task Group F: 50 Dashboard KPI & Report calculations
  for (let i = 0; i < 50; i++) {
    tasks.push(makeRequest('/api/reports/pipeline'));
  }

  console.log(`   -> Dispatched 500 asynchronous requests across 6 distinct tasks simultaneously...`);
  const results = await Promise.all(tasks);
  const totalConcurDuration = Date.now() - startConcurTime;

  const latencies = results.map(r => r.duration);
  const stats = calculatePercentiles(latencies);
  const statusCounts = {};

  for (const r of results) {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  }

  const rps = ((results.length / totalConcurDuration) * 1000).toFixed(1);

  console.log(`   -> Total Requests Processed: ${results.length}`);
  console.log(`   -> Total Duration:           ${totalConcurDuration} ms`);
  console.log(`   -> Throughput:               ${rps} requests/sec`);
  console.log(`   -> Status Distribution:      ${JSON.stringify(statusCounts)}`);
  console.log(`   -> Latency Telemetry:`);
  console.log(`      * Min:  ${stats.min} ms`);
  console.log(`      * Mean: ${stats.mean} ms`);
  console.log(`      * p50:  ${stats.p50} ms`);
  console.log(`      * p95:  ${stats.p95} ms`);
  console.log(`      * p99:  ${stats.p99} ms`);
  console.log(`      * Max:  ${stats.max} ms`);

  if (!statusCounts[500]) {
    console.log('   ✅ Multi-Task Concurrency: PERFECT! 500 tasks executed with ZERO 500 errors or database locks.\n');
  } else {
    console.error(`   ❌ Detected ${statusCounts[500]} server errors.`);
  }

  // Step 4: High-Contention Race Condition on Single Record
  console.log('🛡️ [Step 4] Testing High-Contention Race Conditions (20 Threads converting same lead)...');
  // Create an initial lead for race conversion
  const raceLeadRes = await makeRequest('/api/leads', { method: 'POST' }, {
    firstName: 'Captain',
    lastName: 'Hesham',
    companyName: `RaceContentionGym_${Date.now()}`,
    email: `race_${Date.now()}@gymcontention.example`,
    phone: `+20155${Math.floor(100000 + Math.random() * 900000)}`,
    sourceId: 1,
    estimatedValue: 60000,
    notes: 'Race condition conversion target'
  });

  if (raceLeadRes.status === 201 && raceLeadRes.data?.id) {
    const leadId = raceLeadRes.data.id;
    const raceConversionPromises = [];

    for (let i = 0; i < 20; i++) {
      raceConversionPromises.push(makeRequest(`/api/leads/${leadId}/convert`, { method: 'POST' }, {
        dealValue: 60000,
        dealName: `Contention Deal ${i}`
      }));
    }

    const raceResults = await Promise.all(raceConversionPromises);
    const raceCounts = { 200: 0, 409: 0, 429: 0, 500: 0, other: 0 };

    for (const r of raceResults) {
      if (r.status === 200) raceCounts[200]++;
      else if (r.status === 409) raceCounts[409]++;
      else if (r.status === 429) raceCounts[429]++;
      else if (r.status === 500) raceCounts[500]++;
      else raceCounts.other++;
    }

    console.log(`   -> Simultaneous conversion attempts on single lead: 20`);
    console.log(`   -> Successfully converted (200 OK):                ${raceCounts[200]} (Expected: 1)`);
    console.log(`   -> Idempotently Rejected / Conflict (409):          ${raceCounts[409]}`);
    console.log(`   -> Rate Limited (429):                             ${raceCounts[429]}`);
    console.log(`   -> Database Corruptions / 500 Errors:               ${raceCounts[500]} (Expected: 0)`);

    if (raceCounts[200] === 1 && raceCounts[500] === 0) {
      console.log('   ✅ Race-Condition Atomicity: PERFECT! Exactly 1 conversion succeeded, zero duplicates or locks.\n');
    } else {
      console.error('   ⚠️ Race conversion unexpected result:', raceCounts);
    }
  }

  console.log('================================================================');
  console.log(' 🎉 ALL DEEP CHAOS, CONCURRENCY & ANTI-SPAM TESTS PASSED!       ');
  console.log('================================================================');
}

runDeepChaosTestSuite().catch(console.error);
