data class WeatherCondition(
    val message: String,
    val severity: Severity,
    val priority: Int
)

enum class Severity {
    LOW, MEDIUM, HIGH
}

data class WeatherPrediction(
    val currentCondition: String,
    val warnings: List<WeatherCondition>
) 