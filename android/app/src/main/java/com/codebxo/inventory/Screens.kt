package com.codebxo.inventory

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.util.Locale

private fun money(v: Double) = "₹" + String.format(Locale("en", "IN"), "%,.2f", v)

@Composable
private fun Title(text: String, sub: String? = null) {
    Column(Modifier.padding(bottom = 12.dp)) {
        Text(text, fontSize = 26.sp, fontWeight = FontWeight.Bold, color = Ink)
        if (sub != null) Text(sub, color = Muted, fontSize = 14.sp)
    }
}

@Composable
private fun EmptyNote(text: String) = Text(text, color = Muted, modifier = Modifier.padding(vertical = 12.dp))

@Composable
private fun AddFab(desc: String, onClick: () -> Unit, modifier: Modifier) =
    FloatingActionButton(onClick = onClick, modifier = modifier.padding(16.dp), containerColor = Brand, contentColor = Color.White,
        shape = RoundedCornerShape(18.dp)) { Icon(Icons.Default.Add, desc) }

// ---------------- Login ----------------
@Composable
fun LoginScreen(vm: AppViewModel) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var show by remember { mutableStateOf(false) }
    Box(Modifier.fillMaxSize().background(Brush.radialGradient(listOf(Brand.copy(alpha = 0.35f), Color.Transparent), center = Offset(150f, 150f), radius = 1000f))) {
        Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(24.dp), verticalArrangement = Arrangement.Center) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.size(40.dp).clip(RoundedCornerShape(12.dp)).background(Brush.linearGradient(listOf(Color(0xFF60A5FA), Brand2, Cyan))))
                Spacer(Modifier.width(12.dp))
                Text("StockNest", fontSize = 32.sp, fontWeight = FontWeight.Bold, color = Color.White)
            }
            Spacer(Modifier.height(10.dp))
            Text("Run your stock, orders and sales from one place.", color = Soft, fontSize = 16.sp)
            Spacer(Modifier.height(28.dp))
            AppCard(Modifier.fillMaxWidth()) {
                Box(Modifier.fillMaxWidth().height(3.dp).background(BrandGradient))
                Column(Modifier.padding(20.dp)) {
                    Text("Welcome back", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    Text("Log in to your account", color = Muted, modifier = Modifier.padding(bottom = 16.dp))
                    OutlinedTextField(email, { email = it }, label = { Text("Email") }, singleLine = true, modifier = Modifier.fillMaxWidth(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email))
                    Spacer(Modifier.height(12.dp))
                    OutlinedTextField(password, { password = it }, label = { Text("Password") }, singleLine = true, modifier = Modifier.fillMaxWidth(),
                        visualTransformation = if (show) VisualTransformation.None else PasswordVisualTransformation(),
                        trailingIcon = { TextButton(onClick = { show = !show }) { Text(if (show) "Hide" else "Show", color = Brand) } })
                    Spacer(Modifier.height(20.dp))
                    GradientButton(if (vm.loading) "Logging in..." else "Log in", { vm.login(email, password) },
                        Modifier.fillMaxWidth(), enabled = !vm.loading && email.isNotBlank() && password.isNotBlank())
                    Spacer(Modifier.height(18.dp))
                    Text("Try a demo account", color = Muted, fontSize = 12.sp, modifier = Modifier.align(Alignment.CenterHorizontally))
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
                        TextButton(onClick = { email = "admin@codebxo.com"; password = "Admin@123" }) { Text("Admin", color = Cyan) }
                        TextButton(onClick = { email = "staff@codebxo.com"; password = "Staff@123" }) { Text("Staff", color = Cyan) }
                    }
                }
            }
        }
    }
}

// ---------------- Home / dashboard ----------------
@Composable
fun HomeScreen(vm: AppViewModel) {
    val d = vm.dashboard
    Column(Modifier.verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Title("Dashboard", "Hello, ${vm.userName}")
        if (d == null) { EmptyNote("Loading..."); return }
        val items = listOf(
            Triple("Products", "${d.products}", Color(0xFF818CF8)), Triple("Units in stock", "${d.totalStock}", Cyan),
            Triple("Stock value", money(d.stockValue), Mint), Triple("Orders", "${d.orders}", Amber),
            Triple("Sales", money(d.sales), Pink), Triple("Low stock", "${d.lowStock}", if (d.lowStock > 0) Rose else Brand2)
        )
        items.chunked(2).forEach { row ->
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                row.forEach { (label, value, color) -> StatCard(label, value, color, Modifier.weight(1f)) }
            }
        }
        if (d.lowStock > 0) {
            Box(Modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp)).background(Amber.copy(alpha = 0.14f)).padding(14.dp)) {
                Text("${d.lowStock} product(s) are low on stock. Open the Low stock tab to restock.", color = Amber)
            }
        }
        OutlinedButton(onClick = { vm.refreshAll() }, shape = RoundedCornerShape(12.dp)) { Text("Refresh", color = Soft) }
    }
}

