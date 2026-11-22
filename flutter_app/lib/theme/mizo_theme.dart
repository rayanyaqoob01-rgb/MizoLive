import 'package:flutter/material.dart';

class MizoColors {
  // Luxury Brand Palette
  static const Color obsidian = Color(0xFF06040B);
  static const Color royalCard = Color(0xFF140B26);
  static const Color royalSurface = Color(0xFF1E0F3B);
  static const Color royalPurple = Color(0xFF7C3AED);
  static const Color neonPurple = Color(0xFFA855F7);
  static const Color magentaAccent = Color(0xFFEC4899);
  static const Color goldLight = Color(0xFFFEF08A);
  static const Color gold = Color(0xFFFACC15);
  static const Color goldDark = Color(0xFFB45309);
  static const Color emerald = Color(0xFF34D399);
  static const Color crimson = Color(0xFFF43F5E);

  // Light Mode Equivalents
  static const Color lightBackground = Color(0xFFF7F4FF);
  static const Color lightCard = Color(0xFFFFFFFF);
  static const Color lightSurface = Color(0xFFEDE6FA);

  static const LinearGradient goldGradient = LinearGradient(
    colors: [goldLight, gold, Color(0xFFD97706)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient purpleGradient = LinearGradient(
    colors: [Color(0xFF9333EA), Color(0xFF581C87)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient neonHeroGradient = LinearGradient(
    colors: [Color(0xFF2D0E57), Color(0xFF16082E), Color(0xFF090414)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}

class MizoTheme {
  static ThemeData darkTheme() {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: MizoColors.obsidian,
      colorScheme: const ColorScheme.dark(
        primary: MizoColors.neonPurple,
        secondary: MizoColors.gold,
        surface: MizoColors.royalCard,
        error: MizoColors.crimson,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Color(0xFF0A0514),
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
      ),
      cardTheme: CardThemeData(
        color: MizoColors.royalCard,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(color: MizoColors.neonPurple.withValues(alpha: 0.28)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFF160C2B),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: MizoColors.neonPurple.withValues(alpha: 0.35)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: MizoColors.neonPurple.withValues(alpha: 0.30)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: MizoColors.gold, width: 1.5),
        ),
      ),
    );
  }

  static ThemeData lightTheme() {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: MizoColors.lightBackground,
      colorScheme: const ColorScheme.light(
        primary: MizoColors.royalPurple,
        secondary: Color(0xFFD97706),
        surface: MizoColors.lightCard,
        error: MizoColors.crimson,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: Color(0xFF1A0835),
        elevation: 0,
        centerTitle: false,
      ),
      cardTheme: CardThemeData(
        color: MizoColors.lightCard,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(color: MizoColors.royalPurple.withValues(alpha: 0.18)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: MizoColors.lightSurface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: MizoColors.royalPurple.withValues(alpha: 0.25)),
        ),
      ),
    );
  }
}
