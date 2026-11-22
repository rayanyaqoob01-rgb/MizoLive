import 'package:flutter/material.dart';
import '../data/mizo_seed_data.dart';
import '../models/mizo_models.dart';
import '../state/mizo_app_state.dart';
import '../theme/mizo_theme.dart';
import '../widgets/mizo_widgets.dart';

class WalletScreen extends StatefulWidget {
  final MizoAppState state;
  const WalletScreen({super.key, required this.state});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  String _txFilter = 'all'; // all | recharge | gift | store | call
  bool _recharging = false;

  @override
  Widget build(BuildContext context) {
    final s = widget.state;
    final txs = s.wallet.transactions.where((t) {
      if (_txFilter == 'all') return true;
      return t.type.toLowerCase().contains(_txFilter);
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mizo Wallet',
            style: TextStyle(fontWeight: FontWeight.w800)),
        actions: [
          IconButton(
            onPressed: s.loadServerConfigAndWallet,
            icon: const Icon(Icons.refresh),
            tooltip: 'Sync Wallet',
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Balance Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              gradient: MizoColors.neonHeroGradient,
              border: Border.all(color: MizoColors.gold.withValues(alpha: 0.5)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.monetization_on,
                        color: MizoColors.gold, size: 22),
                    SizedBox(width: 8),
                    Text('Available Balance',
                        style: TextStyle(color: Colors.white70, fontSize: 13)),
                    Spacer(),
                    Chip(
                      backgroundColor: Color(0xFF2B124C),
                      label: Text('SANDBOX WALLET',
                          style: TextStyle(
                              color: MizoColors.goldLight,
                              fontSize: 10,
                              fontWeight: FontWeight.w800)),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  '${s.profile.coins} Coins',
                  style: const TextStyle(
                    color: MizoColors.goldLight,
                    fontSize: 32,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    _miniStat('Spent', '${s.wallet.spentCoins}'),
                    const SizedBox(width: 14),
                    _miniStat('Received', '${s.wallet.receivedCoins}'),
                    const SizedBox(width: 14),
                    _miniStat('Call Earned', '${s.wallet.callEarnings}'),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),

          const Text('Recharge Coin Packages (Sandbox)',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
          const SizedBox(height: 4),
          const Text(
            'Top up Sandbox Coins synced with the MizoLive backend ledger for gifts, VIP frames, and calls.',
            style: TextStyle(fontSize: 12, color: Colors.grey),
          ),
          const SizedBox(height: 12),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1.28,
            ),
            itemCount: s.economy.coinPackages.length,
            itemBuilder: (_, idx) {
              final pkg = s.economy.coinPackages[idx];
              return Card(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.monetization_on,
                              color: MizoColors.gold, size: 18),
                          const SizedBox(width: 4),
                          Text('${pkg.coins}',
                              style: const TextStyle(
                                  fontWeight: FontWeight.w900, fontSize: 17)),
                          const Spacer(),
                          if (pkg.bonus > 0)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: MizoColors.emerald.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(999),
                              ),
                              child: Text('+${pkg.bonus}',
                                  style: const TextStyle(
                                      color: MizoColors.emerald,
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800)),
                            ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(pkg.label,
                          style: const TextStyle(
                              fontSize: 12, color: Colors.grey)),
                      const Spacer(),
                      SizedBox(
                        width: double.infinity,
                        height: 34,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: MizoColors.gold,
                            foregroundColor: const Color(0xFF1E0B3B),
                            padding: EdgeInsets.zero,
                          ),
                          onPressed: _recharging
                              ? null
                              : () async {
                                  final ok = await ensureAuthenticatedOrPrompt(
                                      context, s, 'recharge coins');
                                  if (!ok) return;
                                  setState(() => _recharging = true);
                                  await s.rechargePackage(pkg.id);
                                  if (mounted) {
                                    setState(() => _recharging = false);
                                  }
                                },
                          child: Text(pkg.priceUsd,
                              style:
                                  const TextStyle(fontWeight: FontWeight.w800)),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),

          const SizedBox(height: 20),
          Row(
            children: [
              const Text('Transaction Ledger',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
              const Spacer(),
              Text('${txs.length} items',
                  style: const TextStyle(fontSize: 12, color: Colors.grey)),
            ],
          ),
          const SizedBox(height: 8),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                ('all', 'All'),
                ('recharge', 'Recharges'),
                ('gift', 'Gifts'),
                ('store', 'Store'),
                ('call', 'Calls'),
              ]
                  .map((e) => Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(e.$2),
                          selected: _txFilter == e.$1,
                          selectedColor: MizoColors.gold,
                          labelStyle: TextStyle(
                            color: _txFilter == e.$1
                                ? const Color(0xFF1E0B3B)
                                : null,
                            fontWeight: FontWeight.w700,
                          ),
                          onSelected: (_) => setState(() => _txFilter = e.$1),
                        ),
                      ))
                  .toList(),
            ),
          ),
          const SizedBox(height: 8),
          if (txs.isEmpty)
            const Card(
              child: Padding(
                padding: EdgeInsets.all(20),
                child: Center(
                  child: Text('No ledger transactions yet. Send a gift or recharge above.'),
                ),
              ),
            )
          else
            ...txs.map((tx) {
              final isIn = tx.direction == 'in';
              return Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: (isIn
                            ? MizoColors.emerald
                            : MizoColors.neonPurple)
                        .withValues(alpha: 0.2),
                    child: Icon(
                      isIn ? Icons.arrow_downward : Icons.arrow_upward,
                      color: isIn ? MizoColors.emerald : MizoColors.gold,
                    ),
                  ),
                  title: Text(tx.title,
                      style: const TextStyle(
                          fontWeight: FontWeight.w700, fontSize: 13)),
                  subtitle: Text('${tx.type.toUpperCase()} · ${tx.timestamp}',
                      style: const TextStyle(fontSize: 11)),
                  trailing: Text(
                    '${isIn ? '+' : '-'}${tx.amount}',
                    style: TextStyle(
                      color: isIn ? MizoColors.emerald : MizoColors.crimson,
                      fontWeight: FontWeight.w900,
                      fontSize: 15,
                    ),
                  ),
                ),
              );
            }),
        ],
      ),
    );
  }

  Widget _miniStat(String label, String val) => Expanded(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          decoration: BoxDecoration(
            color: Colors.black26,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label,
                  style: const TextStyle(color: Colors.white60, fontSize: 10)),
              Text(val,
                  style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                      fontSize: 14)),
            ],
          ),
        ),
      );
}

