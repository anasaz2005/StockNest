package com.codebxo.inventory

import android.content.Context
import com.google.gson.Gson
import com.google.gson.JsonObject
import com.google.gson.annotations.SerializedName
import okhttp3.OkHttpClient
import retrofit2.HttpException
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.*
import java.io.IOException

// ---------- Models (match the REST API JSON) ----------
data class LoginReq(val email: String, val password: String)
data class User(val name: String, val email: String, val role: String)
data class LoginRes(val token: String, val user: User)

data class Product(
    @SerializedName("_id") val id: String, val name: String, val sku: String,
    val category: String?, val price: Double, val stock: Int, val lowStockThreshold: Int
)
data class ProductReq(val name: String, val sku: String, val category: String, val price: Double, val stock: Int, val lowStockThreshold: Int)
data class StockReq(val product: String, val quantity: Int, val note: String? = null)

data class Customer(@SerializedName("_id") val id: String, val name: String, val phone: String?, val email: String?, val address: String?)
data class CustomerReq(val name: String, val phone: String, val email: String, val address: String)

data class OrderItem(val name: String?, val quantity: Int, val price: Double)
data class OrderCustomer(val name: String?)
data class Order(
    @SerializedName("_id") val id: String, val customer: OrderCustomer?, val items: List<OrderItem>,
    val total: Double, val status: String, val createdAt: String
)
data class OrderLine(val product: String, val quantity: Int)
data class OrderReq(val customer: String, val items: List<OrderLine>)

data class Dashboard(val products: Int, val totalStock: Int, val stockValue: Double, val lowStock: Int, val orders: Int, val sales: Double)

// ---------- Retrofit service ----------
interface ApiService {
    @POST("api/auth/login") suspend fun login(@Body b: LoginReq): LoginRes
    @POST("api/auth/logout") suspend fun logout(): JsonObject

    @GET("api/reports/dashboard") suspend fun dashboard(): Dashboard

    @GET("api/products") suspend fun products(@Query("q") q: String?): List<Product>
    @POST("api/products") suspend fun addProduct(@Body b: ProductReq): Product
    @DELETE("api/products/{id}") suspend fun deleteProduct(@Path("id") id: String): JsonObject

    @POST("api/inventory/stock-in") suspend fun stockIn(@Body b: StockReq): Product
    @POST("api/inventory/stock-out") suspend fun stockOut(@Body b: StockReq): Product
    @GET("api/inventory/low-stock") suspend fun lowStock(): List<Product>

    @GET("api/customers") suspend fun customers(): List<Customer>
    @POST("api/customers") suspend fun addCustomer(@Body b: CustomerReq): Customer

    @GET("api/orders") suspend fun orders(): List<Order>
    @POST("api/orders") suspend fun createOrder(@Body b: OrderReq): Order
    @PATCH("api/orders/{id}/cancel") suspend fun cancelOrder(@Path("id") id: String): Order
}

object Api {
    @Volatile var token: String? = null

    val service: ApiService by lazy {
        val client = OkHttpClient.Builder().connectTimeout(90, java.util.concurrent.TimeUnit.SECONDS).readTimeout(90, java.util.concurrent.TimeUnit.SECONDS).addInterceptor { chain ->
            val req = chain.request().newBuilder().apply { token?.let { header("Authorization", "Bearer $it") } }.build()
            chain.proceed(req)
        }.build()
        Retrofit.Builder().baseUrl("https://stocknest-wblw.onrender.com/").client(client)
            .addConverterFactory(GsonConverterFactory.create()).build().create(ApiService::class.java)
    }
}

/** Turns any exception into a readable message (uses the API's { message } body when present). */
fun errMsg(e: Throwable): String = when (e) {
    is HttpException -> try {
        Gson().fromJson(e.response()?.errorBody()?.string(), JsonObject::class.java)?.get("message")?.asString ?: "Request failed (${e.code()})"
    } catch (x: Exception) { "Request failed (${e.code()})" }
    is IOException -> "Cannot reach the server. Check your internet connection."
    else -> e.message ?: "Something went wrong"
}

/** Saves the login so the user stays signed in after closing the app. */
class Store(ctx: Context) {
    private val sp = ctx.getSharedPreferences("auth", Context.MODE_PRIVATE)
    var token: String? get() = sp.getString("token", null); set(v) { sp.edit().putString("token", v).apply() }
    var role: String get() = sp.getString("role", "staff") ?: "staff"; set(v) { sp.edit().putString("role", v).apply() }
    var name: String get() = sp.getString("name", "") ?: ""; set(v) { sp.edit().putString("name", v).apply() }
    fun clear() = sp.edit().clear().apply()
}
