import com.weatherstation.data.model.SensorData
import com.weatherstation.data.model.Severity
import com.weatherstation.data.model.WeatherCondition
import com.weatherstation.data.model.WeatherPrediction
import kotlin.math.abs

object WeatherAnalyzer {
    fun analyzeConditions(sensors: List<SensorData>): WeatherPrediction {
        val temperature = sensors.find { it.entityId.contains("temperature") }?.state?.toDoubleOrNull()
        val humidity = sensors.find { it.entityId.contains("humidity") }?.state?.toDoubleOrNull()
        val pressure = sensors.find { it.entityId.contains("pressure") }?.state?.toDoubleOrNull()
        val windSpeed = sensors.find { it.entityId.contains("wind_speed") }?.state?.toDoubleOrNull()
        val uvIndex = sensors.find { it.entityId.contains("uv_index") }?.state?.toDoubleOrNull()

        val currentCondition = getCurrentCondition(temperature, humidity, windSpeed)
        val warnings = mutableListOf<WeatherCondition>()

        // Temperature warnings
        temperature?.let {
            when {
                it > 35 -> warnings.add(
                    WeatherCondition(
                        "🌡️ UPOZORENJE: Ekstremno visoke temperature! Izbegavati napor i direktno sunce",
                        Severity.HIGH,
                        1
                    )
                )
                it > 30 -> warnings.add(
                    WeatherCondition(
                        "🌡️ Visoke temperature - preporučuje se izbegavanje fizičkih aktivnosti",
                        Severity.MEDIUM,
                        2
                    )
                )
                it < -10 -> warnings.add(
                    WeatherCondition(
                        "❄️ Ekstremno niske temperature! Potrebna zaštita od hladnoće",
                        Severity.HIGH,
                        1
                    )
                )
            }
        }

        // UV Index warnings
        uvIndex?.let {
            when {
                it >= 11 -> warnings.add(
                    WeatherCondition(
                        "🌞 EKSTREMNO UV zračenje! Obavezno izbegavati sunce od 10-16h",
                        Severity.HIGH,
                        1
                    )
                )
                it >= 8 -> warnings.add(
                    WeatherCondition(
                        "🌞 Vrlo visok UV indeks! Koristiti zaštitu i izbegavati sunce od 11-15h",
                        Severity.HIGH,
                        2
                    )
                )
                it >= 6 -> warnings.add(
                    WeatherCondition(
                        "🌞 Visok UV indeks! Potrebna zaštita od sunca",
                        Severity.MEDIUM,
                        3
                    )
                )
            }
        }

        // Pressure warnings
        pressure?.let {
            when {
                it < 1000 -> warnings.add(
                    WeatherCondition(
                        "🌧️ Nizak pritisak - povećana verovatnoća padavina",
                        Severity.MEDIUM,
                        3
                    )
                )
                it > 1020 -> warnings.add(
                    WeatherCondition(
                        "☀️ Visok pritisak - stabilno vreme",
                        Severity.LOW,
                        4
                    )
                )
            }
        }

        return WeatherPrediction(
            currentCondition = currentCondition,
            warnings = warnings.sortedBy { it.priority }
        )
    }

    private fun getCurrentCondition(
        temperature: Double?,
        humidity: Double?,
        windSpeed: Double?
    ): String {
        val conditions = mutableListOf<String>()

        temperature?.let {
            when {
                it > 30 -> conditions.add("veoma toplo")
                it > 25 -> conditions.add("toplo")
                it < 0 -> conditions.add("hladno")
                it < 10 -> conditions.add("sveže")
                else -> conditions.add("prijatno")
            }
        }

        humidity?.let {
            when {
                it > 80 -> conditions.add("veoma vlažno")
                it > 60 -> conditions.add("vlažno")
                it < 30 -> conditions.add("suvo")
            }
        }

        windSpeed?.let {
            when {
                it > 10 -> conditions.add("vetrovito")
                it > 5 -> conditions.add("povetarac")
            }
        }

        return if (conditions.isEmpty()) "stabilno" else conditions.joinToString(", ")
    }
} 