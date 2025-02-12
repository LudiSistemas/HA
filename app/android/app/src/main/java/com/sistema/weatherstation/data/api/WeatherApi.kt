interface WeatherApi {
    @GET("sensors")
    suspend fun getSensors(): List<SensorData>

    @GET("sensors/{sensorId}/history")
    suspend fun getSensorHistory(
        @Path("sensorId") sensorId: String,
        @Query("offset") offset: Int = 0
    ): HistoricalData
}

object WeatherApiClient {
    private const val BASE_URL = "https://ha-api.sistema.sh/api/"

    private val client = OkHttpClient.Builder()
        .addInterceptor(HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        })
        .build()

    private val retrofit = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .client(client)
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    val api: WeatherApi = retrofit.create(WeatherApi::class.java)
} 