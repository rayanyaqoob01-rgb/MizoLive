import 'dotenv/config';
import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import agoraToken from 'agora-token';

const { RtcTokenBuilder, RtcRole } = agoraToken;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'rayanyaqoob01@gmail.com').toLowerCase();
const SERVER_START_TS = Date.now();

function getAgoraConfig() {
  const appId = (process.env.AGORA_APP_ID || '').trim();
  const appCertificate = (process.env.AGORA_APP_CERTIFICATE || '').trim();
  const configured =
    Boolean(appId) &&
    Boolean(appCertificate) &&
    appId !== 'MY_AGORA_APP_ID' &&
    appCertificate !== 'MY_AGORA_APP_CERTIFICATE';
  return { appId, appCertificate, configured };
}

// Configurable server-side economy (never hardcoded in frontend)
const ECONOMY_CONFIG = {
  audioCallCoinsPerMin: Number(process.env.CALL_AUDIO_RATE || 40),
  videoCallCoinsPerMin: Number(process.env.CALL_VIDEO_RATE || 90),
  platformCommissionPct: Number(process.env.PLATFORM_COMMISSION_PCT || 20),
  coinPackages: [
    { id: 'pkg-100', coins: 500, bonus: 25, priceUsd: '$4.99', label: 'Starter Pouch' },
    { id: 'pkg-500', coins: 1500, bonus: 150, priceUsd: '$14.99', label: 'Royal Chest' },
    { id: 'pkg-3000', coins: 3500, bonus: 500, priceUsd: '$29.99', label: 'VIP Vault' },
    { id: 'pkg-10000', coins: 10000, bonus: 2000, priceUsd: '$79.99', label: 'Emperor Treasury' },
  ],
};

// Authoritative server-side Store & Gift price catalog (All 8 categories)
const STORE_PRICES: Record<string, { name: string; price: number; category: string }> = {
  'frame-royal-flame': { name: 'Royal Flame', price: 799, category: 'VIP Frames' },
  'frame-neon-galaxy': { name: 'Neon Galaxy', price: 899, category: 'VIP Frames' },
  'frame-diamond-aura': { name: 'Diamond Aura', price: 1199, category: 'VIP Frames' },
  'frame-gold-wreath': { name: 'Gold Wreath', price: 599, category: 'VIP Frames' },
  'frame-royal-wings': { name: 'Royal Wings', price: 999, category: 'VIP Frames' },
  'frame-animated-halo': { name: 'Animated Halo', price: 699, category: 'Animated Frames' },
  'frame-pulse-crown': { name: 'Pulse Crown Orbit', price: 1099, category: 'Animated Frames' },
  'entry-royal-crown': { name: 'Royal Entry', price: 999, category: 'Special Entry' },
  'entry-vip-arrival': { name: 'VIP Entry', price: 899, category: 'Special Entry' },
  'entry-golden-wings': { name: 'Golden Entry', price: 799, category: 'Special Entry' },
  'entry-premium-aura': { name: 'Premium Entry', price: 699, category: 'Special Entry' },
  'cgift-crown-crest': { name: 'Sovereign Crown Gift', price: 499, category: 'Custom Gift' },
  'cgift-galaxy-rose': { name: 'Neon Galaxy Rose', price: 299, category: 'Custom Gift' },
  'cgift-diamond-swan': { name: 'Diamond Swan', price: 899, category: 'Custom Gift' },
  'asset-starlight-aura': { name: 'Starlight Profile Aura', price: 650, category: 'Premium Assets' },
  'asset-crown-spark': { name: 'Royal Crown Sparkles', price: 850, category: 'Premium Assets' },
  'asset-neon-ribbon': { name: 'Neon Profile Ribbon', price: 550, category: 'Profile Decorations' },
  'decor-obsidian-crest': { name: 'Obsidian Banner Crest', price: 720, category: 'Profile Decorations' },
  'name-royal-gold': { name: 'Imperial Gold Gradient', price: 480, category: 'Name Decorations' },
  'name-neon-prism': { name: 'Neon Orchid Shimmer', price: 560, category: 'Name Decorations' },
  'badge-sovereign': { name: 'Sovereign Guardian Badge', price: 950, category: 'Special Badges' },
  'badge-founding': { name: 'Mizo Founding Star', price: 620, category: 'Special Badges' },
};

