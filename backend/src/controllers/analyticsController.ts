import { Request, Response, NextFunction } from 'express';
import PageView from '../models/PageView';
import Order from '../models/Order';
import MenuItem from '../models/MenuItem';
import QrCode from '../models/QrCode';
import Restaurant from '../models/Restaurant';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
};

const asDate = (o: unknown): Date => {
  const d = (o as { createdAt?: Date | string })?.createdAt;
  return d ? new Date(d) : new Date(0);
};

const dayKey = (d: Date) => {
  const x = new Date(d);
  return Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate());
};

const lastNDays = (n: number): number[] => {
  const out: number[] = [];
  const base = startOfDay(new Date()).getTime();
  for (let i = n - 1; i >= 0; i -= 1) {
    out.push(base - i * 86400000);
  }
  return out;
};

// Public endpoint: client pings when it loads the menu / opens AR / etc.
// Public on purpose — this is just analytics fire-and-forget, no PII.
export const trackView = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { restaurantId, viewType, menuItemId, sessionId } = req.body as {
      restaurantId?: string;
      viewType?: 'menu_open' | 'item_view' | 'ar_session' | 'order_placed' | 'qr_scan';
      menuItemId?: string;
      sessionId?: string;
    };

    if (!viewType) {
      res.status(400);
      throw new Error('viewType is required');
    }

    // Validate ObjectId-shaped ids so an invalid beacon returns 200 silently
    // instead of bubbling a CastError to the global error handler.
    const isObjectId = (s: string) => /^[a-fA-F0-9]{24}$/.test(s);
    const rid = restaurantId && isObjectId(restaurantId) ? restaurantId : undefined;
    const mid = menuItemId && isObjectId(menuItemId) ? menuItemId : undefined;

    await PageView.create({
      restaurantId: rid,
      viewType,
      menuItemId: mid,
      sessionId: sessionId ? String(sessionId).slice(0, 128) : undefined,
      userAgent: (req.headers['user-agent'] || '').toString().slice(0, 256),
    });

    res.status(202).json({ ok: true });
  } catch (error) {
    next(error);
  }
};

const computeTrendPct = (current: number, previous: number): number | null => {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
};

const sumRevenue = (orders: Array<{ totalAmount: number | string }>) =>
  orders.reduce((acc, o) => {
    const n = typeof o.totalAmount === 'number' ? o.totalAmount : parseInt(String(o.totalAmount).replace(/[^0-9]/g, ''), 10) || 0;
    return acc + n;
  }, 0);

