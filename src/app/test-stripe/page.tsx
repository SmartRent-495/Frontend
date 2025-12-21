"use client";

import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";

export default function TestStripePage() {
  const [results, setResults] = useState<any>({});

  useEffect(() => {
    testStripe();
  }, []);

  const testStripe = async () => {
    const tests: any = {};

    // Test 1: Check env vars
    tests.stripeKeyExists = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    tests.stripeKeyFormat = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_');
    tests.stripeKeyValue = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 20) + "...";
    tests.apiUrl = process.env.NEXT_PUBLIC_API_URL;

    // Test 2: Try loading Stripe
    try {
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
      tests.stripeLoaded = !!stripe;
      tests.stripeError = null;
    } catch (err: any) {
      tests.stripeLoaded = false;
      tests.stripeError = err.message;
    }

    // Test 3: Try creating a payment intent
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/test-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 100 })
      });
      
      if (response.ok) {
        const data = await response.json();
        tests.backendWorking = true;
        tests.clientSecretFormat = data.clientSecret?.substring(0, 30) + "...";
      } else {
        tests.backendWorking = false;
        tests.backendError = await response.text();
      }
    } catch (err: any) {
      tests.backendWorking = false;
      tests.backendError = err.message;
    }

    setResults(tests);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Stripe Configuration Test</h1>
      
      <div className="space-y-4">
        <TestResult 
          label="Stripe Key Exists" 
          value={results.stripeKeyExists} 
          detail={results.stripeKeyValue}
        />
        
        <TestResult 
          label="Stripe Key Format Valid (starts with pk_)" 
          value={results.stripeKeyFormat} 
        />
        
        <TestResult 
          label="Stripe Library Loaded" 
          value={results.stripeLoaded} 
          error={results.stripeError}
        />
        
        <TestResult 
          label="API URL Set" 
          value={!!results.apiUrl} 
          detail={results.apiUrl}
        />
        
        <TestResult 
          label="Backend Connection" 
          value={results.backendWorking} 
          error={results.backendError}
          detail={results.clientSecretFormat}
        />
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded">
        <h2 className="font-semibold mb-2">Full Results:</h2>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(results, null, 2)}
        </pre>
      </div>
    </div>
  );
}

function TestResult({ 
  label, 
  value, 
  error, 
  detail 
}: { 
  label: string; 
  value: boolean | undefined; 
  error?: string;
  detail?: string;
}) {
  return (
    <div className="border rounded p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium">{label}</span>
        <span className={`px-3 py-1 rounded text-sm ${
          value === true ? "bg-green-100 text-green-800" :
          value === false ? "bg-red-100 text-red-800" :
          "bg-gray-100 text-gray-800"
        }`}>
          {value === true ? "✓ Pass" : value === false ? "✗ Fail" : "..."}
        </span>
      </div>
      {detail && (
        <div className="text-sm text-gray-600">
          {detail}
        </div>
      )}
      {error && (
        <div className="text-sm text-red-600 mt-1">
          Error: {error}
        </div>
      )}
    </div>
  );
}