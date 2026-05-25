// Simple static plan definitions. Extend to DB-driven plans if needed.
module.exports = [
  { id: 'plan_monthly', name: 'Monthly', amount: 1999, currency: 'INR', durationDays: 30 },
  { id: 'plan_quarter', name: 'Quarterly', amount: 4999, currency: 'INR', durationDays: 90 },
  { id: 'plan_yearly', name: 'Yearly', amount: 17999, currency: 'INR', durationDays: 365 },
  { id: 'plan_trial_1', name: 'Trial Plan', amount: 1, currency: 'INR', durationDays: 1 },
  { id: 'plan_expiry_2', name: 'Testing Expiry', amount: 10, currency: 'INR', durationDays: 2 }
];