// ---------------- Products + stock in/out ----------------
@Composable
fun ProductsScreen(vm: AppViewModel) {
    var q by remember { mutableStateOf("") }
    var adding by remember { mutableStateOf(false) }
    var stockFor by remember { mutableStateOf<Pair<Product, Boolean>?>(null) }
    var deleting by remember { mutableStateOf<Product?>(null) }

    Box(Modifier.fillMaxSize()) {
        Column(Modifier.padding(horizontal = 16.dp).padding(top = 16.dp)) {
            Title("Products")
            OutlinedTextField(q, { q = it; vm.loadProducts(it) }, label = { Text("Search products") }, singleLine = true,
                shape = RoundedCornerShape(99.dp), modifier = Modifier.fillMaxWidth().padding(bottom = 10.dp))
            if (vm.products.isEmpty()) EmptyNote("No products found.")
            LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp), contentPadding = PaddingValues(bottom = 96.dp)) {
                items(vm.products, key = { it.id }) { p ->
                    val low = p.stock <= p.lowStockThreshold
                    AppCard(Modifier.fillMaxWidth()) {
                        Column(Modifier.padding(14.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Column(Modifier.weight(1f)) {
                                    Text(p.name, fontSize = 17.sp, fontWeight = FontWeight.SemiBold)
                                    Text("${p.sku}  -  ${money(p.price)}", color = Muted, fontSize = 13.sp)
                                }
                                Pill(if (low) "${p.stock} low" else "${p.stock} in stock", if (low) Amber else Mint)
                            }
                            Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                TextButton(onClick = { stockFor = p to true }) { Text("Stock in", color = Mint) }
                                TextButton(onClick = { stockFor = p to false }) { Text("Stock out", color = Amber) }
                                if (vm.isAdmin) TextButton(onClick = { deleting = p }) { Text("Delete", color = Rose) }
                            }
                        }
                    }
                }
            }
        }
        AddFab("Add product", { adding = true }, Modifier.align(Alignment.BottomEnd))
    }

    if (adding) AddProductDialog({ adding = false }) { vm.addProduct(it); adding = false }
    stockFor?.let { (p, isIn) ->
        QuantityDialog((if (isIn) "Stock in: " else "Stock out: ") + p.name, { stockFor = null }) { qty ->
            if (isIn) vm.stockIn(p.id, qty) else vm.stockOut(p.id, qty); stockFor = null
        }
    }
    deleting?.let { p ->
        AlertDialog(onDismissRequest = { deleting = null }, title = { Text("Delete ${p.name}?") },
            confirmButton = { TextButton(onClick = { vm.deleteProduct(p.id); deleting = null }) { Text("Delete", color = Rose) } },
            dismissButton = { TextButton(onClick = { deleting = null }) { Text("Cancel", color = Soft) } })
    }
}

