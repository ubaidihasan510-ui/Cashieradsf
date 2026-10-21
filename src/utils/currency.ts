import { CurrencyCode, CurrencyConfig, Fund, FundAllocationSplit } from '../types/finance.ts';

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  BDT: { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', position: 'prefix' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', position: 'prefix' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', position: 'prefix' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', position: 'prefix' },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', position: 'prefix' },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', position: 'prefix' },
  AUD: { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar', position: 'prefix' },
};

/**
 * Converts a standard decimal amount (e.g. 50000 or 50000.50) into integer minor units (e.g. 5000000).
 */
export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Converts minor units back to standard float.
 */
export function fromMinorUnits(minorUnits: number): number {
  return minorUnits / 100;
}

/**
 * Formats minor units into formatted currency string.
 * Example: 5000000 -> "৳50,000" or "৳50,000.00"
 */
export function formatCurrency(
  minorUnits: number,
  currencyCode: CurrencyCode = 'BDT',
  includeDecimals: boolean = false
): string {
  const config = CURRENCIES[currencyCode] || CURRENCIES.BDT;
  const isNegative = minorUnits < 0;
  const absoluteMinor = Math.abs(minorUnits);
  const major = fromMinorUnits(absoluteMinor);

  const formattedNumber = major.toLocaleString('en-US', {
    minimumFractionDigits: includeDecimals ? 2 : (major % 1 !== 0 ? 2 : 0),
    maximumFractionDigits: 2,
  });

  const sign = isNegative ? '-' : '';
  if (config.position === 'prefix') {
    return `${sign}${config.symbol}${formattedNumber}`;
  } else {
    return `${sign}${formattedNumber} ${config.symbol}`;
  }
}

/**
 * Calculate exact fund allocation breakdown for an income amount in minor units.
 * Guarantees zero penny-rounding drift:
 * sum(allocations) + unallocatedAmount === totalIncomeAmount.
 */
export function calculateAllocations(
  totalIncomeMinor: number,
  ruleItems: { fundId: string; percentage: number }[],
  funds: Fund[]
): {
  splits: FundAllocationSplit[];
  totalAllocatedMinor: number;
  unallocatedMinor: number;
} {
  if (totalIncomeMinor <= 0 || ruleItems.length === 0) {
    return { splits: [], totalAllocatedMinor: 0, unallocatedMinor: Math.max(0, totalIncomeMinor) };
  }

  const fundMap = new Map(funds.map((f) => [f.id, f]));
  const splits: FundAllocationSplit[] = [];
  let allocatedRunningSum = 0;

  // Filter items with valid funds and percentage > 0
  const activeItems = ruleItems.filter((item) => item.percentage > 0 && fundMap.has(item.fundId));
  const totalPercentage = activeItems.reduce((acc, curr) => acc + curr.percentage, 0);

  activeItems.forEach((item, index) => {
    const fund = fundMap.get(item.fundId)!;
    // Standard percentage allocation in integer minor units
    // Formula: floor to prevent over-allocation, remainder is distributed or saved to unallocated
    const rawAlloc = Math.floor((totalIncomeMinor * item.percentage) / 100);
    splits.push({
      fundId: item.fundId,
      fundName: fund.name,
      percentage: item.percentage,
      amount: rawAlloc,
    });
    allocatedRunningSum += rawAlloc;
  });

  // If total percentage equals exactly 100%, distribute the small fractional rounding poisha/cents
  // to the largest percentage fund so sum === totalIncomeMinor and unallocated === 0
  let unallocatedMinor = totalIncomeMinor - allocatedRunningSum;
  if (totalPercentage === 100 && unallocatedMinor > 0 && splits.length > 0) {
    // Distribute remainder to the fund with the largest percentage
    let maxIndex = 0;
    for (let i = 1; i < splits.length; i++) {
      if (splits[i].percentage > splits[maxIndex].percentage) {
        maxIndex = i;
      }
    }
    splits[maxIndex].amount += unallocatedMinor;
    allocatedRunningSum += unallocatedMinor;
    unallocatedMinor = 0;
  }

  return {
    splits,
    totalAllocatedMinor: allocatedRunningSum,
    unallocatedMinor,
  };
}

/**
 * Formats a date string according to the user's preferred format.
 */
export function formatDate(
  isoDateString: string,
  format: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' = 'DD/MM/YYYY'
): string {
  if (!isoDateString) return '';
  const [year, month, day] = isoDateString.split('-');
  if (!year || !month || !day) return isoDateString;

  switch (format) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    default:
      return `${day}/${month}/${year}`;
  }
}
