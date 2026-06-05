import webpush from 'web-push';
import PushSubscription from '../models/PushSubscription';

const vapidContact = process.env.VAPID_CONTACT || 'mailto:admin@example.com';

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    vapidContact,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export const sendPushNotification = async (restaurantId: string, payload: unknown) => {
  try {
    const subscriptions = await PushSubscription.find({ restaurantId });
    if (subscriptions.length === 0) return;

    await Promise.all(
      subscriptions.map((sub) =>
        webpush
          .sendNotification(
            { endpoint: sub.endpoint, keys: sub.keys },
            JSON.stringify(payload)
          )
          .catch(async (err: { statusCode?: number }) => {
            if (err.statusCode === 404 || err.statusCode === 410) {
              await PushSubscription.findByIdAndDelete(sub._id);
            }
          })
      )
    );
  } catch (error) {
    console.error('Error sending push notifications:', error);
  }
};