@Composable
fun QuantityDialog(title: String, onDismiss: () -> Unit, onConfirm: (Int) -> Unit) {
    var qty by remember { mutableStateOf("1") }
    val n = qty.toIntOrNull()
    AlertDialog(onDismissRequest = onDismiss, title = { Text(title) },
        text = { OutlinedTextField(qty, { qty = it.filter(Char::isDigit) }, label = { Text("Quantity") }, singleLine = true, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)) },
        confirmButton = { TextButton(enabled = n != null && n > 0, onClick = { onConfirm(n!!) }) { Text("Confirm", color = Cyan) } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel", color = Soft) } })
}

@Composable
fun AddProductDialog(onDismiss: () -> Unit, onSave: (ProductReq) -> Unit) {
    var name by remember { mutableStateOf("") }; var sku by remember { mutableStateOf("") }; var cat by remember { mutableStateOf("") }
    var price by remember { mutableStateOf("") }; var stock by remember { mutableStateOf("0") }; var low by remember { mutableStateOf("10") }
    val num = KeyboardOptions(keyboardType = KeyboardType.Number)
    val valid = name.length >= 2 && sku.length >= 2 && price.toDoubleOrNull() != null
    AlertDialog(onDismissRequest = onDismiss, title = { Text("Add product") },
        text = {
            Column(Modifier.verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                OutlinedTextField(name, { name = it }, label = { Text("Name") }, singleLine = true)
                OutlinedTextField(sku, { sku = it }, label = { Text("SKU") }, singleLine = true)
                OutlinedTextField(cat, { cat = it }, label = { Text("Category") }, singleLine = true)
                OutlinedTextField(price, { price = it }, label = { Text("Price") }, singleLine = true, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal))
                OutlinedTextField(stock, { stock = it.filter(Char::isDigit) }, label = { Text("Opening stock") }, singleLine = true, keyboardOptions = num)
                OutlinedTextField(low, { low = it.filter(Char::isDigit) }, label = { Text("Low-stock level") }, singleLine = true, keyboardOptions = num)
            }
        },
        confirmButton = {
            TextButton(enabled = valid, onClick = { onSave(ProductReq(name.trim(), sku.trim(), cat.ifBlank { "General" }, price.toDouble(), stock.toIntOrNull() ?: 0, low.toIntOrNull() ?: 10)) }) { Text("Save", color = Cyan) }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel", color = Soft) } })
}

// ---------------- Low stock ----------------
@Composable
fun LowStockScreen(vm: AppViewModel) {
    var restock by remember { mutableStateOf<Product?>(null) }
    Column(Modifier.padding(16.dp)) {
        Title("Low stock alerts", "Products at or below their alert level")
        if (vm.lowStock.isEmpty()) EmptyNote("Nothing is running low.")
        LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            items(vm.lowStock, key = { it.id }) { p ->
                AppCard(Modifier.fillMaxWidth()) {
                    Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text(p.name, fontSize = 17.sp, fontWeight = FontWeight.SemiBold)
                            Text("${p.stock} left (alert at ${p.lowStockThreshold})", color = Amber, fontSize = 13.sp)
                        }
                        Button(onClick = { restock = p }, colors = ButtonDefaults.buttonColors(containerColor = Brand), shape = RoundedCornerShape(12.dp)) { Text("Restock") }
                    }
                }
            }
        }
    }
    restock?.let { p -> QuantityDialog("Restock: ${p.name}", { restock = null }) { vm.stockIn(p.id, it); restock = null } }
}

// ---------------- Customers ----------------
@Composable
fun CustomersScreen(vm: AppViewModel) {
    var adding by remember { mutableStateOf(false) }
    Box(Modifier.fillMaxSize()) {
        Column(Modifier.padding(16.dp)) {
            Title("Customers")
            if (vm.customers.isEmpty()) EmptyNote("No customers yet. Tap + to add one.")
            LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp), contentPadding = PaddingValues(bottom = 96.dp)) {
                items(vm.customers, key = { it.id }) { c ->
                    AppCard(Modifier.fillMaxWidth()) {
                        Column(Modifier.padding(14.dp)) {
                            Text(c.name, fontSize = 17.sp, fontWeight = FontWeight.SemiBold)
                            listOfNotNull(c.phone, c.email, c.address).filter { it.isNotBlank() }.forEach { Text(it, color = Muted, fontSize = 13.sp) }
                        }
                    }
                }
            }
        }
        AddFab("Add customer", { adding = true }, Modifier.align(Alignment.BottomEnd))
    }
    if (adding) {
        var name by remember { mutableStateOf("") }; var phone by remember { mutableStateOf("") }
        var email by remember { mutableStateOf("") }; var addr by remember { mutableStateOf("") }
        AlertDialog(onDismissRequest = { adding = false }, title = { Text("Add customer") },
            text = {
                Column(Modifier.verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    OutlinedTextField(name, { name = it }, label = { Text("Name") }, singleLine = true)
                    OutlinedTextField(phone, { phone = it }, label = { Text("Phone") }, singleLine = true, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone))
                    OutlinedTextField(email, { email = it }, label = { Text("Email") }, singleLine = true, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email))
                    OutlinedTextField(addr, { addr = it }, label = { Text("Address") }, singleLine = true)
                }
            },
            confirmButton = { TextButton(enabled = name.length >= 2, onClick = { vm.addCustomer(CustomerReq(name.trim(), phone.trim(), email.trim(), addr.trim())); adding = false }) { Text("Save", color = Cyan) } },
            dismissButton = { TextButton(onClick = { adding = false }) { Text("Cancel", color = Soft) } })
    }
}

