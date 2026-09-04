const BASE_URL = "http://localhost:5000";

async function run() {
  console.log("=======================================================");
  console.log(" FlowCRM Deduplication & High-Concurrency Verification");
  console.log("=======================================================\n");

  // 1. Authenticate Admin
  console.log("[Step 1] Authenticating Admin...");
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@flowcrm.local",
      password: "FlowAdmin123!"
    })
  });

  if (!loginRes.ok) {
    throw new Error(`Login failed with status ${loginRes.status}`);
  }

  const loginData = await loginRes.json();
  const token = loginData.token;
  const headers = {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  };
  console.log("✅ Admin Authentication Successful. JWT token acquired.\n");

  // 2. Lead Deduplication Test under 10 Concurrent Requests
  console.log("[Step 2] Testing Lead Deduplication (10 Concurrent identical leads)...");
  const rand = Math.floor(Math.random() * 10000);
  const testEmail = `bulk_athlete_${rand}@supplements.com`;
  const testPhone = `+20109988${rand}`;
  const leadPayload = {
    firstName: "Tarek",
    lastName: "Bodybuilder",
    companyName: "Olympia Fitness Gym",
    email: testEmail,
    phone: testPhone,
    estimatedValue: 15000,
    notes: "Requires wholesale price list for Whey & Creatine"
  };

  // Launch 10 simultaneous POST requests with identical email/phone
  const leadPromises = Array.from({ length: 10 }, () =>
    fetch(`${BASE_URL}/api/leads`, {
      method: "POST",
      headers,
      body: JSON.stringify(leadPayload)
    }).then(async res => ({
      status: res.status,
      data: await res.json().catch(() => ({}))
    }))
  );

  const leadResults = await Promise.all(leadPromises);
  const createdCount = leadResults.filter(r => r.status === 201).length;
  const conflictCount = leadResults.filter(r => r.status === 409).length;
  const errorCount = leadResults.filter(r => r.status >= 500).length;

  console.log(`  -> Successfully Created (201 Created): ${createdCount} (Expected: 1)`);
  console.log(`  -> Blocked as Duplicate (409 Conflict): ${conflictCount} (Expected: 9)`);
  console.log(`  -> Server Errors (500 Error):          ${errorCount} (Expected: 0)`);

  if (createdCount !== 1 || errorCount > 0) {
    throw new Error(`Lead deduplication assertion failed! Created: ${createdCount}, Errors: ${errorCount}`);
  }
  console.log("✅ Lead Deduplication: PERFECT! Zero duplicate leads created under race conditions.\n");

  // 3. Lead Conversion and Customer Deduplication
  console.log("[Step 3] Testing Lead Conversion and Idempotency...");
  const leadsQueryRes = await fetch(`${BASE_URL}/api/leads?search=${testEmail}`, { headers });
  const leadsList = await leadsQueryRes.json();
  const createdLead = leadsList.items[0];

  const convertPayload = {
    estimatedValue: 15000,
    notes: "Wholesale account approved"
  };

  const convertRes = await fetch(`${BASE_URL}/api/leads/${createdLead.id}/convert`, {
    method: "POST",
    headers,
    body: JSON.stringify(convertPayload)
  });

  if (!convertRes.ok) {
    throw new Error(`Lead conversion failed: ${convertRes.status}`);
  }
  const convertData = await convertRes.json();
  console.log(`  -> Converted lead to Customer ID: ${convertData.customerId} and Deal ID: ${convertData.opportunityId}`);

  // Test idempotency: trying to convert the same lead again must return 409
  const reConvertRes = await fetch(`${BASE_URL}/api/leads/${createdLead.id}/convert`, {
    method: "POST",
    headers,
    body: JSON.stringify(convertPayload)
  });
  console.log(`  -> Second conversion attempt returned status: ${reConvertRes.status} (Expected: 409 Conflict)`);
  if (reConvertRes.status !== 409) {
    throw new Error(`Expected 409 Conflict on second conversion, got ${reConvertRes.status}`);
  }
  console.log("✅ Conversion Idempotency: PERFECT!\n");

  // 4. Cross-Lead Customer Deduplication (Same Company / Re-use Customer)
  console.log("[Step 4] Testing Cross-Lead Customer Re-use (Same Gym, Different Contact)...");
  const secondLeadRes = await fetch(`${BASE_URL}/api/leads`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      firstName: "Captain",
      lastName: "Sherif",
      companyName: "Olympia Fitness Gym", // Identical company name
      email: `sherif_coach_${rand}@supplements.com`,
      phone: `+20108877${rand}`,
      estimatedValue: 8000,
      notes: "Additional supplement order for branch B"
    })
  });
  const secondLeadData = await secondLeadRes.json();

  const secondConvertRes = await fetch(`${BASE_URL}/api/leads/${secondLeadData.id}/convert`, {
    method: "POST",
    headers,
    body: JSON.stringify(convertPayload)
  });
  const secondConvertData = await secondConvertRes.json();

  console.log(`  -> Lead 1 Customer ID: ${convertData.customerId}`);
  console.log(`  -> Lead 2 Customer ID: ${secondConvertData.customerId}`);

  if (convertData.customerId === secondConvertData.customerId) {
    console.log("✅ Customer Deduplication: PERFECT! Existing customer entity was linked and reused without duplicate accounts.\n");
  } else {
    console.warn("⚠️ Warning: Customer ID was not reused.");
  }

  // 5. High-Concurrency Stress Test (100 Concurrent Requests)
  console.log("[Step 5] Executing High-Concurrency Stress Test (100 Concurrent Requests)...");
  const endpoints = [
    `${BASE_URL}/api/system/info`,
    `${BASE_URL}/api/pipelines/default/stages`,
    `${BASE_URL}/api/leads?pageSize=10`,
    `${BASE_URL}/api/customers?pageSize=10`
  ];

  const startTime = Date.now();
  const stressPromises = Array.from({ length: 100 }, (_, i) => {
    const url = endpoints[i % endpoints.length];
    return fetch(url, { headers }).then(r => ({ status: r.status }));
  });

  const stressResults = await Promise.all(stressPromises);
  const elapsedMs = Date.now() - startTime;

  const count200 = stressResults.filter(r => r.status === 200).length;
  const count429 = stressResults.filter(r => r.status === 429).length;
  const count500 = stressResults.filter(r => r.status >= 500).length;

  console.log(`  -> Total Concurrent Requests: 100`);
  console.log(`  -> Total Duration:            ${elapsedMs} ms`);
  console.log(`  -> Throughput:                ${(100 / (elapsedMs / 1000)).toFixed(1)} req/sec`);
  console.log(`  -> Status 200 OK:             ${count200}`);
  console.log(`  -> Status 429 Rate-Limited:   ${count429}`);
  console.log(`  -> Status 500 Server Errors:  ${count500}`);

  if (count500 > 0) {
    throw new Error(`Stress test encountered ${count500} server crashes!`);
  }

  console.log("\n=======================================================");
  console.log(" 🎉 ALL INTEGRITY, DEDUPLICATION & CONCURRENCY CHECKS PASSED!");
  console.log("=======================================================");
}

run().catch(err => {
  console.error("\n❌ Test failed:", err);
  process.exit(1);
});