class LevelDetailsScreen extends StatefulWidget {
  final MizoAppState state;
  const LevelDetailsScreen({super.key, required this.state});

  @override
  State<LevelDetailsScreen> createState() => _LevelDetailsScreenState();
}

class _LevelDetailsScreenState extends State<LevelDetailsScreen> {
  @override
  Widget build(BuildContext context) {
    final s = widget.state;
    final p = s.profile;
    final req = LevelSystem.getXpRequired(p.level);
    final tier = LevelSystem.getTier(p.level);

    return Scaffold(
      appBar: AppBar(title: const Text('Level System (1–99)')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(22),
              gradient: LinearGradient(colors: tier.colors),
              border: Border.all(color: Colors.white24),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('${tier.icon} Level ${p.level} · ${tier.name}',
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.w900)),
                const SizedBox(height: 8),
                LinearProgressIndicator(
                  value: (p.xp / (req == 0 ? 1 : req)).clamp(0.0, 1.0),
                  color: MizoColors.gold,
                  backgroundColor: Colors.black26,
                ),
                const SizedBox(height: 6),
                Text('XP ${p.xp} / $req · Next Level ${p.level + 1}',
                    style:
                        const TextStyle(color: Colors.white70, fontSize: 12)),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  children: [
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: MizoColors.gold,
                        foregroundColor: const Color(0xFF1E0B3B),
                      ),
                      onPressed: () {
                        s.addActivityXp(65, 'Watch Live');
                        setState(() {});
                      },
                      icon: const Icon(Icons.bolt, size: 16),
                      label: const Text('+65 XP Activity'),
                    ),
                    OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.white,
                          side: const BorderSide(color: Colors.white38)),
                      onPressed: () {
                        s.addActivityXp(250, 'Host Bonus');
                        setState(() {});
                      },
                      icon: const Icon(Icons.auto_awesome, size: 16),
                      label: const Text('+250 XP Boost'),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          const Text('All 10 Royal Tiers (Lv.1 – Lv.99)',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
          const SizedBox(height: 10),
          ...LevelSystem.tiers.map((t) {
            final unlocked = p.level >= t.minLevel;
            return Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                leading: CircleAvatar(
                  backgroundColor: t.colors.first,
                  child: Text(t.icon,
                      style: const TextStyle(color: Colors.white)),
                ),
                title: Text(t.name,
                    style: const TextStyle(fontWeight: FontWeight.w800)),
                subtitle: Text('Levels ${t.minLevel} – ${t.maxLevel}'),
                trailing: Icon(
                  unlocked ? Icons.check_circle : Icons.lock_outline,
                  color: unlocked ? MizoColors.emerald : Colors.grey,
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}

class AchievementsScreen extends StatefulWidget {
  final MizoAppState state;
  const AchievementsScreen({super.key, required this.state});

  @override
  State<AchievementsScreen> createState() => _AchievementsScreenState();
}

class _AchievementsScreenState extends State<AchievementsScreen> {
  String _filter = 'all';

  @override
  Widget build(BuildContext context) {
    final s = widget.state;
    final list = s.achievements.where((a) {
      if (_filter == 'earned') return a.earned;
      if (_filter == 'locked') return !a.earned;
      return true;
    }).toList();

    return Scaffold(
      appBar: AppBar(title: const Text('Badges & Achievements')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            children: [
              ('all', 'All (${s.achievements.length})'),
              ('earned',
                  'Earned (${s.achievements.where((a) => a.earned).length})'),
              ('locked',
                  'Locked (${s.achievements.where((a) => !a.earned).length})'),
            ]
                .map((e) => Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(e.$2),
                        selected: _filter == e.$1,
                        selectedColor: MizoColors.gold,
                        labelStyle: TextStyle(
                          color: _filter == e.$1
                              ? const Color(0xFF1E0B3B)
                              : null,
                          fontWeight: FontWeight.w700,
                        ),
                        onSelected: (_) => setState(() => _filter = e.$1),
                      ),
                    ))
                .toList(),
          ),
          const SizedBox(height: 12),
          ...list.map((b) => Card(
                margin: const EdgeInsets.only(bottom: 10),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: b.earned
                        ? MizoColors.gold.withValues(alpha: 0.2)
                        : Colors.white10,
                    child: Text(b.icon, style: const TextStyle(fontSize: 22)),
                  ),
                  title: Text(b.name,
                      style: const TextStyle(fontWeight: FontWeight.w800)),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(b.description, style: const TextStyle(fontSize: 12)),
                      const SizedBox(height: 4),
                      LinearProgressIndicator(
                        value:
                            (b.progress / (b.target == 0 ? 1 : b.target)).clamp(0.0, 1.0),
                        color: b.earned ? MizoColors.gold : MizoColors.neonPurple,
                      ),
                    ],
                  ),
                  trailing: b.earned
                      ? OutlinedButton(
                          onPressed: () {
                            setState(() => b.equipped = !b.equipped);
                            s.showToast(b.equipped
                                ? 'Equipped ${b.name}'
                                : 'Unequipped ${b.name}');
                          },
                          child: Text(b.equipped ? 'Equipped' : 'Equip'),
                        )
                      : Text('${b.progress}/${b.target}',
                          style: const TextStyle(
                              fontSize: 11, color: Colors.grey)),
                ),
              )),
        ],
      ),
    );
  }
}

