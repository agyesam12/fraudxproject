# FraudX: MoMo scam protection (prototype)

FraudX checks incoming messages for MTN MoMo scams and warns the customer **before** they reply, click a link or send money. Every warning comes with a risk score (0–100) and a plain-language explanation.

Built with Expo (React Native + TypeScript). One codebase runs on Android, iOS and the web (the web build is for demos).

## Run it

```bash
npm install
npx expo start          # press w for the web browser, or scan the QR code with Expo Go
npm test                # detection engine tests
npm run typecheck
```

Expo Go and the web build use a **demo inbox**. To read the phone's real SMS inbox you need the Android build:

```bash
npx expo run:android                                  # local, needs Android Studio
npx eas-cli@latest build -p android --profile preview # cloud build that produces an installable APK
```

### Web demo on GitHub Pages
The landing page (`/index.html` at the repo root) embeds the web build of this app from `/app/`. After changing the app, rebuild the demo:

```bash
npm run build:pages     # writes ../app and ../.nojekyll (use REPO_NAME=... if the repo is renamed)
```

Then commit and push. Pages serves the page from `main`, root folder.

### Demo script (about 2 minutes)
1. **Protection** tab: shows the protection status, stats and the messages that need attention.
2. Tap **Simulate incoming SMS**. A scam alert appears at once, before the message has been opened. Tap *See why it's dangerous*.
3. **Risk report**: shows the score, the verdict, each reason with the evidence it found, what to do, and the AI language check. Links in risky messages are disabled.
4. **Check SMS** tab: tap an example or paste any message. This is how iPhone users check messages.
5. **Settings**: change the sensitivity (Relaxed, Balanced or Strict) and the whole inbox is re-scored at once. Blocked and trusted senders are also managed here.

## How detection works

`src/engine/` contains pure TypeScript with no network calls, so it runs on the device and could be reused on a server.

| Layer | What it does |
|---|---|
| **Fraud rules** (`signals.ts`) | About 20 explainable signals from real MoMo scam patterns: PIN/OTP requests, lookalike senders (`M0biIeMoney`), personal numbers claiming to be MTN, fake MTN domains, link shorteners, raw-IP links, "sent by mistake" refund requests, fake credit alerts from non-MTN senders, USSD "approve to receive" tricks, prizes with upfront fees, account-closure threats, urgency, and emergency money requests. The engine also recognises trust signals, such as the official `MobileMoney` sender with a genuine receipt format. |
| **AI language model** (`classifier.ts`) | A Naive Bayes model on unigrams and bigrams, trained on the device from `corpus.ts`. It gives a "similarity to known scams" score and names the wording that drove it. |
| **Scoring** (`index.ts`) | `score = 0.65 × rules + 0.35 × model`, plus hard floors: any PIN request scores at least 85, even from a trusted sender, and fake MTN domains score at least 72. Thresholds depend on the sensitivity setting. |

Customer feedback feeds back into scoring. **Block sender**, **I know this sender** and **Report scam** re-score messages straight away.

## Platform reality

| | Android | iOS |
|---|---|---|
| Read the SMS inbox | ✅ `READ_SMS` through the local native module `modules/sms-inbox` (Kotlin, Expo Modules API) | ❌ Apple gives no app access to messages |
| Real-time detection | ✅ A ContentObserver fires `onInboxChange`, and new messages are scored and trigger an alert | Planned: an **SMS Message Filter extension** (`ILMessageFilterExtension`) for unknown senders |
| Manual check | ✅ | ✅ Paste in the Check SMS tab. A share-sheet extension is planned. |

⚠️ **Google Play restricts `READ_SMS`** to default SMS apps and approved exceptions. A production launch would ship as an MTN-distributed app with a Play policy declaration for anti-fraud use, or would be built into the MoMo app itself.

## Project layout

```
src/app/              screens (Expo Router): tabs + message/[id] risk report
src/engine/           detection engine + tests
src/state/            app store (reducer + AsyncStorage persistence)
src/sources/          device SMS hook (permission, history, live updates)
src/components/       UI: ThreatAlert, AnalysisView, ScoreRing, MessageRow …
src/data/             demo inbox and simulated incoming messages
modules/sms-inbox/    Android native module (Kotlin)
```

## Prototype limits and next steps
- **Real training data:** replace `corpus.ts` with MTN's labelled fraud reports, and move to a small on-device transformer (TFLite / Core ML) that returns the same `Analysis` shape.
- **Fraud intelligence:** sync hashed scam sender numbers and domains from MTN's fraud desk into the rules.
- **Report scam:** in this prototype, reports are only stored on the phone. The next step is to wire them to the MTN fraud reporting API.
- **Background protection:** add an Android foreground service or BroadcastReceiver, and push notifications when the app is closed.
- **Languages:** add explanations in Twi, Ga and Ewe.
