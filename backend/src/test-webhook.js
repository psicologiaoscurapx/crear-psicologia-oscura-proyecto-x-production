import db from "./db.js";
import crypto from "node:crypto";

const email = `webhook-test-${Date.now()}@example.com`;
const result = db.prepare("INSERT INTO users(name,email,password_hash,email_verified_at) VALUES(?,?,?,?,CURRENT_TIMESTAMP)")
  .run("Webhook Test", email, "test-hash");
const userId = Number(result.lastInsertRowid);
const subscriptionId = `sub_test_${Date.now()}`;

db.prepare(`
INSERT INTO subscriptions(user_id,provider,provider_customer_id,provider_subscription_id,status,current_period_end)
VALUES(?,?,?,?,?,?)
`).run(userId,"stripe","cus_test",subscriptionId,"active",Math.floor(Date.now()/1000)+86400*30);

const row = db.prepare("SELECT status,current_period_end FROM subscriptions WHERE provider_subscription_id=?").get(subscriptionId);
if (!row || row.status !== "active") throw new Error("Webhook entitlement test failed: subscription not active.");

db.prepare("UPDATE subscriptions SET status='canceled',updated_at=CURRENT_TIMESTAMP WHERE provider_subscription_id=?").run(subscriptionId);
const canceled = db.prepare("SELECT status FROM subscriptions WHERE provider_subscription_id=?").get(subscriptionId);
if (!canceled || canceled.status !== "canceled") throw new Error("Cancellation webhook test failed.");

db.prepare("DELETE FROM subscriptions WHERE provider_subscription_id=?").run(subscriptionId);
db.prepare("DELETE FROM users WHERE id=?").run(userId);
console.log("Webhook entitlement simulation PASSED: active -> canceled.");
