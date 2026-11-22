import 'package:flutter/material.dart';
import '../models/mizo_models.dart';
import '../state/mizo_app_state.dart';
import '../theme/mizo_theme.dart';
import '../widgets/mizo_widgets.dart';

class StoreScreen extends StatefulWidget {
  final MizoAppState state;
  final VoidCallback onOpenWallet;

  const StoreScreen({
    super.key,
    required this.state,
    required this.onOpenWallet,
  });

  @override
  State<StoreScreen> createState() => _StoreScreenState();
}

class _StoreScreenState extends State<StoreScreen> {
  StoreCategory _selected = StoreCategory.vipFrames;

  @override
  Widget build(BuildContext context) {
    final s = widget.state;
    final items =
        s.storeItems.where((item) => item.category == _selected).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mizo Royal Store',
            style: TextStyle(fontWeight: FontWeight.w800)),
        actions: [
          GoldCoinPill(coins: s.profile.coins, onTap: widget.onOpenWallet),
          const SizedBox(width: 8),
          IconButton(
            onPressed: () {
              final owned = s.storeItems.where((e) => e.owned).toList();
              showModalBottomSheet(
                context: context,
                backgroundColor: MizoColors.royalCard,
                builder: (_) => ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    Text('Owned Assets (${owned.length})',
                        style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: Colors.white)),
                    const SizedBox(height: 10),
                    ...owned.map((item) => ListTile(
                          title: Text(item.name,
                              style: const TextStyle(color: Colors.white)),
                          subtitle: Text(item.category.label,
                              style: const TextStyle(
                                  color: Colors.white60, fontSize: 12)),
                          trailing: ElevatedButton(
                            onPressed: () {
                              s.toggleEquipStoreItem(item);
                              Navigator.pop(context);
                            },
                            child: Text(item.equipped ? 'Unequip' : 'Equip'),
                          ),
                        )),
                  ],
                ),
              );
            },
            icon: const Icon(Icons.inventory_2_outlined),
          ),
        ],
      ),
      body: Column(
        children: [
          SizedBox(
            height: 48,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
              scrollDirection: Axis.horizontal,
              itemCount: StoreCategory.values.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (_, idx) {
                final cat = StoreCategory.values[idx];
                final active = cat == _selected;
                return ChoiceChip(
                  label: Text(cat.label),
                  selected: active,
                  selectedColor: MizoColors.gold,
                  labelStyle: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: active ? const Color(0xFF1E0B3B) : null,
                  ),
                  onSelected: (_) => setState(() => _selected = cat),
                );
              },
            ),
          ),
          Expanded(
            child: LayoutBuilder(
              builder: (_, constraints) {
                final cols = constraints.maxWidth >= 960
                    ? 4
                    : (constraints.maxWidth >= 620 ? 3 : 2);
                return GridView.builder(
                  padding: const EdgeInsets.all(14),
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: cols,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 0.78,
                  ),
                  itemCount: items.length,
                  itemBuilder: (_, idx) {
                    final item = items[idx];
                    return Card(
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            ProfileFrameAvatar(
                              imageAsset: s.profile.avatar,
                              size: 56,
                              frameId: item.id,
                            ),
                            Column(
                              children: [
                                Text(item.name,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                        fontWeight: FontWeight.w800,
                                        fontSize: 13)),
                                const SizedBox(height: 2),
                                Text(item.subtitle,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                        fontSize: 10, color: Colors.white60)),
                              ],
                            ),
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: item.equipped
                                      ? MizoColors.emerald
                                      : item.owned
                                          ? MizoColors.royalPurple
                                          : MizoColors.gold,
                                  foregroundColor: item.owned
                                      ? Colors.white
                                      : const Color(0xFF1E0B3B),
                                ),
                                onPressed: () async {
                                  if (!item.owned) {
                                    final ok = await ensureAuthenticatedOrPrompt(
                                        context, s, 'purchase ${item.name}');
                                    if (!ok) return;
                                  }
                                  final status =
                                      await s.purchaseOrEquipStoreItem(item);
                                  if (status == 'insufficient' && mounted) {
                                    widget.onOpenWallet();
                                  }
                                },
                                child: Text(
                                  item.equipped
                                      ? 'Equipped'
                                      : item.owned
                                          ? 'Equip'
                                          : '${item.price} Coins',
                                  style: const TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w800),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
