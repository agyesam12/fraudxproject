/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { analyzeMessage, levelFor, type AnalysisContext, type RiskLevel } from './index';

const ctx: AnalysisContext = { sensitivity: 'balanced', trustedSenders: [], blockedSenders: [] };

const CASES: { name: string; sender: string; body: string; expect: RiskLevel }[] = [
  {
    name: 'genuine MoMo receipt',
    sender: 'MobileMoney',
    body: 'Payment received for GHS 80.00 from ESI BOATENG. Current Balance: GHS 530.00. Transaction ID: 49105550123. Fee charged: GHS 0.00.',
    expect: 'safe',
  },
  { name: 'personal chat', sender: 'Kwesi', body: 'I will pass by around 6. Bring the charger I left last time.', expect: 'safe' },
  { name: 'bank OTP with safety notice', sender: 'GCB Bank', body: 'Your verification code is 530718. Never share this code with anyone.', expect: 'safe' },
  {
    name: 'reversal scam',
    sender: '0551239876',
    body: 'Please I sent GHS 200 to your number by mistake. Kindly send it back to 0551239876, I beg you.',
    expect: 'scam',
  },
  {
    name: 'PIN request impersonation',
    sender: '+233209183746',
    body: 'MTN customer care: your wallet is restricted. Reply with your PIN to avoid closure.',
    expect: 'scam',
  },
  {
    name: 'fake credit alert with approval trick',
    sender: 'M0biIeMoney',
    body: 'You have received GHS 1,200.00. To withdraw, dial *170*3*1# and enter your PIN to approve.',
    expect: 'scam',
  },
  { name: 'lookalike phishing domain', sender: '0268840021', body: 'Update your details at https://mtn-gh-momo.live/verify', expect: 'scam' },
  {
    name: 'prize with upfront fee',
    sender: 'MTN-Rewards',
    body: 'Congratulations! You have won GHS 3,000. Pay GHS 30 activation fee to receive your prize.',
    expect: 'scam',
  },
  {
    name: 'unknown person asking for money',
    sender: '0277123456',
    body: 'Hi, I am a friend of your cousin Efua. Please send GHS 50 to 0277123456 for me, I will pay you back tomorrow.',
    expect: 'suspicious',
  },
];

describe('analyzeMessage', () => {
  for (const c of CASES) {
    it(`classifies ${c.name} as ${c.expect}`, () => {
      const a = analyzeMessage({ sender: c.sender, body: c.body }, ctx);
      assert.equal(a.level, c.expect, `score=${a.score} signals=${a.signals.map((s) => s.id).join(',')}`);
    });
  }

  it('explains every scam with at least one categorised signal and advice', () => {
    for (const c of CASES.filter((c) => c.expect === 'scam')) {
      const a = analyzeMessage(c, ctx);
      assert.ok(a.category, c.name);
      assert.ok(a.advice.length >= 2, c.name);
    }
  });

  it('never lets a trusted sender mask a PIN request', () => {
    const msg = { sender: '0209990001', body: 'Please send your MoMo PIN to confirm the refund.' };
    const a = analyzeMessage(msg, { ...ctx, trustedSenders: ['0209990001'] });
    assert.equal(a.level, 'scam');
  });

  it('flags anything from a blocked sender', () => {
    const a = analyzeMessage({ sender: '0501112233', body: 'Hello' }, { ...ctx, blockedSenders: ['0501112233'] });
    assert.equal(a.level, 'scam');
  });

  it('applies sensitivity thresholds', () => {
    assert.equal(levelFor(40, 'relaxed'), 'safe');
    assert.equal(levelFor(40, 'balanced'), 'suspicious');
    assert.equal(levelFor(60, 'strict'), 'scam');
  });
});
