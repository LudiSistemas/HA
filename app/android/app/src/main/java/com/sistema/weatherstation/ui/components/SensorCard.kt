@Composable
fun SensorCard(
    sensor: SensorData,
    historicalData: HistoricalData?,
    config: SensorConfig,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .padding(8.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.1f)
        )
    ) {
        Column(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth()
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "${config.icon} ${config.name}",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }

            // Value
            Text(
                text = "${sensor.state}${config.unit ?: sensor.attributes.unitOfMeasurement}",
                style = MaterialTheme.typography.headlineLarge,
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.padding(vertical = 8.dp)
            )

            // Special handling for pressure
            if (sensor.entityId.contains("pressure")) {
                sensor.attributes.absolutePressure?.let { abs ->
                    Text(
                        text = "Apsolutni: $abs ${config.unit ?: sensor.attributes.unitOfMeasurement}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                    )
                }
            }

            // UV Index warning
            if (sensor.entityId.contains("uv_index")) {
                config.getWarning?.let { warning ->
                    Text(
                        text = warning(sensor.state.toDoubleOrNull() ?: 0.0),
                        style = MaterialTheme.typography.bodyMedium,
                        color = if ((sensor.state.toDoubleOrNull() ?: 0.0) >= 6) 
                            MaterialTheme.colorScheme.error
                        else 
                            MaterialTheme.colorScheme.secondary
                    )
                }
            }

            // Chart
            historicalData?.let { data ->
                WeatherChart(
                    data = data,
                    modifier = Modifier
                        .height(200.dp)
                        .fillMaxWidth()
                        .padding(top = 16.dp),
                    precision = config.precision,
                    unit = config.unit ?: sensor.attributes.unitOfMeasurement
                )
            }

            // Last updated
            Text(
                text = "Poslednji put ažurirano: ${
                    LocalDateTime.parse(sensor.lastUpdated.substringBefore("+"))
                        .format(DateTimeFormatter.ofPattern("dd.MM.yyyy. HH:mm:ss"))
                }",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                modifier = Modifier.padding(top = 8.dp)
            )
        }
    }
} 