import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mizolive/data/mizo_seed_data.dart';
import 'package:mizolive/models/mizo_models.dart';
import 'package:mizolive/state/mizo_app_state.dart';
import 'package:mizolive/theme/mizo_theme.dart';
import 'package:mizolive/widgets/mizo_widgets.dart';

void main() {
  group('MizoLive Domain Models & State', () {
    test('LevelSystem covers Levels 1 to 99 across 10 tiers', () {
      expect(LevelSystem.maxLevel, 99);
      expect(LevelSystem.tiers.length, 10);
      expect(LevelSystem.getTier(1).name, 'Beginner');
      expect(LevelSystem.getTier(99).name, 'Legendary Member');
      expect(LevelSystem.getXpRequired(1), greaterThan(0));
      expect(
        LevelSystem.getXpRequired(99),
        greaterThan(LevelSystem.getXpRequired(1)),
      );
    });

    test('Store supports all 8 categories and seed items', () {
      expect(StoreCategory.values.length, 8);
      final items = buildInitialStoreItems();
      expect(items.length, greaterThanOrEqualTo(8));
      for (final cat in StoreCategory.values) {
        expect(items.any((i) => i.category == cat), isTrue);
      }
    });

    test('Multi-guest rooms support 4, 6, 9, and 12 seat capacities', () {
      final rooms = buildInitialRooms();
      final capacities = rooms.map((r) => r.seatCapacity).toSet();
      expect(capacities.containsAll({4, 6, 9, 12}), isTrue);
    });

    test('AppState XP progression increments level correctly', () {
      final state = MizoAppState();
      final initialLevel = state.profile.level;
      state.addActivityXp(50000);
      expect(state.profile.level, greaterThan(initialLevel));
      expect(state.profile.level, lessThanOrEqualTo(LevelSystem.maxLevel));
    });
  });

  group('MizoLive Multi-Platform Widget Smoke Tests', () {
    testWidgets('Mobile bottom navigation renders all 7 required items',
        (tester) async {
      MainTab selected = MainTab.home;
      bool createTapped = false;

      await tester.pumpWidget(
        MaterialApp(
          theme: MizoTheme.darkTheme(),
          home: Scaffold(
            bottomNavigationBar: MizoBottomNavBar(
              activeTab: selected,
              unreadCount: 4,
              onSelectTab: (tab) => selected = tab,
              onOpenCreate: () => createTapped = true,
            ),
          ),
        ),
      );

      for (final label in [
        'Home',
        'Rooms',
        'Store',
        'Videos',
        'Chat',
        'Profile',
      ]) {
        expect(find.text(label), findsOneWidget);
      }

      await tester.tap(find.byIcon(Icons.add_rounded));
      await tester.pump();
      expect(createTapped, isTrue);

      await tester.tap(find.text('Store'));
      await tester.pump();
      expect(selected, MainTab.store);
    });

    testWidgets('Desktop NavigationRail switches tabs cleanly', (tester) async {
      MainTab selected = MainTab.home;
      await tester.pumpWidget(
        MaterialApp(
          theme: MizoTheme.darkTheme(),
          home: Scaffold(
            body: Row(
              children: [
                MizoDesktopRail(
                  activeTab: selected,
                  unreadCount: 2,
                  onSelectTab: (tab) => selected = tab,
                  onOpenCreate: () {},
                ),
                const Expanded(child: SizedBox()),
              ],
            ),
          ),
        ),
      );

      await tester.tap(find.text('Rooms'));
      await tester.pump();
      expect(selected, MainTab.rooms);
    });
  });
}
