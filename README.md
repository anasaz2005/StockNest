# Stockroom - Smart Inventory & Order Management System

Full-stack mini system: **Node/Express REST API + MongoDB Atlas**, **React web app**, **Kotlin (Jetpack Compose) Android app**.

```
backend/   Express API (JWT auth, roles, Joi validation, Swagger docs)
web/       React + Vite web app
android/   Kotlin + Jetpack Compose app (open this folder in Android Studio)
docs/      ER diagram
```

## Features
| Module | Web | Android | API |
|---|---|---|---|
| Auth (login/logout, admin & staff roles) | yes | yes | `/api/auth/*`, `/api/users` (admin) |
| Dashboard | yes | yes | `/api/reports/dashboard` |
| Products (add/edit/delete/search) | yes | add/search/delete | `/api/products` |
| Inventory (stock in/out, low-stock alerts, history) | yes | yes | `/api/inventory/*` |
| Customers | yes | add/list | `/api/customers` |
| Orders (auto stock update, cancel restores stock) | yes | yes | `/api/orders` |
| Reports (sales, inventory, CSV export) | yes (admin) | - | `/api/reports/*` |

**Roles:** `admin` can do everything (delete products/customers, reports, manage users). `staff` can manage stock, customers and orders.

## 1. MongoDB Atlas
1. Create a free **M0** cluster at https://cloud.mongodb.com.
2. *Database Access* -> add a database user (username + password).
3. *Network Access* -> add IP `0.0.0.0/0` (needed for Render).
4. *Connect -> Drivers* -> copy the connection string; put your DB name before `?` (e.g. `/inventory?`).

## 2. Backend (local)
```bash
cd backend
cp .env.example .env      # fill MONGO_URI and JWT_SECRET
npm install
npm run seed              # creates admin + sample data
npm run dev               # http://localhost:5000  | docs: http://localhost:5000/api-docs
```
Seeded logins: `admin@codebxo.com / Admin@123` (admin), `staff@codebxo.com / Staff@123` (staff). Change them after deploying.

## 3. Web (local)
```bash
cd web
cp .env.example .env      # VITE_API_URL=http://localhost:5000
npm install
npm run dev               # http://localhost:5173
```

## 4. Android
1. Install Android Studio (Koala or newer, JDK 17 is bundled).
2. *File -> Open* -> select the `android` folder, wait for Gradle sync.
3. Open `app/build.gradle.kts` and set `BASE_URL`:
   - Emulator + local backend: `http://10.0.2.2:5000/`
   - Deployed backend: `https://your-api.onrender.com/` (keep the trailing `/`)
4. Run on an emulator/phone, or build an APK: **Build -> Build Bundle(s)/APK(s) -> Build APK(s)**.
   Output: `android/app/build/outputs/apk/debug/app-debug.apk`

## 5. Deployment
**API on Render:** New -> Web Service -> connect your GitHub repo.
Root directory `backend`, build `npm install`, start `npm start`.
Environment: `MONGO_URI`, `JWT_SECRET`, `CORS_ORIGIN` (your Vercel URL). Then run the seed once from your own machine with the same `MONGO_URI`.
(Free Render services sleep after inactivity; the first request can take ~50 s.)

**Web on Vercel:** Import the repo, root directory `web`, framework Vite, env `VITE_API_URL=https://your-api.onrender.com`. `vercel.json` already handles page refreshes on routes.

## 6. Key design decisions
- **No overselling:** stock-out and order creation use one atomic MongoDB update (`stock >= qty` in the filter), so concurrent requests can't make stock negative. If one order line fails, earlier deductions are rolled back.
- **Audit trail:** every stock change creates a `stockMovements` record.
- **Security:** bcrypt password hashing, JWT with expiry, role middleware, Joi validation, Helmet, CORS allow-list, regex input escaping for search.
- **Order snapshots:** order items store name/SKU/price at purchase time.

## 7. Error format
All errors return `{ "message": "...", "errors": ["..."] }` with proper status codes (400 validation, 401 auth, 403 role, 404, 409 duplicate).

## 8. Demo recording checklist
Login as staff -> add product -> stock in/out -> low-stock alert -> add customer -> create order (show stock drop) -> cancel (stock restored) -> login as admin -> reports -> show `/api-docs` -> show the Android app doing login, stock-in and an order.
