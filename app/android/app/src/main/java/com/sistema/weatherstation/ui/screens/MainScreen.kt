@Composable
fun MainScreen(
    viewModel: WeatherViewModel = viewModel()
) {
    val sensors by viewModel.sensors.collectAsState()
    val historicalData by viewModel.historicalData.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()

    WeatherStationTheme {
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = MaterialTheme.colorScheme.background
        ) {
            Box {
                if (isLoading && sensors.isEmpty()) {
                    CircularProgressIndicator(
                        modifier = Modifier
                            .size(50.dp)
                            .align(Alignment.Center),
                        color = MaterialTheme.colorScheme.primary
                    )
                }

                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    items(sensors) { sensor ->
                        val config = SensorConfigs.configs[sensor.entityId]
                        if (config != null) {
                            if (sensor.entityId.contains("wind_direction")) {
                                // Find speed and gust sensors
                                val speedSensor = sensors.find { it.entityId.contains("wind_speed") }
                                val gustSensor = sensors.find { it.entityId.contains("wind_gust") }
                                WindCompass(
                                    direction = sensor.state.toFloatOrNull() ?: 0f,
                                    speed = speedSensor?.state?.toFloatOrNull() ?: 0f,
                                    gust = gustSensor?.state?.toFloatOrNull() ?: 0f,
                                    modifier = Modifier.fillMaxWidth()
                                )
                            } else {
                                SensorCard(
                                    sensor = sensor,
                                    historicalData = historicalData[sensor.entityId],
                                    config = config
                                )
                            }
                        }
                    }
                }

                error?.let { errorMessage ->
                    Snackbar(
                        modifier = Modifier
                            .align(Alignment.BottomCenter)
                            .padding(16.dp),
                        action = {
                            TextButton(onClick = { viewModel.clearError() }) {
                                Text("OK")
                            }
                        }
                    ) {
                        Text(errorMessage)
                    }
                }
            }
        }
    }
} 