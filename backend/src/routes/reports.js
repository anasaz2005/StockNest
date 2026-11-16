const router = require('express').Router();
const Product = require('../models/Product');
const Order = require('../models/Order');
const { auth, allow } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/error');

router.use(auth);

// Dashboard summary: available to every logged-in user
router.get('/dashboard', asyncHandler(async (req, res) => {
  const since = new Date(); since.setDate(since.getDate() - 6); since.setHours(0, 0, 0, 0);
  const [products, stockAgg, lowStock, orders, salesAgg, recentOrders, daily] = await Promise.all([
    Product.countDocuments(),
    Product.aggregate([{ $group: { _id: null, units: { $sum: '$stock' }, value: { $sum: { $multiply: ['$stock', '$price'] } } } }]),
    Product.countDocuments({ $expr: { $lte: ['$stock', '$lowStockThreshold'] } }),
    Order.countDocuments({ status: 'completed' }),
    Order.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Order.find().sort('-createdAt').limit(5).populate('customer', 'name'),
    Order.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$total' }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);
  res.json({
    products, totalStock: stockAgg[0]?.units || 0, stockValue: stockAgg[0]?.value || 0,
    lowStock, orders, sales: salesAgg[0]?.total || 0, recentOrders, dailySales: daily,
  });
}));

// Sales report (admin): GET /api/reports/sales?from=2026-01-01&to=2026-01-31
router.get('/sales', allow('admin'), asyncHandler(async (req, res) => {
  const match = { status: 'completed' };
  if (req.query.from || req.query.to) {
    match.createdAt = {};
    if (req.query.from) match.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) { const t = new Date(req.query.to); t.setHours(23, 59, 59, 999); match.createdAt.$lte = t; }
  }
  const [summary, byDay, topProducts] = await Promise.all([
    Order.aggregate([{ $match: match }, { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } }]),
    Order.aggregate([{ $match: match },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } }]),
    Order.aggregate([{ $match: match }, { $unwind: '$items' },
      { $group: { _id: '$items.product', name: { $first: '$items.name' }, units: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } } } },
      { $sort: { revenue: -1 } }, { $limit: 10 }]),
  ]);
  const s = summary[0] || { revenue: 0, orders: 0 };
  res.json({ revenue: s.revenue, orders: s.orders, averageOrder: s.orders ? s.revenue / s.orders : 0, byDay, topProducts });
}));

// Inventory report (admin): stock levels, value and low-stock flag per product
router.get('/inventory', allow('admin'), asyncHandler(async (req, res) => {
  const products = await Product.find().sort('name').lean();
  const rows = products.map((p) => ({ ...p, value: p.stock * p.price, low: p.stock <= p.lowStockThreshold }));
  res.json({ totalValue: rows.reduce((s, r) => s + r.value, 0), lowStockCount: rows.filter((r) => r.low).length, products: rows });
}));

module.exports = router;
