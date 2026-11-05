import { API_BASE } from '../services/api';
import { MOCK_TESTS } from '../data/mockTests';

const STORAGE_KEY = 'profilereel_paid_tests';
const COMPLETED_KEY = 'profilereel_completed_tests';
const RESULTS_KEY = 'profilereel_test_results';
const ATTEMPT_KEY = 'profilereel_test_attempts';
export const MOCK_TEST_PAID_EVENT = 'profilereel-mock-test-paid';
export const MOCK_TEST_COMPLETED_EVENT = 'profilereel-mock-test-completed';
export const MOCK_TEST_PAID_MESSAGE = 'PROFILEREEL_MOCK_TEST_PAID';
const KNOWN_TEST_IDS = new Set(MOCK_TESTS.map((test) => test.id));

export type MockTestResult = {
  mcqScore: number;
  mcqTotal: number;
  codeAttempted: number;
  codeTotal: number;
  submittedAt: string;
};

export function getPaidMockTests(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string' && id.length > 0) : [];
  } catch {
    return [];
  }
}

export function isKnownMockTestId(testId?: string | null): boolean {
  return Boolean(testId && KNOWN_TEST_IDS.has(testId));
}

export function isMockTestPaid(testId?: string | null): boolean {
  if (!isKnownMockTestId(testId)) return false;
  return getPaidMockTests().includes(testId as string);
}

export function markMockTestPaid(testId: string): void {
  if (!isKnownMockTestId(testId)) return;
  const paid = getPaidMockTests();
  if (!paid.includes(testId)) {
    paid.push(testId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(paid));
  }
  window.dispatchEvent(new CustomEvent(MOCK_TEST_PAID_EVENT, { detail: { testId } }));
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function getCompletedMockTests(): string[] {
  const parsed = readJson<unknown>(COMPLETED_KEY, []);
  return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string' && id.length > 0) : [];
}

export function isMockTestCompleted(testId?: string | null): boolean {
  if (!isKnownMockTestId(testId)) return false;
  return getCompletedMockTests().includes(testId as string);
}

export function getMockTestResult(testId?: string | null): MockTestResult | null {
  if (!isKnownMockTestId(testId)) return null;
  const all = readJson<Record<string, MockTestResult>>(RESULTS_KEY, {});
  return all[testId as string] || null;
}

export function markMockTestCompleted(testId: string, result: MockTestResult): void {
  if (!isKnownMockTestId(testId)) return;
  const completed = getCompletedMockTests();
  if (!completed.includes(testId)) {
    completed.push(testId);
    localStorage.setItem(COMPLETED_KEY, JSON.stringify(completed));
  }
  const all = readJson<Record<string, MockTestResult>>(RESULTS_KEY, {});
  all[testId] = result;
  localStorage.setItem(RESULTS_KEY, JSON.stringify(all));
  const attempts = readJson<Record<string, unknown>>(ATTEMPT_KEY, {});
  delete attempts[testId];
  localStorage.setItem(ATTEMPT_KEY, JSON.stringify(attempts));
  window.dispatchEvent(new CustomEvent(MOCK_TEST_COMPLETED_EVENT, { detail: { testId } }));
}

export type MockTestAttempt = {
  mcqAnswers: Record<number, number>;
  codeAnswers: Record<number, string>;
};

export function getMockTestAttempt(testId?: string | null): MockTestAttempt | null {
  if (!isKnownMockTestId(testId)) return null;
  const all = readJson<Record<string, MockTestAttempt>>(ATTEMPT_KEY, {});
  return all[testId as string] || null;
}

export function hasOpenMockTestAttempt(testId?: string | null): boolean {
  return Boolean(getMockTestAttempt(testId));
}

export function saveMockTestAttempt(testId: string, attempt: MockTestAttempt): void {
  if (!isKnownMockTestId(testId) || isMockTestCompleted(testId)) return;
  const all = readJson<Record<string, MockTestAttempt>>(ATTEMPT_KEY, {});
  all[testId] = attempt;
  localStorage.setItem(ATTEMPT_KEY, JSON.stringify(all));
}

type RazorpayInstance = {
  open: () => void;
};

type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

function getRazorpay(): RazorpayConstructor | null {
  return (window as Window & { Razorpay?: RazorpayConstructor }).Razorpay || null;
}

async function loadRazorpayScript(): Promise<RazorpayConstructor> {
  const existing = getRazorpay();
  if (existing) return existing;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load Razorpay Checkout'));
    document.body.appendChild(script);
  });
  const loaded = getRazorpay();
  if (!loaded) throw new Error('Razorpay Checkout is unavailable');
  return loaded;
}

export async function startMockTestCheckout(opts: {
  testId: string;
  userId?: string;
  userEmail?: string;
  customerName?: string;
}): Promise<void> {
  if (!isKnownMockTestId(opts.testId)) return;

  const res = await fetch(`${API_BASE}/payments/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      plan: 'mock_test',
      testId: opts.testId,
      customerName: opts.customerName,
      customerEmail: opts.userEmail,
      userId: opts.userId,
    }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.orderId || !data?.keyId) {
    throw new Error(data?.message || 'Could not start ₹10 checkout');
  }

  const Razorpay = await loadRazorpayScript();
  await new Promise<void>((resolve, reject) => {
    const checkout = new Razorpay({
      key: data.keyId,
      amount: data.amount,
      currency: data.currency || 'INR',
      name: 'ProfileReel AI',
      description: 'Mock Interview Test (₹10)',
      order_id: data.orderId,
      prefill: {
        name: opts.customerName || '',
        email: opts.userEmail || '',
      },
      notes: {
        plan: 'mock_test',
        testId: opts.testId,
        userId: opts.userId || '',
      },
      theme: { color: '#059669' },
      handler: async (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        try {
          const verifyRes = await fetch(`${API_BASE}/payments/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
              plan: 'mock_test',
              userId: opts.userId,
              userEmail: opts.userEmail,
            }),
          });
          if (!verifyRes.ok) {
            throw new Error('Payment verification failed');
          }
          markMockTestPaid(opts.testId);
          document.getElementById('mock-tests')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          resolve();
        } catch (err) {
          reject(err);
        }
      },
      modal: {
        ondismiss: () => resolve(),
      },
    });
    checkout.open();
  });
}
