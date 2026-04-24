# 🧠 Autonome: Custom ML Integration Guide

Since you are "building it yourself" and avoiding third-party inference APIs, follow this guide to bridge your locally trained AI models into the Autonome sentinel.

## 1. Local Training (Your PC)
Train your model using **Scikit-learn**, **PyTorch**, or **TensorFlow**. 
Example: A Random Forest Classifier for "Impulse Buying" trained on your personal banking CSV.

## 2. Exporting Model Weights
Don't export the whole "pickle" file if you want a lightweight web integration. Instead, export the **learned weights** or **decision boundaries** as JSON.

```python
# Python Example (Local PC)
import json
import numpy as np

# Assuming 'model' is your trained RandomForest
# Export important decision thresholds or feature weights
model_data = {
    "feature_weights": model.feature_importances_.tolist(),
    "intercept": model.intercept_.tolist(),
    "scaling_factor": 1.42
}

with open('model_weights.json', 'w') as f:
    json.dump(model_data, f)
```

## 3. Integration Into Autonome
1. **Upload** your `model_weights.json` to the root of this project.
2. **Import** it in `server.ts`.
3. **Implement** the inference math using the imported weights.

```typescript
// server.ts (App Integration)
import modelWeights from './model_weights.json';

function runCustomInference(tx) {
  // Use the weights you trained on your PC
  const score = (tx.amount * modelWeights.feature_weights[0]) + modelWeights.intercept;
  return score > 0.8; 
}
```

## 4. Why This Matters
By building the math yourself inside `server.ts`, you comply with the rule of **Original Intelligence**. Your app works offline, costs zero in API fees, and is 100% private.

---
**Current Sentinel Version:** v2.0.4 
**Logic Status:** CUSTOM_HEURISTIC_v1 (Active)