class AgencyScreen extends StatefulWidget {
  final MizoAppState state;
  const AgencyScreen({super.key, required this.state});

  @override
  State<AgencyScreen> createState() => _AgencyScreenState();
}

class _AgencyScreenState extends State<AgencyScreen> {
  final _inviteCtrl = TextEditingController();
  final List<(String, String, int, String)> _roster = [
    ('Cute Queen', 'Gold Tier Host', 64, '142K Diamonds'),
    ('King Rayan', 'Emperor Host', 82, '310K Diamonds'),
    ('Sweet Girl', 'Rising Host', 45, '78K Diamonds'),
    ('Mr. Khan', 'VIP Partner', 71, '195K Diamonds'),
  ];

  @override
  void dispose() {
    _inviteCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.state;
    return Scaffold(
      appBar: AppBar(title: const Text('Mizo Royal Talent Agency')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(22),
              gradient: MizoColors.neonHeroGradient,
              border: Border.all(color: MizoColors.gold.withValues(alpha: 0.4)),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Agency Code: MIZO-ROYAL-01',
                    style: TextStyle(
                        color: MizoColors.goldLight,
                        fontWeight: FontWeight.w900,
                        fontSize: 16)),
                SizedBox(height: 6),
                Text(
                  'Commission Split: 80% Host · 20% Platform · Real-time Diamonds & PK Bonus payouts.',
                  style: TextStyle(color: Colors.white70, fontSize: 12),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _inviteCtrl,
                  decoration: const InputDecoration(
                      hintText: 'Invite creator handle or ID...'),
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                    backgroundColor: MizoColors.gold,
                    foregroundColor: const Color(0xFF1E0B3B)),
                onPressed: () {
                  final handle = _inviteCtrl.text.trim();
                  if (handle.isEmpty) return;
                  setState(() {
                    _roster.insert(
                        0, (handle, 'Invited Creator', 12, '0 Diamonds'));
                    _inviteCtrl.clear();
                  });
                  s.showToast('Agency invite sent to $handle');
                },
                child: const Text('Invite'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Text('Active Host Roster',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),
          ..._roster.map((m) => Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  leading: const CircleAvatar(
                    backgroundImage: AssetImage(MizoAssets.heroStage),
                  ),
                  title: Row(
                    children: [
                      Text(m.$1,
                          style: const TextStyle(fontWeight: FontWeight.w800)),
                      const SizedBox(width: 6),
                      LevelBadge(level: m.$3),
                    ],
                  ),
                  subtitle: Text(m.$2),
                  trailing: Text(m.$4,
                      style: const TextStyle(
                          color: MizoColors.gold,
                          fontWeight: FontWeight.w800,
                          fontSize: 12)),
                ),
              )),
        ],
      ),
    );
  }
}

