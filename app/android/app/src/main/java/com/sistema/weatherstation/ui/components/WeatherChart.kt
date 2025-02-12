@Composable
fun WeatherChart(
    data: HistoricalData,
    modifier: Modifier = Modifier,
    precision: Int,
    unit: String
) {
    val chartEntryModel = remember(data) {
        data.history.mapIndexed { index, item ->
            entryOf(
                index.toFloat(),
                item.state.toFloatOrNull() ?: 0f
            )
        }.let { entries ->
            entryModelOf(entries)
        }
    }

    Column(modifier = modifier) {
        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
        ) {
            Chart(
                chart = lineChart(
                    lines = listOf(
                        lineSpec(
                            lineColor = MaterialTheme.colorScheme.primary,
                            lineBackgroundShader = DynamicShader { bounds ->
                                verticalGradient(
                                    colors = listOf(
                                        MaterialTheme.colorScheme.primary.copy(alpha = 0.5f),
                                        MaterialTheme.colorScheme.primary.copy(alpha = 0.0f)
                                    ),
                                    startY = bounds.top,
                                    endY = bounds.bottom
                                )
                            }
                        )
                    )
                ),
                model = chartEntryModel,
                startAxis = startAxis(
                    valueFormatter = { value ->
                        value.toString().take(precision + 2) + unit
                    },
                    guideline = axisGuidelineComponent(
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f)
                    )
                ),
                bottomAxis = bottomAxis(
                    valueFormatter = { value ->
                        val index = value.toInt()
                        if (index in data.history.indices) {
                            LocalDateTime.parse(
                                data.history[index].lastUpdated.substringBefore("+")
                            ).format(DateTimeFormatter.ofPattern("HH:mm"))
                        } else ""
                    },
                    guideline = axisGuidelineComponent(
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f)
                    )
                ),
                marker = markerComponent(
                    label = { markerEntries ->
                        Column(
                            modifier = Modifier
                                .background(
                                    MaterialTheme.colorScheme.surface,
                                    RoundedCornerShape(4.dp)
                                )
                                .padding(8.dp)
                        ) {
                            markerEntries.forEach { entry ->
                                Text(
                                    text = String.format("%.${precision}f%s", entry.y, unit),
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }
                        }
                    }
                )
            )
        }

        // Min/Max values
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            data.min?.let { min ->
                Text(
                    text = "Min: ${String.format("%.${precision}f%s", min, unit)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                )
            }
            data.max?.let { max ->
                Text(
                    text = "Max: ${String.format("%.${precision}f%s", max, unit)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                )
            }
        }
    }
} 