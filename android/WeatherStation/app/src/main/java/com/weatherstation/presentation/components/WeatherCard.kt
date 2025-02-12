import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.weatherstation.data.model.SensorData
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun WeatherCard(
    sensor: SensorData,
    onClickChart: () -> Unit,
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
            Text(
                text = sensor.attributes.friendlyName,
                color = Color(0xFF888888),
                fontSize = 18.sp
            )
            
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 16.dp),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "${sensor.state}${sensor.attributes.unitOfMeasurement}",
                    color = Color(0xFF00FFFF),
                    fontSize = 36.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            if (sensor.entityId.contains("pressure")) {
                sensor.attributes.absolutePressure?.let { abs ->
                    Text(
                        text = "Absolute: ${abs}${sensor.attributes.unitOfMeasurement}",
                        color = Color(0xFF888888),
                        fontSize = 14.sp
                    )
                }
            }

            Text(
                text = "Last updated: ${formatDateTime(sensor.lastUpdated)}",
                color = Color(0xFF666666),
                fontSize = 12.sp,
                modifier = Modifier.align(Alignment.End)
            )
        }
    }
}

private fun formatDateTime(isoDateTime: String): String {
    return try {
        val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSSSS'Z'", Locale.getDefault())
        inputFormat.timeZone = TimeZone.getTimeZone("UTC")
        val date = inputFormat.parse(isoDateTime)
        
        val outputFormat = SimpleDateFormat("dd.MM.yyyy HH:mm", Locale.getDefault())
        outputFormat.timeZone = TimeZone.getDefault()
        outputFormat.format(date!!)
    } catch (e: Exception) {
        isoDateTime
    }
} 