class RankingsScreen extends StatefulWidget {
  final MizoAppState state;
  const RankingsScreen({super.key, required this.state});

  @override
  State<RankingsScreen> createState() => _RankingsScreenState();
}

class _RankingsScreenState extends State<RankingsScreen> {
  String _tab = 'Weekly';

  @override
  Widget build(BuildContext context) {
    final s = widget.state;
    final entries = [
      (1, 'King Rayan', MizoAssets.kingRayan, 82, '145,200 pts'),
      (2, 'Mr. Khan', MizoAssets.mrKhan, 71, '118,900 pts'),
      (3, 'Cute Queen', MizoAssets.cuteQueen, 64, '96,400 pts'),
      (4, 'Sweet Girl', MizoAssets.sweetGirl, 45, '72,150 pts'),
      (5, s.profile.username, s.profile.avatar, s.profile.level,
          '${s.profile.spentCoins * 10 + 18400} pts'),
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('Royal Rankings')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            children: ['Weekly', 'Monthly', 'Level', 'Contributor']
                .map((t) => Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(t),
                        selected: _tab == t,
                        selectedColor: MizoColors.gold,
                        labelStyle: TextStyle(
                          color: _tab == t ? const Color(0xFF1E0B3B) : null,
                          fontWeight: FontWeight.w700,
                        ),
                        onSelected: (_) => setState(() => _tab = t),
                      ),
                    ))
                .toList(),
          ),
          const SizedBox(height: 14),
          ...entries.map((e) => Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  leading: Stack(
                    alignment: Alignment.bottomRight,
                    children: [
                      CircleAvatar(backgroundImage: AssetImage(e.$3)),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 5),
                        decoration: BoxDecoration(
                          color: e.$1 == 1
                              ? MizoColors.gold
                              : MizoColors.neonPurple,
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text('#${e.$1}',
                            style: const TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w900,
                                color: Colors.white)),
                      ),
                    ],
                  ),
                  title: Row(
                    children: [
                      Text(e.$2,
                          style: const TextStyle(fontWeight: FontWeight.w800)),
                      const SizedBox(width: 6),
                      LevelBadge(level: e.$4),
                    ],
                  ),
                  subtitle: Text('$_tab Leaderboard'),
                  trailing: Text(e.$5,
                      style: const TextStyle(
                          color: MizoColors.gold, fontWeight: FontWeight.w800)),
                ),
              )),
        ],
      ),
    );
  }
}
