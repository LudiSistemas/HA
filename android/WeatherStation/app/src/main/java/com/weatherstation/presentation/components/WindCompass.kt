import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun WindCompass(
    direction: Float,
    speed: Float,
    gust: Float?,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            modifier = Modifier
                .size(150.dp)
                .padding(8.dp)
        ) {
            Canvas(
                modifier = Modifier.fillMaxSize()
            ) {
                // Draw compass circle
                drawCircle(
                    color = Color(0xFF00FFFF).copy(alpha = 0.2f),
                    radius = size.minDimension / 2,
                    center = center
                )
                
                // Draw direction arrow
                rotate(direction) {
                    drawLine(
                        color = Color(0xFF00FFFF),
                        start = center,
                        end = Offset(
                            x = center.x,
                            y = center.y - size.minDimension / 2
                        ),
                        strokeWidth = 8f
                    )
                }
            }
            
            // Direction labels
            Text(
                text = "N",
                color = Color(0xFF00FFFF),
                fontSize = 14.sp,
                modifier = Modifier.align(Alignment.TopCenter)
            )
            Text(
                text = "S",
                color = Color(0xFF00FFFF),
                fontSize = 14.sp,
                modifier = Modifier.align(Alignment.BottomCenter)
            )
            Text(
                text = "E",
                color = Color(0xFF00FFFF),
                fontSize = 14.sp,
                modifier = Modifier.align(Alignment.CenterEnd)
            )
            Text(
                text = "W",
                color = Color(0xFF00FFFF),
                fontSize = 14.sp,
                modifier = Modifier.align(Alignment.CenterStart)
            )
        }
        
        Text(
            text = "$speed m/s",
            color = Color(0xFF00FFFF),
            fontSize = 20.sp
        )
        
        if (gust != null) {
            Text(
                text = "Gust: $gust m/s",
                color = Color(0xFF888888),
                fontSize = 14.sp
            )
        }
        
        Text(
            text = "${direction.toInt()}°",
            color = Color(0xFF888888),
            fontSize = 14.sp
        )
    }
} 