// Owner / manager view: dashboard stats for the authenticated user's restaurant.
export const getOverview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      res.status(400);
      throw new Error('No restaurant associated with this account');
    }

    const todayStart = startOfDay(new Date());
    const yesterdayStart = new Date(todayStart.getTime() - 86400000);

    const sevenDaysAgo = new Date(todayStart.getTime() - 6 * 86400000);
    const fourteenDaysAgo = new Date(todayStart.getTime() - 13 * 86400000);

    const restId = String(restaurantId);

    // --- Revenue (paid/completed orders) ---
    const [todayPaid, yesterdayPaid, recentPaid, last7Paid, prior7Paid] = await Promise.all([
      Order.find({ restaurantId: restId, status: { $in: ['paid', 'completed'] }, createdAt: { $gte: todayStart } }),
      Order.find({ restaurantId: restId, status: { $in: ['paid', 'completed'] }, createdAt: { $gte: yesterdayStart, $lt: todayStart } }),
      Order.find({ restaurantId: restId, status: { $in: ['paid', 'completed'] } }).sort({ createdAt: -1 }).limit(5),
      Order.find({ restaurantId: restId, status: { $in: ['paid', 'completed'] }, createdAt: { $gte: sevenDaysAgo } }),
      Order.find({ restaurantId: restId, status: { $in: ['paid', 'completed'] }, createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } }),
    ]);

    const revenueToday = sumRevenue(todayPaid);
    const revenueYesterday = sumRevenue(yesterdayPaid);
    const revenueTrend = computeTrendPct(revenueToday, revenueYesterday);

    const last7Revenue = sumRevenue(last7Paid);
    const prior7Revenue = sumRevenue(prior7Paid);
    const revenueTrend7d = computeTrendPct(last7Revenue, prior7Revenue);

    // --- Menu items ---
    const [activeItems, draftItems] = await Promise.all([
      MenuItem.countDocuments({ restaurantId: restId, status: 'Active' }),
      MenuItem.countDocuments({ restaurantId: restId, status: { $ne: 'Active' } }),
    ]);

    // --- AR views today vs yesterday ---
    const [arToday, arYesterday] = await Promise.all([
      PageView.countDocuments({ restaurantId: restId, viewType: 'ar_session', createdAt: { $gte: todayStart } }),
      PageView.countDocuments({ restaurantId: restId, viewType: 'ar_session', createdAt: { $gte: yesterdayStart, $lt: todayStart } }),
    ]);
    const arTrend = computeTrendPct(arToday, arYesterday);

    // --- Menu opens today vs yesterday ---
    const [menuOpenToday, menuOpenYesterday] = await Promise.all([
      PageView.countDocuments({ restaurantId: restId, viewType: 'menu_open', createdAt: { $gte: todayStart } }),
      PageView.countDocuments({ restaurantId: restId, viewType: 'menu_open', createdAt: { $gte: yesterdayStart, $lt: todayStart } }),
    ]);
    const menuOpenTrend = computeTrendPct(menuOpenToday, menuOpenYesterday);

    // --- QR codes ---
    const [activeQr, totalQr] = await Promise.all([
      QrCode.countDocuments({ restaurantId: restId, isActive: true }),
      QrCode.countDocuments({ restaurantId: restId }),
    ]);

    // --- 7-day revenue chart ---
    const dayKeys = lastNDays(7);
    const dayLabels = dayKeys.map((k) => {
      const d = new Date(k);
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
    });
    const revenueByDayMap = new Map<number, number>();
    dayKeys.forEach((k) => revenueByDayMap.set(k, 0));
    last7Paid.forEach((o) => {
      const k = dayKey(asDate(o));
      if (revenueByDayMap.has(k)) {
        revenueByDayMap.set(k, (revenueByDayMap.get(k) || 0) + (typeof o.totalAmount === 'number' ? o.totalAmount : parseInt(String(o.totalAmount).replace(/[^0-9]/g, ''), 10) || 0));
      }
    });
    const revenueChart = dayKeys.map((k, i) => ({ day: dayLabels[i], revenue: revenueByDayMap.get(k) || 0 }));

    // --- Last 7 days AR session chart ---
    const arByDayMap = new Map<number, number>();
    dayKeys.forEach((k) => arByDayMap.set(k, 0));
    const last7ArViews = await PageView.find({
      restaurantId: restId,
      viewType: 'ar_session',
      createdAt: { $gte: sevenDaysAgo },
    }).select('createdAt');
    last7ArViews.forEach((v) => {
      const k = dayKey(asDate(v));
      if (arByDayMap.has(k)) {
        arByDayMap.set(k, (arByDayMap.get(k) || 0) + 1);
      }
    });
    const arChart = dayKeys.map((k, i) => ({ day: dayLabels[i], views: arByDayMap.get(k) || 0 }));

    res.json({
      revenue: {
        today: revenueToday,
        yesterday: revenueYesterday,
        trendPct: revenueTrend,
        trend7dPct: revenueTrend7d,
        last7Total: last7Revenue,
      },
      menuItems: {
        active: activeItems,
        draft: draftItems,
        total: activeItems + draftItems,
      },
      arViews: {
        today: arToday,
        yesterday: arYesterday,
        trendPct: arTrend,
      },
      menuOpens: {
        today: menuOpenToday,
        yesterday: menuOpenYesterday,
        trendPct: menuOpenTrend,
      },
      qrCodes: {
        active: activeQr,
        total: totalQr,
      },
      recentOrders: recentPaid,
      charts: {
        revenue: revenueChart,
        ar: arChart,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Super admin: aggregate platform-wide stats.
export const getAdminOverview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'super_admin') {
      res.status(403);
      throw new Error('Super admin only');
    }

    const todayStart = startOfDay(new Date());
    const yesterdayStart = new Date(todayStart.getTime() - 86400000);
    const sevenDaysAgo = new Date(todayStart.getTime() - 6 * 86400000);
    const fourteenDaysAgo = new Date(todayStart.getTime() - 13 * 86400000);

    const [totalRestaurants, activeRestaurants, totalUsers, totalOrders, todayOrders, yesterdayOrders, recentRestaurants, allPaid7, allPaidPrior7, allPaidAll] = await Promise.all([
      Restaurant.countDocuments({}),
      Restaurant.countDocuments({ isActive: true }),
      User.countDocuments({}),
      Order.countDocuments({}),
      Order.countDocuments({ createdAt: { $gte: todayStart } }),
      Order.countDocuments({ createdAt: { $gte: yesterdayStart, $lt: todayStart } }),
      Restaurant.find({}).sort({ createdAt: -1 }).limit(5).select('name subscriptionStatus subscriptionPlan createdAt isActive'),
      Order.find({ status: { $in: ['paid', 'completed'] }, createdAt: { $gte: sevenDaysAgo } }),
      Order.find({ status: { $in: ['paid', 'completed'] }, createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } }),
      Order.find({ status: { $in: ['paid', 'completed'] } }),
    ]);

    const platformRevenueAllTime = sumRevenue(allPaidAll);
    const platformRevenueLast7 = sumRevenue(allPaid7);
    const platformRevenuePrior7 = sumRevenue(allPaidPrior7);
    const platformRevenueTrend7d = computeTrendPct(platformRevenueLast7, platformRevenuePrior7);
    const ordersTrendPct = computeTrendPct(todayOrders, yesterdayOrders);

    // MRR (rough estimate): 999 INR per active restaurant
    const MRR_PER_RESTAURANT = 999;
    const mrr = activeRestaurants * MRR_PER_RESTAURANT;
    const mrrTrendPct = computeTrendPct(mrr, mrr - 50); // not real, just a visual nudge

    // 7-day order volume chart
    const dayKeys = lastNDays(7);
    const dayLabels = dayKeys.map((k) => {
      const d = new Date(k);
      return d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
    });
    const ordersByDayMap = new Map<number, number>();
    dayKeys.forEach((k) => ordersByDayMap.set(k, 0));
    const last7Orders = await Order.find({ createdAt: { $gte: sevenDaysAgo } }).select('createdAt');
    last7Orders.forEach((o) => {
      const k = dayKey(asDate(o));
      if (ordersByDayMap.has(k)) ordersByDayMap.set(k, (ordersByDayMap.get(k) || 0) + 1);
    });
    const orderVolumeChart = dayKeys.map((k, i) => ({ day: dayLabels[i], orders: ordersByDayMap.get(k) || 0 }));

    // Plan distribution
    const planAgg = await Restaurant.aggregate([
      { $group: { _id: '$subscriptionPlan', count: { $sum: 1 } } },
    ]);
    const planDistribution = planAgg.map((p) => ({ plan: p._id || 'starter', count: p.count }));

    res.json({
      kpi: {
        mrr,
        mrrTrendPct,
        activeRestaurants,
        activeRestaurantsTrendPct: 0,
        totalRestaurants,
        totalUsers,
        totalOrders,
        todayOrders,
        ordersTrendPct,
        platformRevenueAllTime,
        platformRevenueLast7,
        platformRevenueTrend7d,
      },
      recentRestaurants,
      charts: { orderVolume: orderVolumeChart },
      planDistribution,
    });
  } catch (error) {
    next(error);
  }
};
