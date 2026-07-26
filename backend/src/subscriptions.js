import db from "./db.js";
import Stripe from "stripe";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

export function hasPremium(userId) {
  const row = db.prepare(`
    SELECT status,current_period_end FROM subscriptions
    WHERE user_id=? AND status IN ('active','trialing')
    ORDER BY updated_at DESC LIMIT 1
  `).get(userId);
  if (!row) return false;
  if (row.current_period_end && row.current_period_end < Math.floor(Date.now()/1000)) return false;
  return true;
}

export function status(req, res) {
  if (!req.session.userId) return res.json({ premium: false });
  res.json({ premium: hasPremium(req.session.userId) });
}

export async function checkout(req, res) {
  if (!stripe || !process.env.STRIPE_PRICE_ID) {
    return res.status(503).json({ error: "Stripe no está configurado todavía." });
  }
  const user = db.prepare("SELECT * FROM users WHERE id=?").get(req.session.userId);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: user.email,
    line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
    success_url: `${process.env.APP_BASE_URL}/?subscription=success`,
    cancel_url: `${process.env.APP_BASE_URL}/?subscription=cancelled`,
    metadata: { userId: String(user.id) }
  });
  res.json({ url: session.url });
}

export async function webhook(req, res) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(503).send("Stripe webhook not configured");
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const s = event.data.object;
    const userId = Number(s.metadata?.userId);
    if (userId) {
      db.prepare(`
        INSERT INTO subscriptions(user_id,provider,provider_customer_id,provider_subscription_id,status,current_period_end)
        VALUES(?,?,?,?,?,?)
        ON CONFLICT(provider_subscription_id) DO UPDATE SET
          status=excluded.status,
          current_period_end=excluded.current_period_end,
          updated_at=CURRENT_TIMESTAMP
      `).run(userId,"stripe",s.customer,s.subscription,"active",null);
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const s = event.data.object;
    const status = event.type.endsWith("deleted") ? "canceled" : s.status;
    db.prepare(`
      UPDATE subscriptions SET status=?, current_period_end=?, updated_at=CURRENT_TIMESTAMP
      WHERE provider_subscription_id=?
    `).run(status, s.current_period_end || null, s.id);
  }

  res.json({ received: true });
}
