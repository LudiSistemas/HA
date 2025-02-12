data class SensorConfig(
    val name: String,
    val icon: String,
    val precision: Int,
    val unit: String? = null,
    val description: String? = null,
    val getWarning: ((Double) -> String)? = null
)

object SensorConfigs {
    val configs = mapOf(
        "sensor.ws2900_v2_02_03_outdoor_temperature" to SensorConfig(
            name = "Spoljna temperatura",
            icon = "🌡️",
            precision = 1
        ),
        "sensor.ws2900_v2_02_03_relative_pressure" to SensorConfig(
            name = "Atmosferski pritisak",
            icon = "🌪️",
            precision = 0
        ),
        "sensor.ws2900_v2_02_03_humidity" to SensorConfig(
            name = "Vlažnost vazduha",
            icon = "💧",
            precision = 0
        ),
        "sensor.ws2900_v2_02_03_solar_radiation" to SensorConfig(
            name = "Sunčevo zračenje",
            icon = "☀️",
            precision = 0,
            unit = "W/m²"
        ),
        "sensor.ws2900_v2_02_03_uv_index" to SensorConfig(
            name = "UV indeks",
            icon = "🌞",
            precision = 1,
            getWarning = { value ->
                when {
                    value >= 11 -> "Ekstremno! Izbegavajte sunce od 10-16h"
                    value >= 8 -> "Vrlo visok! Koristite zaštitu"
                    value >= 6 -> "Visok! Potrebna zaštita"
                    value >= 3 -> "Umeren. Preporučena zaštita"
                    else -> "Nizak. Bezbedno"
                }
            }
        ),
        "sensor.ws2900_v2_02_03_wind_direction" to SensorConfig(
            name = "Smer vetra",
            icon = "🧭",
            precision = 0,
            description = "compass"
        ),
        "sensor.ws2900_v2_02_03_wind_speed" to SensorConfig(
            name = "Brzina vetra",
            icon = "💨",
            precision = 1
        ),
        "sensor.ws2900_v2_02_03_wind_gust" to SensorConfig(
            name = "Udari vetra",
            icon = "💨",
            precision = 1
        ),
        "sensor.ws2900_v2_02_03_hourly_rain_rate" to SensorConfig(
            name = "Količina padavina",
            icon = "🌧️",
            precision = 1,
            unit = "mm/h"
        ),
        "sensor.ws2900_v2_02_03_absolute_pressure" to SensorConfig(
            name = "Atmosferski pritisak",
            icon = "🌪️",
            precision = 1,
            description = "Pritisak sveden na nivo mora",
            unit = "hPa"
        )
    )
} 