export type Entity = 'CVP' | 'Freelance';
export type TransactionType = 'income' | 'expense';

// Expense Pillars & Categories
export type ExpensePillar = 'Taxes Paid' | 'Interest Expense' | 'Repairs' | 'Utilities' | 'Travels' | 'General Business';

export const EXPENSE_PILLARS: Record<ExpensePillar, string[]> = {
    'Taxes Paid': ['Excise', 'Local Income', 'Real Estate', 'Personal Property', 'Sales Tax', 'Federal Highway'],
    'Interest Expense': ['Loan Interest', 'Loan Principal'],
    'Repairs': ['Roof', 'Landscaping', 'Painting', 'Plumbing', 'Windows', 'Electrical', 'Furniture', 'Appliances', 'Extermination', 'Equipment', 'Cleaning', 'Parking Lot'],
    'Utilities': ['Water', 'Gas', 'Electricity', 'Phone', 'Cable', 'Internet'],
    'Travels': ['Auto & Travel', 'Business Meals (50% Deductible)', 'Travel Meals (50% Deductible)', 'Entertainment (Non-Deductible)'],
    'General Business': ['Advertising', 'Insurance', 'Legal/Professional Fees', 'Wages/Salaries', 'Other']
};

export interface Transaction {
    id: string;
    date: string;
    amount: number;
    type: TransactionType;
    entity: Entity;
    category: string;
    description: string;
    status: 'Pending' | 'Cleared' | 'Reconciled';
    // Phase 2 Fields
    source?: string; // For Income
    vendor?: string; // For Expense
    nySource?: boolean; // For Income
    receiptAvailable?: boolean; // For Expense
    notes?: string;
    // Phase 3 Fields
    pillar?: ExpensePillar; // For hierarchical expenses
    capitalize?: boolean; // For Repairs
    capitalizeUsefulLife?: number; // Depreciation period for capitalized improvements (default 27.5)
    property?: string; // For Utilities (Unit/Address)
    mileage?: number; // For Auto & Travel
    // Loan / Mortgage specific
    interest?: number; // Portion of amount that is interest
    principal?: number; // Portion of amount that is principal
    // Phase 4 Fields
    projectId?: string;
    projectName?: string; // Mapped from DB for inference
}

export interface Project {
    id: string;
    name: string;
    type: 'Property' | 'Client' | 'Generic';
    yearId: string; // Projects are scoped to a fiscal year folder
}

export interface Asset {
    id: string;
    name: string;
    type: 'Computer/Electronics' | 'Office Furniture' | 'Equipment' | 'Vehicle' | 'Property Improvement' | 'Other';
    purchaseDate: string; // "Date in service"
    cost: number; // Cost (net of land)
    land?: number; // Land value (non-depreciable)
    businessUsePercent: number;
    usefulLife: 3 | 5 | 7 | 15 | 27.5 | 39;
    method?: 'MACRS' | 'Straight Line' | 'S/L (Mid-Mo)' | 'S/L (Half-Yr)';
    convention?: 'HY' | 'MQ' | 'MM';
    section179: boolean;
    bonusDepreciation: boolean; // Special depreciation allowance
    priorDepreciation?: number; // Depreciation from previous years
    currentDepreciation?: number; // Manual entry for current year depreciation
    notes?: string;
    projectId?: string;
}

export const ASSET_TYPES = [
    'Computer/Electronics',
    'Office Furniture',
    'Equipment',
    'Vehicle',
    'Property Improvement',
    'Other'
] as const;

export const INCOME_CATEGORIES = [
    'Services',
    'Product Sales',
    'Rental Income',
    'Interest Income',
    'Other'
];

export const EXPENSE_CATEGORIES = [
    'Advertising',
    'Office Supplies',
    'Rent',
    'Utilities',
    'Software',
    'Insurance',
    'Legal/Accounting',
    'Repairs & Maintenance',
    'Meals',
    'Travel',
    'Vehicle Expense',
    'Bank Fees',
    'Contractor Payments',
    'Other'
];
