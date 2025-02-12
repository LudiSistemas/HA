import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.weatherstation.presentation.MainViewModel
import com.weatherstation.presentation.components.WeatherCard
import com.weatherstation.presentation.components.WindCompass

@Composable
fun MainScreen(
    viewModel: MainViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp)
    ) {
        if (state.isLoading) {
            item {
                Box(
                    modifier = Modifier.fillParentMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                }
            }
        }

        state.error?.let { error ->
            item {
                Text(
                    text = error,
                    color = MaterialTheme.colorScheme.error,
                    modifier = Modifier.padding(16.dp)
                )
            }
        }

        state.sensors?.let { sensors ->
            items(sensors) { sensor ->
                when {
                    sensor.entityId.contains("wind_direction") -> {
                        val speed = state.sensors.find { it.entityId.contains("wind_speed") }?.state?.toFloatOrNull() ?: 0f
                        val gust = state.sensors.find { it.entityId.contains("wind_gust") }?.state?.toFloatOrNull()
                        
                        WindCompass(
                            direction = sensor.state.toFloatOrNull() ?: 0f,
                            speed = speed,
                            gust = gust,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                    else -> {
                        WeatherCard(
                            sensor = sensor,
                            onClickChart = { viewModel.loadHistory(sensor.entityId) }
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(8.dp))
            }
        }
    }
} 