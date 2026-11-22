import 'package:flutter/material.dart';
import '../services/firebase_service.dart';
import '../state/mizo_app_state.dart';
import '../theme/mizo_theme.dart';
import '../widgets/mizo_widgets.dart';

class SplashScreenView extends StatelessWidget {
  const SplashScreenView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: MizoColors.obsidian,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const MizoLogoMark(size: 88),
            const SizedBox(height: 18),
            RichText(
              text: const TextSpan(
                style: TextStyle(fontSize: 30, fontWeight: FontWeight.w900),
                children: [
                  TextSpan(text: 'MIZO ', style: TextStyle(color: Colors.white)),
                  TextSpan(text: 'LIVE', style: TextStyle(color: MizoColors.gold)),
                ],
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'LIVE · CONNECT · ENJOY',
              style: TextStyle(
                color: Colors.white60,
                letterSpacing: 2.5,
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 22),
            const SizedBox(
              width: 140,
              child: LinearProgressIndicator(
                color: MizoColors.gold,
                backgroundColor: MizoColors.royalSurface,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class AuthScreenView extends StatefulWidget {
  final MizoAppState state;
  final VoidCallback onClose;

  const AuthScreenView({
    super.key,
    required this.state,
    required this.onClose,
  });

  @override
  State<AuthScreenView> createState() => _AuthScreenViewState();
}

class _AuthScreenViewState extends State<AuthScreenView> {
  String _mode = 'welcome'; // welcome | login | signup | forgot | phone
  final _emailCtrl = TextEditingController();
  final _pwdCtrl = TextEditingController();
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _otpCtrl = TextEditingController();
  PhoneOtpSession? _otpSession;
  bool _obscure = true;
  bool _busy = false;
  String? _error;
  String? _success;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _pwdCtrl.dispose();
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _otpCtrl.dispose();
    super.dispose();
  }

  Future<void> _runAuth(Future<void> Function() task, {String? onOk}) async {
    setState(() {
      _busy = true;
      _error = null;
      _success = null;
    });
    try {
      await task();
      if (onOk != null && mounted) {
        setState(() => _success = onOk);
      } else {
        widget.onClose();
      }
    } catch (e) {
      if (mounted) {
        setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: MizoColors.obsidian.withValues(alpha: 0.96),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Container(
              constraints: const BoxConstraints(maxWidth: 420),
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                gradient: MizoColors.neonHeroGradient,
                borderRadius: BorderRadius.circular(28),
                border: Border.all(
                  color: MizoColors.neonPurple.withValues(alpha: 0.45),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      if (_mode != 'welcome')
                        TextButton.icon(
                          onPressed: () => setState(() {
                            _mode = 'welcome';
                            _otpSession = null;
                            _error = null;
                            _success = null;
                          }),
                          icon: const Icon(Icons.arrow_back,
                              size: 16, color: MizoColors.gold),
                          label: const Text('Back',
                              style: TextStyle(color: MizoColors.gold)),
                        )
                      else
                        const SizedBox.shrink(),
                      IconButton(
                        onPressed: widget.onClose,
                        icon: const Icon(Icons.close, color: Colors.white70),
                      ),
                    ],
                  ),
                  const Center(child: MizoLogoMark(size: 56)),
                  const SizedBox(height: 12),
                  Text(
                    switch (_mode) {
                      'login' => 'Sign In',
                      'signup' => 'Create Account',
                      'forgot' => 'Recover Password',
                      'phone' => 'Phone OTP Verification',
                      _ => 'Welcome to MizoLive',
                    },
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Luxury Live Streaming · Party Rooms · Short Videos · Gifts',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 12, color: Colors.white70),
                  ),
                  const SizedBox(height: 16),
                  if (_error != null)
                    Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: MizoColors.crimson.withValues(alpha: 0.18),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: MizoColors.crimson),
                      ),
                      child: Text(_error!,
                          style: const TextStyle(
                              color: Color(0xFFFDA4AF), fontSize: 12)),
                    ),
                  if (_success != null)
                    Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: MizoColors.emerald.withValues(alpha: 0.18),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: MizoColors.emerald),
                      ),
                      child: Text(_success!,
                          style: const TextStyle(
                              color: Color(0xFFA7F3D0), fontSize: 12)),
                    ),
                  if (_mode == 'welcome') ...[
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: const Color(0xFF1E0B3B),
                        minimumSize: const Size.fromHeight(48),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16)),
                      ),
                      onPressed: _busy
                          ? null
                          : () => _runAuth(
                              MizoFirebaseService.instance.signInWithGoogle),
                      icon: const Icon(Icons.g_mobiledata, size: 28),
                      label: const Text('Continue with Google',
                          style: TextStyle(fontWeight: FontWeight.w800)),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: MizoColors.royalPurple,
                              foregroundColor: Colors.white,
                              minimumSize: const Size.fromHeight(46),
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(14)),
                            ),
                            onPressed: () => setState(() => _mode = 'login'),
                            child: const Text('Email Login'),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: MizoColors.gold,
                              foregroundColor: const Color(0xFF1E0B3B),
                              minimumSize: const Size.fromHeight(46),
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(14)),
                            ),
                            onPressed: () => setState(() => _mode = 'signup'),
                            child: const Text('Register',
                                style: TextStyle(fontWeight: FontWeight.w800)),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.white,
                        side: BorderSide(
                            color: MizoColors.neonPurple.withValues(alpha: 0.6)),
                        minimumSize: const Size.fromHeight(44),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14)),
                      ),
                      onPressed: () => setState(() => _mode = 'phone'),
                      icon: const Icon(Icons.sms_outlined, size: 18),
                      label: const Text('Phone SMS OTP Sign In'),
                    ),
                    const SizedBox(height: 10),
                    OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: MizoColors.goldLight,
                        side: BorderSide(
                            color: MizoColors.gold.withValues(alpha: 0.45)),
                        minimumSize: const Size.fromHeight(44),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14)),
                      ),
                      onPressed: _busy
                          ? null
                          : () => _runAuth(() async {
                                try {
                                  await MizoFirebaseService.instance
                                      .signInAsGuest();
                                } catch (_) {
                                  // Allow guest browsing when anonymous provider is off
                                }
                              }),
                      icon: const Icon(Icons.auto_awesome, size: 18),
                      label: const Text('Explore as Guest'),
                    ),
                  ] else if (_mode == 'phone') ...[
                    TextField(
                      controller: _phoneCtrl,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(
                        labelText: 'Phone Number (E.164 e.g. +14155550100)',
                        prefixIcon: Icon(Icons.phone_outlined),
                      ),
                    ),
                    if (_otpSession != null) ...[
                      const SizedBox(height: 10),
                      TextField(
                        controller: _otpCtrl,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          labelText: '6-Digit SMS OTP Code',
                          prefixIcon: Icon(Icons.pin_outlined),
                        ),
                      ),
                    ],
                    const SizedBox(height: 14),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: MizoColors.gold,
                        foregroundColor: const Color(0xFF1E0B3B),
                        minimumSize: const Size.fromHeight(48),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14)),
                      ),
                      onPressed: _busy
                          ? null
                          : () async {
                              if (_otpSession == null) {
                                await _runAuth(() async {
                                  final session = await MizoFirebaseService
                                      .instance
                                      .startPhoneOtp(_phoneCtrl.text);
                                  if (!session.autoSignedIn && mounted) {
                                    setState(() => _otpSession = session);
                                  }
                                },
                                    onOk:
                                        'OTP verification code sent via SMS.');
                              } else {
                                await _runAuth(() => MizoFirebaseService
                                    .instance
                                    .verifyPhoneOtp(_otpSession!, _otpCtrl.text));
                              }
                            },
                      child: Text(
                        _busy
                            ? 'Verifying...'
                            : _otpSession == null
                                ? 'Send OTP Code'
                                : 'Verify OTP & Sign In',
                        style: const TextStyle(fontWeight: FontWeight.w800),
                      ),
                    ),
                  ] else ...[
                    if (_mode == 'signup') ...[
                      TextField(
                        controller: _nameCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Stage Username',
                          prefixIcon: Icon(Icons.person_outline),
                        ),
                      ),
                      const SizedBox(height: 10),
                    ],
                    TextField(
                      controller: _emailCtrl,
                      keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(
                        labelText: 'Email Address',
                        prefixIcon: Icon(Icons.mail_outline),
                      ),
                    ),
                    if (_mode != 'forgot') ...[
                      const SizedBox(height: 10),
                      TextField(
                        controller: _pwdCtrl,
                        obscureText: _obscure,
                        decoration: InputDecoration(
                          labelText: 'Password',
                          prefixIcon: const Icon(Icons.lock_outline),
                          suffixIcon: IconButton(
                            icon: Icon(_obscure
                                ? Icons.visibility_off
                                : Icons.visibility),
                            onPressed: () =>
                                setState(() => _obscure = !_obscure),
                          ),
                        ),
                      ),
                    ],
                    if (_mode == 'login')
                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton(
                          onPressed: () => setState(() => _mode = 'forgot'),
                          child: const Text('Forgot Password?',
                              style: TextStyle(color: MizoColors.gold)),
                        ),
                      ),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: MizoColors.gold,
                        foregroundColor: const Color(0xFF1E0B3B),
                        minimumSize: const Size.fromHeight(48),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14)),
                      ),
                      onPressed: _busy
                          ? null
                          : () {
                              if (_mode == 'login') {
                                _runAuth(() => MizoFirebaseService.instance
                                    .signInWithEmail(
                                        _emailCtrl.text, _pwdCtrl.text));
                              } else if (_mode == 'signup') {
                                _runAuth(
                                  () => MizoFirebaseService.instance
                                      .signUpWithEmail(_emailCtrl.text,
                                          _pwdCtrl.text, _nameCtrl.text),
                                  onOk:
                                      'Account created! Verification email sent.',
                                );
                              } else {
                                _runAuth(
                                  () => MizoFirebaseService.instance
                                      .sendPasswordReset(_emailCtrl.text),
                                  onOk: 'Password reset link sent to email.',
                                );
                              }
                            },
                      child: Text(
                        _busy
                            ? 'Please wait...'
                            : _mode == 'login'
                                ? 'Sign In'
                                : _mode == 'signup'
                                    ? 'Create Account'
                                    : 'Send Reset Email',
                        style: const TextStyle(fontWeight: FontWeight.w800),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
