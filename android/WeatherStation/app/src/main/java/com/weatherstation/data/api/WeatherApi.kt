import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

interface WeatherApi {
    @GET("api/sensors")
    suspend fun getSensorData(): List<SensorData>

    @GET("api/sensors/{sensorId}/history")
    suspend fun getSensorHistory(
        @Path("sensorId") sensorId: String,
        @Query("offset") offset: Int = 0
    ): HistoricalData

    @GET("api/stats")
    suspend fun getSiteStats(): SiteStats
} 