const GIFT_PRICES: Record<string, { name: string; price: number }> = {
  'gift-rose': { name: 'Royal Rose', price: 10 },
  'gift-heart': { name: 'Velvet Heart', price: 25 },
  'gift-star': { name: 'Neon Star', price: 50 },
  'gift-crown': { name: 'Mizo Crown', price: 199 },
  'gift-wings': { name: 'Gold Wings', price: 399 },
  'gift-castle': { name: 'Diamond Palace', price: 899 },
  'gift-dragon': { name: 'Sovereign Dragon', price: 1299 },
  'gift-bouquet': { name: 'Love Bouquet', price: 120 },
};

interface LedgerTx {
  id: string;
  type: 'recharge' | 'gift_sent' | 'gift_received' | 'store_purchase' | 'call_charge' | 'call_earning';
  title: string;
  amount: number;
  direction: 'in' | 'out';
  meta?: string;
  timestamp: string;
}

interface ActiveCallSession {
  callId: string;
  userId: string;
  calleeName: string;
  callType: 'audio' | 'video';
  ratePerMin: number;
  startedAt: number;
  minutesBilled: number;
  totalCharged: number;
  receiverEarned: number;
  platformFee: number;
}

interface UserAccount {
  userId: string;
  coins: number;
  spentCoins: number;
  receivedCoins: number;
  callEarnings: number;
  ownedItemIds: string[];
  transactions: LedgerTx[];
}

interface ModerationReportRecord {
  id: string;
  reporterId: string;
  targetName: string;
  targetType: string;
  reason: string;
  status: 'open' | 'reviewed';
  timestamp: string;
}

const accounts = new Map<string, UserAccount>();
const activeCalls = new Map<string, ActiveCallSession>();
const serverReports: ModerationReportRecord[] = [];
const serverErrorLog: Array<{ endpoint: string; message: string; timestamp: string }> = [];

function getOrCreateAccount(userId: string): UserAccount {
  const safeId = String(userId || '12345678').slice(0, 40);
  let acc = accounts.get(safeId);
  if (!acc) {
    acc = {
      userId: safeId,
      coins: 2750,
      spentCoins: 640,
      receivedCoins: 1280,
      callEarnings: 420,
      ownedItemIds: ['frame-gold-wreath'],
      transactions: [
        {
          id: 'tx-init-1',
          type: 'gift_received',
          title: 'Royal Rose from King Rayan',
          amount: 250,
          direction: 'in',
          timestamp: 'Today',
        },
        {
          id: 'tx-init-2',
          type: 'store_purchase',
          title: 'Gold Wreath Frame',
          amount: 599,
          direction: 'out',
          timestamp: 'Yesterday',
        },
        {
          id: 'tx-init-3',
          type: 'call_earning',
          title: 'Video Call Earnings (5 min)',
          amount: 360,
          direction: 'in',
          timestamp: '2 days ago',
        },
      ],
    };
    accounts.set(safeId, acc);
  }
  return acc;
}

