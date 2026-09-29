import type { RawMessage } from '@/engine';

type DemoMessage = RawMessage & { minutesAgo: number };

/** Seed inbox shown on first launch (and on devices without SMS access). */
export const DEMO_INBOX: DemoMessage[] = [
  {
    sender: 'MobileMoney',
    body: 'Payment received for GHS 250.00 from ABENA OWUSU 0244718291. Current Balance: GHS 612.40. Available Balance: GHS 612.40. Reference: Rent share. Transaction ID: 49103384120. Fee charged: GHS 0.00.',
    minutesAgo: 4,
  },
  {
    sender: '0557382910',
    body: 'Hello my brother, I mistakenly sent GHS 450 to your momo number. Please kindly send it back to me, it is my hospital money. God will bless you.',
    minutesAgo: 11,
  },
  {
    sender: 'MTN-Promo',
    body: 'CONGRATULATIONS!!! Your number has been selected as a WINNER in the MTN MoMo Mega Draw. You won GHS 10,000. Pay a processing fee of GHS 75 to claim before it expires.',
    minutesAgo: 38,
  },
  {
    sender: 'Kwesi',
    body: 'Charley, I will pass by around 6. Bring the charger I left last time.',
    minutesAgo: 55,
  },
  {
    sender: '+233209183746',
    body: 'MTN customer care: Your MoMo wallet has been restricted due to unusual activity. To avoid permanent closure, reply with your PIN and Ghana Card number immediately.',
    minutesAgo: 95,
  },
  {
    sender: 'MobileMoney',
    body: 'Cash Out made for GHS 100.00 to AGENT NANA VENTURES. Current Balance: GHS 362.40. Transaction ID: 49102219934. Fee charged: GHS 1.00.',
    minutesAgo: 180,
  },
  {
    sender: 'M0biIeMoney',
    body: 'You have received GHS 1,200.00 from MTN Rewards. To withdraw, dial *170*3*1# and enter your PIN to approve the transfer.',
    minutesAgo: 240,
  },
  {
    sender: 'GCB Bank',
    body: 'Your GCB verification code is 530718. It expires in 10 minutes. Never share this code with anyone.',
    minutesAgo: 320,
  },
  {
    sender: '0268840021',
    body: 'Update your MoMo details today or your account will be blocked. Click https://mtn-gh-momo.live/verify to continue.',
    minutesAgo: 600,
  },
  {
    sender: '0277123456',
    body: 'Hi, I am a friend of your cousin Efua. Please send GHS 50 to 0277123456 for me, I will pay you back tomorrow.',
    minutesAgo: 700,
  },
  {
    sender: 'Mum',
    body: 'Have you eaten? Call me when you close from work.',
    minutesAgo: 900,
  },
  {
    sender: 'MTN',
    body: 'Your 10GB data bundle has been activated and is valid for 30 days. Dial *138# to check your balance.',
    minutesAgo: 1440,
  },
  {
    sender: '0244901122',
    body: 'Free 15GB data for all MTN users this weekend! Get yours here: bit.ly/mtnfree15gb',
    minutesAgo: 2000,
  },
];

/** Pool used by "Simulate incoming SMS" to demo real-time protection. */
export const INCOMING_POOL: RawMessage[] = [
  {
    sender: '0540019283',
    body: 'Dear MoMo customer, your wallet will be suspended within 24 hours. Verify now at http://momo-secure-gh.top/login',
  },
  {
    sender: 'Ama',
    body: 'Thanks for yesterday! I have sent you the GHS 40 for the taxi.',
  },
  {
    sender: '0209990001',
    body: 'This is MTN staff. We sent you a code by error, please forward the verification code to this number now so we can reverse it.',
  },
  {
    sender: 'MobileMoney',
    body: 'Payment for GHS 45.00 to KFC OSU was successful. Current Balance: GHS 317.40. Transaction ID: 49104456789. Fee charged: GHS 0.00.',
  },
  {
    sender: '0591234567',
    body: 'Mum my phone fell and I am stranded at Circle. Please send GHS 300 urgently to this number, I will explain later.',
  },
  {
    sender: 'MoMo-Loans',
    body: 'Your instant MoMo loan of GHS 5,000 is approved! Pay GHS 120 insurance fee to 0509876543 to receive the money today.',
  },
  {
    sender: 'Yaw',
    body: 'Game starts at 7pm. Are you coming to watch with us?',
  },
  {
    sender: '0247776655',
    body: 'Congrats! You are a lucky winner of the MTN anniversary giveaway. Call our manager on 0247776655 to claim your GHS 3,000 prize.',
  },
];
