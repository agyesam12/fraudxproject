/**
 * Seed training corpus for the on-device text model.
 *
 * Written to reflect scam patterns reported by MoMo customers in Ghana. The
 * production model would be trained on MTN's labelled fraud reports; this set
 * exists so the prototype behaves realistically offline. The demo inbox
 * (src/data/demoMessages.ts) deliberately uses different messages so the
 * model is not simply recalling its training data.
 */
export const SCAM_SAMPLES: string[] = [
  'Congratulations! Your number has won GHS 5,000 in the MTN MoMo anniversary promo. Send GHS 50 processing fee to claim your prize today.',
  'Dear customer, your MoMo wallet will be suspended within 24 hours. Verify your account now at http://mtn-momo-verify.xyz',
  'I mistakenly sent GHS 300 to your MoMo number. Please kindly send it back, it was for my hospital bill. God bless you.',
  'Hello, I sent money to your number by mistake. Please reverse it to 0551234567 urgently.',
  'MTN: Your account has been selected for a bonus of GHS 2,000. Reply with your MoMo PIN to activate.',
  'Your MoMo account is blocked due to suspicious activity. Call our agent on 0209876543 to unblock immediately.',
  'You have received GHS 1,500.00 from MTN Promo. To withdraw, dial *170*1*1# and enter your PIN to approve.',
  'Final warning: your SIM will be deactivated. Update your Ghana Card details at bit.ly/mtn-update',
  'Dear valued customer, we detected a failed transaction. Share the verification code sent to you to reverse it.',
  'Win a brand new car! You are our lucky winner in the MoMo draw. Pay activation fee of GHS 100 to claim.',
  'Mum I am stranded, my phone is off. Please send GHS 400 to this number urgently, I will explain later.',
  'MTN MoMo: Your OTP is required to complete your cash reward. Send the code to this number now.',
  'Payment received for GHS 850.00. Please confirm by sending your PIN to our customer service line.',
  'Your MoMo loan of GHS 3,000 is approved. Pay GHS 80 insurance fee to 0244556677 to receive the money.',
  'Click here to claim your free 20GB data bundle: https://tinyurl.com/mtn-free-data',
  'ATTENTION!!! Your mobile money wallet has expired. Visit http://192.168.10.4/momo to renew now.',
  'This is MTN customer care. We are upgrading your account, please provide your date of birth and PIN.',
  'Congrats, you have been selected for the MTN Youth Empowerment grant. Send your name, Ghana card and PIN.',
  'Your transaction of GHS 250 is pending. Approve by dialing *170# and confirm with your secret code.',
  'Hi, wrong transfer to your wallet. Kindly refund GHS 200 before I report to the police.',
  'You are eligible for a MoMo cashback reward. Login at www.momo-rewards.top to claim before it expires.',
  'Dear subscriber, your number won the MTN 20th anniversary jackpot. Contact our manager on WhatsApp to claim.',
  'Urgent: fraudulent login detected on your MoMo account. Reply with the code we sent to secure it.',
  'Earn GHS 500 daily working from home. Register with GHS 100 via MoMo to 0598765432. Limited slots!',
  'Your parcel is held at customs. Pay GHS 45 clearance fee via MoMo to receive it today.',
  'MTN promo: double your money! Send GHS 200 and receive GHS 400 in 30 minutes. Guaranteed.',
  'Your MoMo account has been credited with GHS 700 by error. Transfer it back to avoid account closure.',
  'Dear customer, confirm your identity by entering your PIN at https://cutt.ly/momo-kyc',
  'Hello dear, I am an MTN staff. Your reward is ready, just send your PIN so we can process it.',
  'Account suspended! Recover your mobile money by calling 0501112233 now.',
];

export const LEGIT_SAMPLES: string[] = [
  'Payment received for GHS 120.00 from AMA MENSAH. Current Balance: GHS 450.20. Available Balance: GHS 450.20. Reference: food. Transaction ID: 48210937711. Fee charged: GHS 0.00.',
  'Cash Out made for GHS 200.00 to AGENT KOFI ENTERPRISE. Current Balance: GHS 90.50. Transaction ID: 48219980012. Fee charged: GHS 2.00.',
  'Your payment of GHS 35.00 to ECG PREPAID has been completed. Transaction ID: 48220011567. Your new balance: GHS 55.50.',
  'You have bought GHS 10.00 airtime for 0244123456. Transaction ID: 48229901234. Balance: GHS 45.50.',
  'Your OTP is 482913. It expires in 5 minutes. Do not share this code with anyone.',
  'MTN will never ask for your MoMo PIN. Do not share your PIN with anyone, including MTN staff.',
  'Hi, are we still meeting at the office at 3pm tomorrow?',
  'Please remember to buy bread on your way home. Thanks.',
  'Dear customer, your data bundle of 5GB has been activated. Valid for 30 days. Dial *138# to check balance.',
  'Transfer to KWAME BOATENG successful. Amount: GHS 300.00. Fee: GHS 1.50. Transaction ID: 48231234567. Balance: GHS 120.00.',
  'Happy birthday! Wishing you a wonderful year ahead. Call me when you are free.',
  'Your MoMo statement for August is ready. Dial *170# and select My Wallet to view.',
  'Reminder: your church dues are due on Sunday. God bless.',
  'Your GOtv subscription has been renewed successfully. Transaction ID: 48240000123. Fee: GHS 0.00.',
  'Kofi here. I have sent the money for the tickets, check your MoMo.',
  'MTN: You have received a gift of 1GB from 0277001122. Enjoy.',
  'Your MoMo interest of GHS 1.25 has been credited. Current Balance: GHS 301.25.',
  'Mummy, I got home safely. Will call you tonight.',
  'Your ride has arrived. Your driver Yaw is waiting in a silver Toyota Vitz.',
  'Payment for GHS 60.00 to SHOPRITE ACCRA MALL was successful. Transaction ID: 48251119876. Balance: GHS 240.00.',
  'Meeting has been moved to Thursday. Please inform the team.',
  'Your bank verification code is 771204. Never share this code. Bank staff will never ask for it.',
  'Your electricity token is 1234-5678-9012-3456. Units: 45.3kWh. Thank you for using MoMo Pay.',
  'MTN Ghana: Your SIM registration is complete. Thank you.',
  'Can you send me the photos from the wedding when you get a chance?',
  'Your loan repayment of GHS 50.00 to QwikLoan was successful. Remaining balance: GHS 150.00.',
  'Hello, the plumber will come by at 10am. Please be home.',
  'Allowance for September sent to your MoMo. Use it wisely!',
  'Your school fees payment of GHS 1,200.00 to ACCRA ACADEMY has been received. Transaction ID: 48260004444.',
  'MTN: Recharge successful. You have been credited with GHS 20.00 airtime.',
];
