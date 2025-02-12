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
    // For pressure sensors
    val absolutePressure: Double? = null,
    val relativePressure: Double? = null
) 