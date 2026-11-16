# Database structure (MongoDB Atlas)

```mermaid
erDiagram
    USER ||--o{ STOCK_MOVEMENT : "records"
    USER ||--o{ ORDER : "creates"
    CUSTOMER ||--o{ ORDER : "places"
    PRODUCT ||--o{ STOCK_MOVEMENT : "has"
    ORDER ||--|{ ORDER_ITEM : "contains (embedded)"
    PRODUCT ||--o{ ORDER_ITEM : "sold as"

    USER { ObjectId _id; string name; string email UK; string password_hash; string role "admin|staff"; bool active }
    PRODUCT { ObjectId _id; string name; string sku UK; string category; number price; int stock; int lowStockThreshold }
    CUSTOMER { ObjectId _id; string name; string phone; string email; string address }
    STOCK_MOVEMENT { ObjectId _id; ObjectId product FK; string type "in|out"; int quantity; string reason "manual|order|order-cancel"; string note; ObjectId user FK }
    ORDER { ObjectId _id; ObjectId customer FK; number total; string status "completed|cancelled"; ObjectId createdBy FK }
    ORDER_ITEM { ObjectId product FK; string name; string sku; int quantity; number price }
```

Design notes
- `ORDER_ITEM` is embedded inside `orders` (always read with its order). It stores a snapshot of name/SKU/price so old orders stay correct if a product changes later.
- `stockMovements` is an audit log: every stock change (manual, order, cancellation) is recorded.
- Unique indexes: `users.email`, `products.sku`.
