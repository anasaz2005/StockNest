package com.codebxo.inventory

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

class MainActivity : ComponentActivity() {
    private val vm: AppViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            AppTheme {
                Surface(Modifier.fillMaxSize().appBackground(), color = Color.Transparent, contentColor = Ink) { Root(vm) }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun Root(vm: AppViewModel) {
    val snack = remember { SnackbarHostState() }
    LaunchedEffect(vm.message) { vm.message?.let { snack.showSnackbar(it); vm.message = null } }

    if (!vm.loggedIn) {
        Box { LoginScreen(vm); SnackbarHost(snack, Modifier.align(Alignment.BottomCenter).navigationBarsPadding()) }
        return
    }

    var tab by remember { mutableIntStateOf(0) }
    val tabs = listOf("Home" to Icons.Default.Home, "Products" to Icons.Default.List, "Low stock" to Icons.Default.Warning,
        "Orders" to Icons.Default.ShoppingCart, "Customers" to Icons.Default.Person)

    Scaffold(
        containerColor = Color.Transparent, contentColor = Ink,
        topBar = {
            TopAppBar(
                title = { Text("StockNest", fontWeight = FontWeight.Bold) },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Panel, titleContentColor = Ink, actionIconContentColor = Ink),
                actions = {
                    Pill("${vm.userName} - ${vm.role}", Brand)
                    TextButton(onClick = { vm.logout() }) { Text("Log out", color = Rose) }
                }
            )
        },
        bottomBar = {
            NavigationBar(containerColor = Panel) {
                tabs.forEachIndexed { i, (label, icon) ->
                    NavigationBarItem(
                        selected = tab == i, onClick = { tab = i }, icon = { Icon(icon, label) }, label = { Text(label, maxLines = 1) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = Color.White, selectedTextColor = Color.White, indicatorColor = Brand.copy(alpha = 0.45f),
                            unselectedIconColor = Muted, unselectedTextColor = Muted
                        )
                    )
                }
            }
        },
        snackbarHost = { SnackbarHost(snack) }
    ) { pad ->
        Box(Modifier.padding(pad).fillMaxSize()) {
            when (tab) {
                0 -> HomeScreen(vm)
                1 -> ProductsScreen(vm)
                2 -> LowStockScreen(vm)
                3 -> OrdersScreen(vm)
                4 -> CustomersScreen(vm)
            }
            if (vm.loading) LinearProgressIndicator(Modifier.fillMaxWidth().align(Alignment.TopCenter), color = Cyan, trackColor = Line)
        }
    }
}