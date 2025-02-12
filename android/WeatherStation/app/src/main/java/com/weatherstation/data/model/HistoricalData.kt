data class HistoricalData(
    val min: Double?,
    val max: Double?,
    val current: Double?,
    val history: List<SensorData>,
    val startTime: String,
    val endTime: String,
    val hasMore: Boolean
) 