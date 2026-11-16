package com.codebxo.inventory

import android.app.Application
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.launch

class AppViewModel(app: Application) : AndroidViewModel(app) {
    private val store = Store(app)
    private val api get() = Api.service

    var loggedIn by mutableStateOf(false); private set
    var role by mutableStateOf(store.role); private set
    var userName by mutableStateOf(store.name); private set
    var loading by mutableStateOf(false); private set
    var message by mutableStateOf<String?>(null)

    var dashboard by mutableStateOf<Dashboard?>(null); private set
    var products by mutableStateOf<List<Product>>(emptyList()); private set
    var lowStock by mutableStateOf<List<Product>>(emptyList()); private set
    var customers by mutableStateOf<List<Customer>>(emptyList()); private set
    var orders by mutableStateOf<List<Order>>(emptyList()); private set

    val isAdmin get() = role == "admin"

    init {
        Api.token = store.token
        loggedIn = store.token != null
        if (loggedIn) refreshAll()
    }

    /** Runs an API call with loading state + error handling. */
    private fun <T> call(onOk: (T) -> Unit = {}, block: suspend () -> T) {
        viewModelScope.launch {
            loading = true
            try { onOk(block()) }
            catch (e: retrofit2.HttpException) {
                if (e.code() == 401 && loggedIn) { logoutLocal(); message = "Session expired. Please log in again." } else message = errMsg(e)
            }
            catch (e: Exception) { message = errMsg(e) }
            finally { loading = false }
        }
    }

    fun login(email: String, password: String) = call<LoginRes>({
        store.token = it.token; store.role = it.user.role; store.name = it.user.name
        Api.token = it.token; role = it.user.role; userName = it.user.name; loggedIn = true
        refreshAll()
    }) { api.login(LoginReq(email.trim(), password)) }

    fun logout() {
        viewModelScope.launch { try { api.logout() } catch (_: Exception) {} }
        logoutLocal()
    }
    private fun logoutLocal() { store.clear(); Api.token = null; loggedIn = false }

    fun refreshAll() { loadDashboard(); loadProducts(null); loadLowStock(); loadCustomers(); loadOrders() }
    fun loadDashboard() = call<Dashboard>({ dashboard = it }) { api.dashboard() }
    fun loadProducts(q: String?) = call<List<Product>>({ products = it }) { api.products(q?.ifBlank { null }) }
    fun loadLowStock() = call<List<Product>>({ lowStock = it }) { api.lowStock() }
    fun loadCustomers() = call<List<Customer>>({ customers = it }) { api.customers() }
    fun loadOrders() = call<List<Order>>({ orders = it }) { api.orders() }

    private fun afterStockChange(text: String) { message = text; loadProducts(null); loadLowStock(); loadDashboard() }

    fun addProduct(p: ProductReq) = call<Product>({ afterStockChange("Product added") }) { api.addProduct(p) }
    fun deleteProduct(id: String) = call<Any>({ afterStockChange("Product deleted") }) { api.deleteProduct(id) }
    fun stockIn(id: String, qty: Int) = call<Product>({ afterStockChange("Stock added") }) { api.stockIn(StockReq(id, qty)) }
    fun stockOut(id: String, qty: Int) = call<Product>({ afterStockChange("Stock removed") }) { api.stockOut(StockReq(id, qty)) }

    fun addCustomer(c: CustomerReq) = call<Customer>({ message = "Customer added"; loadCustomers() }) { api.addCustomer(c) }

    fun createOrder(customerId: String, lines: List<OrderLine>, done: () -> Unit) =
        call<Order>({ done(); loadOrders(); afterStockChange("Order created, stock updated") }) { api.createOrder(OrderReq(customerId, lines)) }
    fun cancelOrder(id: String) = call<Order>({ loadOrders(); afterStockChange("Order cancelled, stock restored") }) { api.cancelOrder(id) }
}
