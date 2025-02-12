data class SensorData(
    val entityId: String,
    val state: String,
    val attributes: SensorAttributes,
    val lastUpdated: String
)

data class SensorAttributes(
    val unitOfMeasurement: String,
    val friendlyName: String,
    val stateClass: String? = "measurement",
    val deviceClass: String? = null,
    val absolutePressure: Double? = null,
    val relativePressure: Double? = null
)

data class HistoricalData(
    val min: Double?,
    val max: Double?,
    val current: Double?,
    val history: List<HistoryItem>,
    val startTime: String,
    val endTime: String,
    val hasMore: Boolean
)

data class HistoryItem(
    val state: String,
    val lastUpdated: String
) 