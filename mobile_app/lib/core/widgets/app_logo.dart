import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppLogo extends StatelessWidget {
  final double scale;
  final bool showText;
  final Color textColor;

  const AppLogo({
    Key? key,
    this.scale = 1.0,
    this.showText = true,
    this.textColor = Colors.black,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (showText) ...[
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              "QUICKCARTO",
              style: GoogleFonts.inter(
                fontSize: 48 * scale,
                fontWeight: FontWeight.w900,
                fontStyle: FontStyle.italic,
                color: const Color(0xFFE62020),
                letterSpacing: -2.0,
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class ShieldCustomPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFFE62020)
      ..style = PaintingStyle.fill;

    final path = Path();
    path.moveTo(size.width * 0.5, size.height * 0.1);
    path.lineTo(size.width * 0.85, size.height * 0.2);
    path.lineTo(size.width * 0.85, size.height * 0.5);
    path.quadraticBezierTo(
      size.width * 0.85, size.height * 0.8,
      size.width * 0.5, size.height * 0.95,
    );
    path.quadraticBezierTo(
      size.width * 0.15, size.height * 0.8,
      size.width * 0.15, size.height * 0.5,
    );
    path.lineTo(size.width * 0.15, size.height * 0.2);
    path.close();

    canvas.drawPath(path, paint);

    // Draw checkmark
    final checkPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = size.width * 0.08
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    final checkPath = Path();
    checkPath.moveTo(size.width * 0.35, size.height * 0.5);
    checkPath.lineTo(size.width * 0.45, size.height * 0.6);
    checkPath.lineTo(size.width * 0.65, size.height * 0.4);

    canvas.drawPath(checkPath, checkPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// Version with better SVG-like path drawing
class AppShieldIcon extends StatelessWidget {
  final double size;
  const AppShieldIcon({Key? key, this.size = 24}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      size: Size(size, size),
      painter: ShieldCustomPainter(),
    );
  }
}
