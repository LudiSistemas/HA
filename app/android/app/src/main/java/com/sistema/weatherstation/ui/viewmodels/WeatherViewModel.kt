class WeatherViewModel : ViewModel() {
    private val _sensors = MutableStateFlow<List<SensorData>>(emptyList())
    val sensors = _sensors.asStateFlow()

    private val _historicalData = MutableStateFlow<Map<String, HistoricalData>>(emptyMap())
    val historicalData = _historicalData.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error = _error.asStateFlow()

    init {
        loadSensors()
    }

    private fun loadSensors() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val response = WeatherApiClient.api.getSensors()
                _sensors.value = response
                response.forEach { sensor ->
                    loadHistory(sensor.entityId)
                }
            } catch (e: Exception) {
                _error.value = e.message
            } finally {
                _isLoading.value = false
            }
        }
    }

    private fun loadHistory(sensorId: String, offset: Int = 0) {
        viewModelScope.launch {
            try {
                val history = WeatherApiClient.api.getSensorHistory(sensorId, offset)
                _historicalData.value = _historicalData.value + (sensorId to history)
            } catch (e: Exception) {
                _error.value = e.message
            }
        }
    }
} 