function resolveUserId(req: Request): string {
  const headerId = req.header('x-mizo-user-id');
  const bodyId = typeof req.body?.userId === 'string' ? req.body.userId : undefined;
  const queryId = typeof req.query?.userId === 'string' ? req.query.userId : undefined;
  return (headerId || bodyId || queryId || '12345678').trim();
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // 0. Health & Service Status
  app.get('/api/health', (_req: Request, res: Response) => {
    const agora = getAgoraConfig();
    res.json({
      ok: true,
      service: 'mizo-live-api',
      uptimeSec: Math.round((Date.now() - SERVER_START_TS) / 1000),
      agora: {
        configured: agora.configured,
      },
      paymentMode: process.env.STRIPE_SECRET_KEY ? 'configured' : 'sandbox_demo',
    });
  });

  // 1. Configurable Economy & Rates
  app.get('/api/config', (_req: Request, res: Response) => {
    const agora = getAgoraConfig();
    res.json({
      economy: ECONOMY_CONFIG,
      paymentMode: process.env.STRIPE_SECRET_KEY ? 'configured' : 'sandbox_demo',
      agoraConfigured: agora.configured,
    });
  });

  // 2. Server-Side Agora RTC Token Generator (Never exposes App Certificate)
  app.post('/api/agora/token', (req: Request, res: Response) => {
    const agora = getAgoraConfig();
    if (!agora.configured) {
      serverErrorLog.unshift({
        endpoint: '/api/agora/token',
        message: 'AGORA_APP_ID or AGORA_APP_CERTIFICATE is missing on server.',
        timestamp: new Date().toISOString(),
      });
      res.status(503).json({
        ok: false,
        configured: false,
        code: 'AGORA_CREDENTIALS_MISSING',
        error: 'Agora App ID and App Certificate must be configured in server environment variables.',
      });
      return;
    }

    const rawChannel = String(req.body?.channelName || '').trim();
    const channelName = rawChannel.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
    if (!channelName) {
      res.status(400).json({ ok: false, error: 'Valid channelName is required' });
      return;
    }

    const uid = Number(req.body?.uid) > 0 ? Math.floor(Number(req.body.uid)) : Math.floor(10000 + Math.random() * 89999);
    const role = req.body?.role === 'subscriber' ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER;
    const expireSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expireSeconds;

    try {
      const token = RtcTokenBuilder.buildTokenWithUid(
        agora.appId,
        agora.appCertificate,
        channelName,
        uid,
        role,
        privilegeExpiredTs,
        privilegeExpiredTs
      );
      res.json({
        ok: true,
        configured: true,
        appId: agora.appId,
        token,
        channelName,
        uid,
        expiresAt: privilegeExpiredTs,
      });
    } catch (err: any) {
      const msg = err?.message || 'Failed to build Agora RTC token';
      serverErrorLog.unshift({
        endpoint: '/api/agora/token',
        message: msg,
        timestamp: new Date().toISOString(),
      });
      res.status(500).json({ ok: false, error: msg });
    }
  });

  // 3. Protected Admin Diagnostics Endpoint (Strictly Admin Only)
  app.get('/api/admin/diagnostics', (req: Request, res: Response) => {
    const email = String(req.header('x-mizo-admin-email') || '').trim().toLowerCase();
    const verified = req.header('x-mizo-email-verified') === 'true';

    if (!verified || email !== ADMIN_EMAIL) {
      res.status(403).json({
        ok: false,
        error: 'Forbidden: Protected Admin Diagnostics requires verified admin credentials.',
      });
      return;
    }

    const agora = getAgoraConfig();
    res.json({
      ok: true,
      adminEmail: email,
      uptimeSec: Math.round((Date.now() - SERVER_START_TS) / 1000),
      backendStatus: 'healthy',
      agoraConfigured: agora.configured,
      activeCallsCount: activeCalls.size,
      activeAccountsCount: accounts.size,
      reportsCount: serverReports.length,
      recentServerErrors: serverErrorLog.slice(0, 15),
    });
  });

  // 4. Reports & Moderation History Endpoint
  app.get('/api/reports', (req: Request, res: Response) => {
    const userId = resolveUserId(req);
    res.json({
      reports: serverReports.filter((r) => r.reporterId === userId),
    });
  });

  app.post('/api/reports', (req: Request, res: Response) => {
    const userId = resolveUserId(req);
    const targetName = String(req.body?.targetName || '').trim().slice(0, 80);
    const targetType = String(req.body?.targetType || 'user').slice(0, 20);
    const reason = String(req.body?.reason || '').trim().slice(0, 300);

    if (!targetName || reason.length < 3) {
      res.status(400).json({ error: 'Target and reason (min 3 chars) are required' });
      return;
    }

    const rec: ModerationReportRecord = {
      id: `rep-${Date.now()}`,
      reporterId: userId,
      targetName,
      targetType,
      reason,
      status: 'open',
      timestamp: 'Just now',
    };
    serverReports.unshift(rec);
    res.json({ ok: true, report: rec });
  });

  // 5. Get Server-Authoritative Wallet State
  app.get('/api/wallet', (req: Request, res: Response) => {
    const acc = getOrCreateAccount(resolveUserId(req));
    res.json(acc);
  });

  // 6. Sandbox Coin Package Recharge
  app.post('/api/wallet/recharge', (req: Request, res: Response) => {
    const userId = resolveUserId(req);
    const packageId = String(req.body?.packageId || '');
    const pkg = ECONOMY_CONFIG.coinPackages.find((p) => p.id === packageId);
    if (!pkg) {
      res.status(400).json({ error: 'Invalid coin package ID' });
      return;
    }

    const acc = getOrCreateAccount(userId);
    const totalAdded = pkg.coins + pkg.bonus;
    acc.coins += totalAdded;
    acc.transactions.unshift({
      id: `tx-${Date.now()}`,
      type: 'recharge',
      title: `${pkg.label} (${pkg.priceUsd} Sandbox)`,
      amount: totalAdded,
      direction: 'in',
      meta: 'Requires connected payment provider in production',
      timestamp: 'Just now',
    });

    res.json({ account: acc, added: totalAdded });
  });

  // 7. Server-Validated Store Purchase
  app.post('/api/store/purchase', (req: Request, res: Response) => {
    const userId = resolveUserId(req);
    const itemId = String(req.body?.itemId || '');
    const catalogItem = STORE_PRICES[itemId];
    if (!catalogItem) {
      res.status(400).json({ error: 'Invalid store item' });
      return;
    }

    const acc = getOrCreateAccount(userId);
    if (acc.ownedItemIds.includes(itemId)) {
      res.json({ account: acc, alreadyOwned: true });
      return;
    }

    if (acc.coins < catalogItem.price) {
      res.status(402).json({
        error: 'Insufficient coin balance',
        required: catalogItem.price,
        balance: acc.coins,
      });
      return;
    }

    acc.coins -= catalogItem.price;
    acc.spentCoins += catalogItem.price;
    acc.ownedItemIds.push(itemId);
    acc.transactions.unshift({
      id: `tx-${Date.now()}`,
      type: 'store_purchase',
      title: `${catalogItem.name} (${catalogItem.category})`,
      amount: catalogItem.price,
      direction: 'out',
      timestamp: 'Just now',
    });

    res.json({ account: acc, item: catalogItem });
  });

  // 8. Server-Validated Gift Sending
  app.post('/api/gifts/send', (req: Request, res: Response) => {
    const userId = resolveUserId(req);
    const giftId = String(req.body?.giftId || '');
    const recipientName = String(req.body?.recipientName || 'Host').slice(0, 40);
    const gift = GIFT_PRICES[giftId];
    if (!gift) {
      res.status(400).json({ error: 'Invalid gift item' });
      return;
    }

    const acc = getOrCreateAccount(userId);
    if (acc.coins < gift.price) {
      res.status(402).json({
        error: 'Insufficient coins for gift',
        required: gift.price,
        balance: acc.coins,
      });
      return;
    }

    acc.coins -= gift.price;
    acc.spentCoins += gift.price;
    acc.transactions.unshift({
      id: `tx-${Date.now()}`,
      type: 'gift_sent',
      title: `Sent ${gift.name} to ${recipientName}`,
      amount: gift.price,
      direction: 'out',
      timestamp: 'Just now',
    });

    res.json({ account: acc, gift });
  });

  // 9. Server-Validated Coin-Based Calling Economy
  app.post('/api/calls/start', (req: Request, res: Response) => {
    const userId = resolveUserId(req);
    const callType = req.body?.callType === 'video' ? 'video' : 'audio';
    const calleeName = String(req.body?.calleeName || 'Creator').slice(0, 40);
    const consentConfirmed = Boolean(req.body?.consentConfirmed);

    if (!consentConfirmed) {
      res.status(400).json({ error: 'Caller billing consent is required' });
      return;
    }

    const ratePerMin =
      callType === 'video'
        ? ECONOMY_CONFIG.videoCallCoinsPerMin
        : ECONOMY_CONFIG.audioCallCoinsPerMin;

    const acc = getOrCreateAccount(userId);
    if (acc.coins < ratePerMin) {
      res.status(402).json({
        error: `Insufficient coins. Minimum ${ratePerMin} coins required for 1 minute.`,
        required: ratePerMin,
        balance: acc.coins,
      });
      return;
    }

    const platformFee = Math.round((ratePerMin * ECONOMY_CONFIG.platformCommissionPct) / 100);
    const receiverEarned = ratePerMin - platformFee;
    acc.coins -= ratePerMin;
    acc.spentCoins += ratePerMin;

    const callId = `call-${Date.now()}`;
    const session: ActiveCallSession = {
      callId,
      userId,
      calleeName,
      callType,
      ratePerMin,
      startedAt: Date.now(),
      minutesBilled: 1,
      totalCharged: ratePerMin,
      receiverEarned,
      platformFee,
    };
    activeCalls.set(callId, session);

    acc.transactions.unshift({
      id: `tx-${Date.now()}`,
      type: 'call_charge',
      title: `${callType === 'video' ? 'Video' : 'Audio'} Call with ${calleeName} (Min 1)`,
      amount: ratePerMin,
      direction: 'out',
      meta: `Receiver +${receiverEarned} · Platform ${platformFee}`,
      timestamp: 'Just now',
    });

    res.json({ session, account: acc });
  });

  app.post('/api/calls/tick', (req: Request, res: Response) => {
    const callId = String(req.body?.callId || '');
    const session = activeCalls.get(callId);
    if (!session) {
      res.status(404).json({ error: 'Active call session not found' });
      return;
    }

    const acc = getOrCreateAccount(session.userId);
    if (acc.coins < session.ratePerMin) {
      res.status(402).json({
        error: 'Balance depleted during call',
        balance: acc.coins,
        session,
      });
      return;
    }

    const platformFee = Math.round(
      (session.ratePerMin * ECONOMY_CONFIG.platformCommissionPct) / 100
    );
    const receiverEarned = session.ratePerMin - platformFee;

    acc.coins -= session.ratePerMin;
    acc.spentCoins += session.ratePerMin;
    session.minutesBilled += 1;
    session.totalCharged += session.ratePerMin;
    session.receiverEarned += receiverEarned;
    session.platformFee += platformFee;

    acc.transactions.unshift({
      id: `tx-${Date.now()}`,
      type: 'call_charge',
      title: `${session.callType === 'video' ? 'Video' : 'Audio'} Call with ${session.calleeName} (Min ${session.minutesBilled})`,
      amount: session.ratePerMin,
      direction: 'out',
      meta: `Receiver +${receiverEarned} · Platform ${platformFee}`,
      timestamp: 'Just now',
    });

    res.json({ session, account: acc });
  });

  app.post('/api/calls/end', (req: Request, res: Response) => {
    const callId = String(req.body?.callId || '');
    const session = activeCalls.get(callId);
    if (!session) {
      res.json({ closed: true });
      return;
    }
    activeCalls.delete(callId);
    const acc = getOrCreateAccount(session.userId);
    res.json({ closed: true, summary: session, account: acc });
  });

  // HTTP Server + WebSocket Signaling & Real-Time Events
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (socket: WebSocket) => {
    socket.on('message', (raw) => {
      try {
        const parsed = JSON.parse(raw.toString());
        if (!parsed || typeof parsed.type !== 'string') return;

        wss.clients.forEach((client) => {
          if (client !== socket && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(parsed));
          }
        });
      } catch {
        // Ignore malformed packets
      }
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Mizo Live server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Mizo Live server:', err);
  process.exit(1);
});
