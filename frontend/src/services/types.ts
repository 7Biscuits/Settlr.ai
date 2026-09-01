export interface Group {
  id: string;
  name: string;
}

export interface DirectedBalance {
  otherUserId: string;
  otherUserName: string;
  netAmount: number;
}

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
}

/** Formats integer minor units as a two-decimal major-unit string. */
export function formatAmount(minor: number): string {
  const sign = minor < 0 ? "-" : "";
  const abs = Math.abs(minor);
  return `${sign}${(abs / 100).toFixed(2)}`;
}
