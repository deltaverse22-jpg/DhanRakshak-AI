import express from 'express';
import cors from 'cors';
import { subDays, addDays, format, parseISO, getHours } from 'date-fns';

const app = express();
app.use(cors());
app.use(express.json());

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
    
    const hours = Math.floor(Math.random() * 24);
    date.setHours(hours);

    let amount = Math.floor(Math.random() * 8000) + 800; // INR scaling
    
    if (Math.random() > 0.95) {
      amount = Math.floor(Math.random() * 80000) + 40000;
    }

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
    date: format(new Date(uberDate.getTime() + 15 * 60000), "yyyy-MM-dd'T'HH:mm:ss"),
  };
  rawData.push(uberTx1, uberTx2);

  const amazonDate = subDays(now, 1);
  amazonDate.setHours(2);
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

const transactions = generateMockData();

// --- LOGIC ---
function calculateOriginalAnomalyLogic(txs: Transaction[]) {
  const amounts = txs.map(t => t.amount);
  const n = amounts.length;
  const mean = amounts.reduce((a, b) => a + b, 0) / n;
  const std = Math.sqrt(amounts.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / n);
  
  return txs.map(tx => {
    const zScore = Math.abs(tx.amount - mean) / (std || 1);
    const normalizedScore = Math.min(zScore / 4, 1); 
    return {
      ...tx,
      anomalyScore: parseFloat(normalizedScore.toFixed(4)),
      isAnomaly: normalizedScore > 0.65,
    };
  });
}

function calculateImpulseHeuristics(txs: Transaction[]) {
  return txs.map(tx => {
    const hour = getHours(parseISO(tx.date));
    let score = 0;
    if (hour >= 1 && hour <= 5) score += 0.65;
    if (tx.category === 'Shopping' || tx.category === 'Technology') score += 0.15;
    if (tx.amount > 12000) score += 0.15;
    const probability = Math.min(score + (Math.random() * 0.05), 1); 
    return {
      ...tx,
      isImpulse: probability > 0.7,
      impulseProb: probability
    };
  });
}

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'operational', 
    timestamp: new Date().toISOString(),
    node: process.env.VERCEL ? 'vercel-serverless' : 'local-node'
  });
});

app.get('/api/runway', (req, res) => {
  const balance = 185000.00;
  const avgDailySpend = 4500.00;
  const daysRemaining = Math.floor(balance / avgDailySpend);
  const cashOutDate = format(addDays(new Date(), daysRemaining), "yyyy-MM-dd");
  
  const projectionData = [];
  const now = new Date();
  for (let i = 7; i >= 0; i--) {
    const d = subDays(now, i);
    projectionData.push({
      day: format(d, 'MM.dd'),
      balance: balance + (i * avgDailySpend)
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
      context: "User has been a subscriber for 3 years. Strategy: Parity Adjustment."
    },
    {
      id: 'sub-2',
      provider: 'AWS Cloud Services',
      currentPrice: 15400,
      targetPrice: 11200,
      category: 'Infrastructure',
      probability: 0.62,
      context: "Strategic move to 'Savings Plans' recommended."
    },
    {
      id: 'sub-3',
      provider: 'Broadband Fiber',
      currentPrice: 2499,
      targetPrice: 1499,
      category: 'Utility',
      probability: 0.94,
      context: "Competitive pressure from local ISPs."
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
    ],
    links: [
      { source: "Checking", target: "Apple", weight: 0.95 },
      { source: "Checking", target: "Amazon", weight: 0.92 },
      { source: "Checking", target: "Steam", weight: 0.8 },
    ],
    vendorLockInScore: 0.92,
    diversificationPlan: [
      { target: "Apple & Amazon", action: "High strategic concentration.", impact: 0.55 }
    ]
  });
});

export default app;
