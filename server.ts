import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { subDays, addDays, format, isAfter, parseISO, getHours } from 'date-fns';

// --- TYPES ---
interface Transaction {
  id: string;
  date: string;
  amount: number;
  merchant: string;
  category: string;
  isAnomaly: boolean;
  anomalyScore: number;
  isImpulse?: boolean;
}

// --- MOCK DATA ENGINE ---
let transactions: Transaction[] = [];

function generateMockData() {
  const merchants = [
    { name: 'Amazon', cat: 'Shopping' },
    { name: 'Uber', cat: 'Transport' },
    { name: 'Netflix', cat: 'Subscription' },
    { name: 'Apple', cat: 'Technology' },
    { name: 'Whole Foods', cat: 'Groceries' },
    { name: 'Starbucks', cat: 'Dining' },
    { name: 'Rent/Mortgage', cat: 'Housing' },
    { name: 'Electric Bill', cat: 'Utilities' },
  ];

  const now = new Date();
  const rawData: Transaction[] = [];

  for (let i = 0; i < 150; i++) {
    const randomDays = Math.floor(Math.random() * 90);
    const date = subDays(now, randomDays);
    const merchant = merchants[Math.floor(Math.random() * merchants.length)];
    
    // Fix specific times for "Impulse Buy" logic (Late night)
    const hours = Math.floor(Math.random() * 24);
    date.setHours(hours);

    let amount = Math.floor(Math.random() * 8000) + 800; // INR scaling
    
    // High-value outliers (for anomaly detection)
    if (Math.random() > 0.95) {
      amount = Math.floor(Math.random() * 80000) + 40000;
    }

    // Fixed recurring
    if (merchant.name === 'Rent/Mortgage') amount = 35000;
    if (merchant.name === 'Netflix') amount = 1299;

    rawData.push({
      id: `TX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      date: format(date, "yyyy-MM-dd'T'HH:mm:ss"),
      amount,
      merchant: merchant.name,
      category: merchant.cat,
      isAnomaly: false,
      anomalyScore: 0,
    });
  }

  // Inject Uber Double Charge
  const uberDate = subDays(now, 2);
  uberDate.setHours(14);
  const uberTx1: Transaction = {
    id: 'TX-UBER-1',
    date: format(uberDate, "yyyy-MM-dd'T'HH:mm:ss"),
    amount: 850.50,
    merchant: 'Uber',
    category: 'Transport',
    isAnomaly: false,
    anomalyScore: 0,
  };
  const uberTx2: Transaction = {
    ...uberTx1,
    id: 'TX-UBER-2',
    date: format(new Date(uberDate.getTime() + 15 * 60000), "yyyy-MM-dd'T'HH:mm:ss"), // 15 mins later
  };
  rawData.push(uberTx1, uberTx2);

  // Inject Late Night Amazon Impulse Buy
  const amazonDate = subDays(now, 1);
  amazonDate.setHours(2); // 2 AM
  rawData.push({
    id: 'TX-AMZ-IMPULSE',
    date: format(amazonDate, "yyyy-MM-dd'T'HH:mm:ss"),
    amount: 12500,
    merchant: 'Amazon',
    category: 'Shopping',
    isAnomaly: false,
    anomalyScore: 0,
  });

  return rawData.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
}

transactions = generateMockData();

// --- CUSTOM MATHEMATICAL LOGIC (Original Team-Built Engine) ---

/**
 * Custom "Z-Score" based Anomaly Detection
 * Detects magnitude outliers by calculating standard deviations from the historical mean.
 */
function calculateOriginalAnomalyLogic(txs: Transaction[]) {
  const amounts = txs.map(t => t.amount);
  const n = amounts.length;
  const mean = amounts.reduce((a, b) => a + b, 0) / n;
  const std = Math.sqrt(amounts.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / n);
  
  return txs.map(tx => {
    // Distance from mean in standard deviations
    const zScore = Math.abs(tx.amount - mean) / (std || 1);
    
    // Normalize score to 0.0 - 1.0 (Anomaly threshold > 0.65)
    // A Z-score of 3 or higher is a significant outlier
    const normalizedScore = Math.min(zScore / 4, 1); 

    return {
      ...tx,
      anomalyScore: parseFloat(normalizedScore.toFixed(4)),
      isAnomaly: normalizedScore > 0.65,
    };
  });
}

/**
 * Multi-Feature Heuristic Classifier (Impulse Detection)
 * Replaces commercial ML with a weighted decision logic based on circadian and category features.
 */
function calculateImpulseHeuristics(txs: Transaction[]) {
  return txs.map(tx => {
    const hour = getHours(parseISO(tx.date));
    let score = 0;

    // Feature 1: Circadian Risk (1AM - 5AM = High Probability)
    if (hour >= 1 && hour <= 5) score += 0.65;
    
    // Feature 2: High-Velocity Categories
    if (tx.category === 'Shopping' || tx.category === 'Technology') score += 0.15;
    
    // Feature 3: Magnitude Threshold
    if (tx.amount > 12000) score += 0.15;

    // Add a tiny bit of noise to simulate varied local training weights
    const probability = Math.min(score + (Math.random() * 0.05), 1); 
    
    return {
      ...tx,
      isImpulse: probability > 0.7,
      impulseProb: probability
    };
  });
}

// --- SERVER SETUP ---
async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const PORT = 3000;

  // Endpoints
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'operational', 
      timestamp: new Date().toISOString(),
      node: process.env.K_REVISION || 'development'
    });
  });

  app.get('/api/runway', (req, res) => {
    // Prediction: Balance / Avg daily spend
    const balance = 185000.00;
    const avgDailySpend = 4500.00;
    const daysRemaining = Math.floor(balance / avgDailySpend);
    const cashOutDate = format(addDays(new Date(), daysRemaining), "yyyy-MM-dd");
    
    // Generate projection data for the chart
    const projectionData = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const d = subDays(now, i);
      projectionData.push({
        day: format(d, 'MM.dd'),
        balance: balance + (i * avgDailySpend) // Mock historical trend
      });
    }
    for (let i = 1; i <= 7; i++) {
      const d = addDays(now, i);
      projectionData.push({
        day: format(d, 'MM.dd'),
        balance: Math.max(0, balance - (i * avgDailySpend)),
        projected: true
      });
    }

    res.json({
      days: daysRemaining,
      cashOutDate: cashOutDate,
      balance,
      dailyBurn: avgDailySpend,
      status: 'CRITICAL',
      lastUpdated: new Date().toISOString(),
      projectionData
    });
  });

  app.get('/api/transactions', (req, res) => {
    let analyzed = calculateOriginalAnomalyLogic(transactions);
    analyzed = calculateImpulseHeuristics(analyzed);
    res.json(analyzed);
  });

  app.get('/api/friction', (req, res) => {
    const analyzed = calculateImpulseHeuristics(transactions);
    const impulseBuys = analyzed.filter(tx => tx.isImpulse);
    res.json(impulseBuys);
  });

  app.get('/api/negotiate', (req, res) => {
    const subs = [
      {
        id: 'sub-1',
        provider: 'Adobe Creative Cloud',
        currentPrice: 3200,
        targetPrice: 1900,
        category: 'Creative Software',
        probability: 0.85,
        context: "User has been a subscriber for 3 years. Recently searched for 'Canva migration' and 'Adobe alternatives'. High usage of Photoshop but low usage of Premiere Pro. Competitor benchmark detected: ₹900/mo."
      },
      {
        id: 'sub-2',
        provider: 'AWS Cloud Services',
        currentPrice: 15400,
        targetPrice: 11200,
        category: 'Infrastructure',
        probability: 0.62,
        context: "Instance utilization at 45% during off-peak hours. Reserved instances expiring in 14 days. Strategic move to 'Savings Plans' or 'Spot Instances' recommended. Competitive pressure from Azure parity offers."
      },
      {
        id: 'sub-3',
        provider: 'Broadband Fiber',
        currentPrice: 2499,
        targetPrice: 1499,
        category: 'Utility',
        probability: 0.94,
        context: "New fiber nodes deployed in user's sector by Jio and ACT. Current provider has 99.2% uptime but price is 40% above market average. User is currently out of contract and eligible for parity correction."
      }
    ];
    res.json(subs);
  });

  app.get('/api/command', (req, res) => {
    res.json({
      activeAlerts: [
        { merchant: 'Uber Double Charge', threatSource: 'Transactional Anomaly', impact: 850.50 },
        { merchant: 'Amazon Prime Renewal', threatSource: 'Subscription Surge', impact: 1499.00 },
        { merchant: 'Late Night Shopping', threatSource: 'Impulse Probability', impact: 12500.00 }
      ]
    });
  });

  app.get('/api/dependency', (req, res) => {
    res.json({
      centralNode: "Main Checking",
      nodes: [
        { id: "Checking", label: "Main Checking", type: "core", val: 100 },
        { id: "Apple", label: "Apple", type: "ecosystem", val: 28.01 },
        { id: "Amazon", label: "Amazon", type: "ecosystem", val: 27.47 },
        { id: "Steam", label: "Steam", type: "ecosystem", val: 13.58 },
        { id: "Airbnb", label: "Airbnb", type: "service", val: 8.27 },
        { id: "DoorDash", label: "DoorDash", type: "service", val: 5.23 },
        { id: "Target", label: "Target", type: "service", val: 5.2 },
        { id: "Walmart", label: "Walmart", type: "service", val: 3.55 },
        { id: "Uber", label: "Uber", type: "service", val: 3.14 },
        { id: "Lyft", label: "Lyft", type: "service", val: 1.87 },
        { id: "Starbucks", label: "Starbucks", type: "service", val: 1.71 },
      ],
      links: [
        { source: "Checking", target: "Apple", weight: 0.95 },
        { source: "Checking", target: "Amazon", weight: 0.92 },
        { source: "Checking", target: "Steam", weight: 0.8 },
        { source: "Checking", target: "Airbnb", weight: 0.6 },
        { source: "Checking", target: "DoorDash", weight: 0.5 },
        { source: "Checking", target: "Target", weight: 0.55 },
        { source: "Checking", target: "Walmart", weight: 0.4 },
        { source: "Checking", target: "Uber", weight: 0.45 },
        { source: "Checking", target: "Lyft", weight: 0.3 },
        { source: "Checking", target: "Starbucks", weight: 0.2 },
        // Inter-dependencies
        { source: "Apple", target: "Starbucks", weight: 0.15 },
        { source: "Amazon", target: "Target", weight: 0.3 },
        { source: "Uber", target: "Lyft", weight: 0.4 },
        { source: "DoorDash", target: "Starbucks", weight: 0.25 },
      ],
      vendorLockInScore: 0.92,
      diversificationPlan: [
        { target: "Apple & Amazon", action: "High strategic concentration. Implement cross-platform node backup.", impact: 0.55 },
        { target: "Daily Nodes", action: "Rotate DoorDash/Starbucks use to secondary liquidity cards.", impact: 0.12 }
      ]
    });
  });

  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    console.log('Mode: Development (Vite Middleware)');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Mode: Production (Serving Static Files)');
    const distPath = path.resolve(process.cwd(), 'dist');
    
    // Check if dist exists (to avoid confusion during deployment)
    import('fs').then(fs => {
      if (!fs.existsSync(distPath)) {
        console.error('CRITICAL: dist directory not found! Run "npm run build" before starting the server.');
      }
    });

    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sentinel Backend Active: http://localhost:${PORT}`);
  });
}

startServer();
