import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.weatherstation.data.model.Severity
import com.weatherstation.data.model.WeatherCondition
import com.weatherstation.data.model.WeatherPrediction

@Composable
fun WeatherConditions(
    prediction: WeatherPrediction,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .padding(8.dp),
        shape = RoundedCornerShape(15.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color(0xFF10101C).copy(alpha = 0.95f)
        ),
        border = BorderStroke(1.dp, Color(0xFF00FFFF))
    ) {
        Column(
            modifier = Modifier
                .padding(20.dp)
                .fillMaxWidth()
        ) {
            // Header
            Text(
                text = "Prognoza",
                color = Color(0xFF00FFFF),
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp)
            )

            // Current conditions
            Text(
                text = "Trenutni uslovi: ${prediction.currentCondition}",
                color = Color(0xFF00FFFF),
                fontSize = 18.sp,
                modifier = Modifier.padding(bottom = 16.dp)
            )

            // Warnings section
            if (prediction.warnings.isNotEmpty()) {
                Text(
                    text = "Upozorenja",
                    color = Color(0xFFFF4444),
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(vertical = 8.dp)
                )

                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp)
                ) {
                    prediction.warnings.forEach { warning ->
                        WarningItem(warning)
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                }
            }
        }
    }
}

@Composable
private fun WarningItem(warning: WeatherCondition) {
    val color = when (warning.severity) {
        Severity.HIGH -> Color(0xFFFF4444)
        Severity.MEDIUM -> Color(0xFFFFFF44)
        Severity.LOW -> Color(0xFF4DFF4D)
    }

    Text(
        text = warning.message,
        color = color,
        fontSize = 14.sp,
        modifier = Modifier
            .fillMaxWidth()
            .border(
                width = 1.dp,
                color = color.copy(alpha = 0.3f),
                shape = RoundedCornerShape(8.dp)
            )
            .padding(12.dp)
    )
} 