// ---------------- Orders ----------------
@Composable
fun OrdersScreen(vm: AppViewModel) {
    var creating by remember { mutableStateOf(false) }
    var cancelling by remember { mutableStateOf<Order?>(null) }
    Box(Modifier.fillMaxSize()) {
        Column(Modifier.padding(16.dp)) {
            Title("Orders")
            if (vm.orders.isEmpty()) EmptyNote("No orders yet. Tap + to create one.")
            LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp), contentPadding = PaddingValues(bottom = 96.dp)) {
                items(vm.orders, key = { it.id }) { o ->
                    AppCard(Modifier.fillMaxWidth()) {
                        Column(Modifier.padding(14.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(o.customer?.name ?: "-", Modifier.weight(1f), fontSize = 17.sp, fontWeight = FontWeight.SemiBold)
                                Text(money(o.total), fontWeight = FontWeight.Bold, color = Cyan)
                            }
                            Text(o.items.joinToString { "${it.name} x${it.quantity}" }, color = Muted, fontSize = 13.sp)
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(Modifier.weight(1f)) { Pill(o.status, if (o.status == "completed") Mint else Rose) }
                                if (o.status == "completed") TextButton(onClick = { cancelling = o }) { Text("Cancel order", color = Rose) }
                            }
                        }
                    }
                }
            }
        }
        AddFab("New order", { vm.loadProducts(null); vm.loadCustomers(); creating = true }, Modifier.align(Alignment.BottomEnd))
    }
    if (creating) NewOrderDialog(vm) { creating = false }
    cancelling?.let { o ->
        AlertDialog(onDismissRequest = { cancelling = null }, title = { Text("Cancel this order?") }, text = { Text("Items will be returned to stock.", color = Soft) },
            confirmButton = { TextButton(onClick = { vm.cancelOrder(o.id); cancelling = null }) { Text("Cancel order", color = Rose) } },
            dismissButton = { TextButton(onClick = { cancelling = null }) { Text("Keep", color = Soft) } })
    }
}

@Composable
fun NewOrderDialog(vm: AppViewModel, onClose: () -> Unit) {
    var customer by remember { mutableStateOf<Customer?>(null) }
    var menu by remember { mutableStateOf(false) }
    val qty = remember { mutableStateMapOf<String, Int>() }
    val total = vm.products.sumOf { (qty[it.id] ?: 0) * it.price }
    val lines = qty.filter { it.value > 0 }.map { OrderLine(it.key, it.value) }

    AlertDialog(onDismissRequest = onClose, title = { Text("New order") },
        text = {
            Column {
                Box {
                    OutlinedButton(onClick = { menu = true }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp)) { Text(customer?.name ?: "Choose a customer", color = Ink) }
                    DropdownMenu(menu, { menu = false }) {
                        vm.customers.forEach { c -> DropdownMenuItem(text = { Text(c.name) }, onClick = { customer = c; menu = false }) }
                    }
                }
                Spacer(Modifier.height(8.dp))
                LazyColumn(Modifier.heightIn(max = 280.dp)) {
                    items(vm.products, key = { it.id }) { p ->
                        val n = qty[p.id] ?: 0
                        Row(Modifier.fillMaxWidth().padding(vertical = 2.dp), verticalAlignment = Alignment.CenterVertically) {
                            Column(Modifier.weight(1f)) { Text(p.name); Text("${money(p.price)} | ${p.stock} left", fontSize = 12.sp, color = Muted) }
                            TextButton(onClick = { if (n > 0) qty[p.id] = n - 1 }, enabled = n > 0) { Text("-", color = Cyan, fontSize = 20.sp) }
                            Text("$n", fontWeight = FontWeight.Bold)
                            TextButton(onClick = { if (n < p.stock) qty[p.id] = n + 1 }, enabled = n < p.stock) { Text("+", color = Cyan, fontSize = 20.sp) }
                        }
                    }
                }
                Text("Total: ${money(total)}", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Cyan, modifier = Modifier.padding(top = 8.dp))
            }
        },
        confirmButton = { TextButton(enabled = customer != null && lines.isNotEmpty() && !vm.loading, onClick = { vm.createOrder(customer!!.id, lines, onClose) }) { Text("Place order", color = Cyan) } },
        dismissButton = { TextButton(onClick = onClose) { Text("Cancel", color = Soft) } })
}