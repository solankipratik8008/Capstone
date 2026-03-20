/**
 * Cloud Run HTTP server for ParkSpot backend.
 */
const express = require('express');

// Initialize Firebase Admin with explicit project ID
const { initializeApp, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

if (!getApps().length) {
  initializeApp({ projectId: 'parkingspotapp-eef8e' });
}

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const BookingStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
};

async function verifyAuth(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) throw new Error('no_token');
  const decoded = await getAuth().verifyIdToken(token);
  return decoded.uid;
}

function ok(res, data) {
  res.json({ result: data });
}
function err(res, code, message) {
  const statusMap = {
    unauthenticated: 401,
    'permission-denied': 403,
    'not-found': 404,
    'invalid-argument': 400,
    'failed-precondition': 400,
    internal: 500,
  };
  res.status(statusMap[code] || 500).json({ error: { status: code, message } });
}

// POST /createPaymentIntent
app.post('/createPaymentIntent', async (req, res) => {
  try {
    // Auth
    let uid;
    try {
      uid = await verifyAuth(req);
    } catch (e) {
      return err(res, 'unauthenticated', 'User must be signed in.');
    }

    const body = req.body.data || req.body;
    const { amount, currency, bookingId } = body;

    if (!amount || amount < 50) return err(res, 'invalid-argument', 'Amount must be at least 50 cents.');
    if (!bookingId) return err(res, 'invalid-argument', 'bookingId is required.');

    // Fetch booking
    const db = getFirestore();
    const bookingSnap = await db.collection('bookings').doc(bookingId).get();
    if (!bookingSnap.exists) return err(res, 'not-found', 'Booking not found.');
    const booking = bookingSnap.data();
    if (booking.userId !== uid) return err(res, 'permission-denied', 'Not your booking.');

    // Stripe
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) return err(res, 'internal', 'Stripe key not configured.');

    const Stripe = require('stripe');
    const stripe = Stripe(stripeKey);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: currency || 'cad',
      metadata: { bookingId, userId: uid },
      automatic_payment_methods: { enabled: true },
    });

    return ok(res, { clientSecret: paymentIntent.client_secret });
  } catch (e) {
    console.error('createPaymentIntent error:', e.message || e);
    return err(res, 'internal', e.message || 'Server error');
  }
});

// POST /cancelBooking
app.post('/cancelBooking', async (req, res) => {
  try {
    let uid;
    try {
      uid = await verifyAuth(req);
    } catch (e) {
      return err(res, 'unauthenticated', 'User must be signed in.');
    }

    const body = req.body.data || req.body;
    const { bookingId } = body;
    if (!bookingId) return err(res, 'invalid-argument', 'bookingId is required.');

    const db = getFirestore();
    const bookingRef = db.collection('bookings').doc(bookingId);
    const bookingSnap = await bookingRef.get();
    if (!bookingSnap.exists) return err(res, 'not-found', 'Booking not found.');
    const booking = bookingSnap.data();

    if (booking.userId !== uid) return err(res, 'permission-denied', 'Not your booking.');
    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.COMPLETED) {
      return err(res, 'failed-precondition', 'Booking cannot be cancelled.');
    }

    const startTime = booking.startTime.toDate
      ? booking.startTime.toDate()
      : new Date(booking.startTime._seconds * 1000);
    const hoursUntilStart = (startTime.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntilStart < 5) {
      return err(res, 'failed-precondition',
        'Cancellation is only allowed more than 5 hours before the booking start time.');
    }

    const createdAt = booking.createdAt.toDate
      ? booking.createdAt.toDate()
      : new Date(booking.createdAt._seconds * 1000);
    const minutesSinceBooking = (Date.now() - createdAt.getTime()) / (1000 * 60);
    const isRefundEligible = booking.paymentStatus === 'succeeded' && minutesSinceBooking <= 30;

    let refunded = false;
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (isRefundEligible && booking.paymentIntentId && stripeKey) {
      try {
        const Stripe = require('stripe');
        const stripe = Stripe(stripeKey);
        await stripe.refunds.create({ payment_intent: booking.paymentIntentId });
        refunded = true;
      } catch (stripeErr) {
        console.error('Refund error:', stripeErr.message);
      }
    }

    await bookingRef.update({
      status: BookingStatus.CANCELLED,
      paymentStatus: refunded ? 'refunded' : booking.paymentStatus,
      cancelledAt: new Date(),
    });

    const message = refunded
      ? 'Booking cancelled. A full refund has been issued (3–5 business days).'
      : isRefundEligible
        ? 'Booking cancelled. Refund could not be processed automatically — please contact support.'
        : 'Booking cancelled. No refund issued as the cancellation window has passed.';

    return ok(res, { refunded, message });
  } catch (e) {
    console.error('cancelBooking error:', e.message || e);
    return err(res, 'internal', e.message || 'Server error');
  }
});

app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`ParkSpot API running on port ${PORT}`));
