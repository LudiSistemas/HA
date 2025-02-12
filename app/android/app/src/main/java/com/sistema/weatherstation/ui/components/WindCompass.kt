@Composable
fun WindCompass(
    direction: Float,
    speed: Float,
    gust: Float,
    modifier: Modifier = Modifier
) {
    val rotationAngle = direction.toFloat()
    
    Column(
        modifier = modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            modifier = Modifier
                .size(200.dp)
                .padding(16.dp)
        ) {
            // Compass background
            Canvas(
                modifier = Modifier
                    .fillMaxSize()
                    .rotate(rotationAngle)
            ) {
                // Draw compass circle
                drawCircle(
                    color = MaterialTheme.colorScheme.surface,
                    radius = size.minDimension / 2,
                    style = Stroke(width = 2.dp.toPx())
                )
                
                // Draw direction markers
                val directions = listOf("N", "NE", "E", "SE", "S", "SW", "W", "NW")
                directions.forEachIndexed { index, direction ->
                    val angle = index * 45f
                    val radius = size.minDimension / 2 - 20.dp.toPx()
                    val x = center.x + radius * cos(Math.toRadians(angle.toDouble())).toFloat()
                    val y = center.y + radius * sin(Math.toRadians(angle.toDouble())).toFloat()
                    
                    drawContext.canvas.nativeCanvas.apply {
                        rotate(-rotationAngle, center.x, center.y)
                        drawText(
                            direction,
                            x,
                            y,
                            Paint().apply {
                                color = MaterialTheme.colorScheme.onSurface.toArgb()
                                textSize = 14.sp.toPx()
                                textAlign = Paint.Align.CENTER
                            }
                        )
                    }
                }
                
                // Draw arrow
                val arrowPath = Path().apply {
                    moveTo(center.x, center.y - size.minDimension / 3)
                    lineTo(center.x - 10.dp.toPx(), center.y)
                    lineTo(center.x + 10.dp.toPx(), center.y)
                    close()
                }
                drawPath(
                    path = arrowPath,
                    color = MaterialTheme.colorScheme.primary,
                    style = Fill
                )
            }
        }
        
        // Wind speed info
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "Brzina",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                )
                Text(
                    text = "${speed.toInt()} km/h",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.primary
                )
            }
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "Udari",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                )
                Text(
                    text = "${gust.toInt()} km/h",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
} 