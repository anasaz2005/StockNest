package com.codebxo.inventory



import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// Same palette as the web app
val Bg = Color(0xFF080A12)
val Panel = Color(0xFF101420)
val Panel2 = Color(0xFF171C2B)
val Line = Color(0xFF232A3D)
val Line2 = Color(0xFF2E3650)
val Ink = Color(0xFFE9ECF8)
val Soft = Color(0xFFB4BAD3)
val Muted = Color(0xFF8991AD)
val Brand = Color(0xFF6D6BFF)
val Brand2 = Color(0xFF8B5CF6)
val Cyan = Color(0xFF22D3EE)
val Pink = Color(0xFFF472B6)
val Amber = Color(0xFFFBBF24)
val Mint = Color(0xFF34D399)
val Rose = Color(0xFFFB7185)

private val Scheme = darkColorScheme(
    primary = Brand, onPrimary = Color.White, secondary = Cyan, onSecondary = Color.Black, tertiary = Brand2,
    background = Bg, onBackground = Ink, surface = Panel, onSurface = Ink,
    surfaceVariant = Panel2, onSurfaceVariant = Muted,
    outline = Color(0xFF3A4366), outlineVariant = Line, error = Rose, onError = Color.Black,
    surfaceTint = Color.Transparent,
    surfaceContainer = Panel, surfaceContainerHigh = Panel2, surfaceContainerHighest = Panel2,
    surfaceContainerLow = Panel, surfaceContainerLowest = Bg
)

private val AppShapes = Shapes(
    extraSmall = RoundedCornerShape(12.dp), small = RoundedCornerShape(12.dp),
    medium = RoundedCornerShape(16.dp), large = RoundedCornerShape(20.dp), extraLarge = RoundedCornerShape(24.dp)
)

@Composable
fun AppTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = Scheme, shapes = AppShapes, content = content)
}

fun Modifier.appBackground(): Modifier =
    this.background(Brush.verticalGradient(listOf(Color(0xFF111634), Bg, Bg)))

val BrandGradient = Brush.horizontalGradient(listOf(Color(0xFF5B5BF5), Brand2, Cyan))

@Composable
fun GradientButton(text: String, onClick: () -> Unit, modifier: Modifier = Modifier, enabled: Boolean = true) {
    Box(
        modifier.clip(RoundedCornerShape(14.dp))
            .background(if (enabled) BrandGradient else SolidColor(Line2))
            .clickable(enabled = enabled, onClick = onClick).padding(vertical = 14.dp),
        contentAlignment = Alignment.Center
    ) { Text(text, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp) }
}

@Composable
fun AppCard(modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) {
    Card(
        modifier, shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = Panel2, contentColor = Ink),
        border = BorderStroke(1.dp, Line), content = content
    )
}

@Composable
fun StatCard(label: String, value: String, accent: Color, modifier: Modifier = Modifier) {
    AppCard(modifier) {
        Box(Modifier.fillMaxWidth().height(3.dp).background(accent))
        Column(Modifier.padding(16.dp)) {
            Text(label, color = Muted, fontSize = 13.sp)
            Text(value, color = if (accent == Rose) Rose else Ink, fontSize = 24.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun Pill(text: String, color: Color) {
    Box(Modifier.clip(RoundedCornerShape(99.dp)).background(color.copy(alpha = 0.16f)).padding(horizontal = 10.dp, vertical = 3.dp)) {
        Text(text, color = color, fontSize = 12.sp, fontWeight = FontWeight.Bold)
    }
}