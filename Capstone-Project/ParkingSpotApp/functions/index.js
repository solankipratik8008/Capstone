/**
 * ParkSpot Cloud Functions — Gen 1
 * Set Stripe key: firebase functions:config:set stripe.secretkey="sk_..."
 */

const functions = require('firebase-functions');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp();

const RUNTIME_SA = 'functions-runner@parkingspotapp-eef8e.iam.gserviceaccount.com';

const BookingStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
};

/**
 * Creates a Stripe PaymentIntent for a booking.
 * Request data: { amount: number (cents), currency: string, bookingId: string }
 * Returns: { clientSecret: string }
 */
exports.createPaymentIntent = functions
  .runWith({ serviceAccount: RUNTIME_SA })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be signed in.');
    }

    const { amount, currency, bookingId } = data;

    if (!amount || amount < 50) {
      throw new functions.https.HttpsError('invalid-argument', 'Amount must be at least 50 cents.');
    }
    if (!bookingId) {
      throw new functions.https.HttpsError('invalid-argument', 'bookingId is required.');
    }

    const db = getFirestore();
    const bookingSnap = await db.collection('bookings').doc(bookingId).get();
    if (!bookingSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Booking not found.');
    }
    const booking = bookingSnap.data();
    if (booking.userId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'Not your booking.');
    }

    const stripeKey = functions.config().stripe?.secretkey || process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      throw new functions.https.HttpsError('internal', 'Stripe key not configured.');
    }

    const Stripe = require('stripe');
    const stripe = Stripe(stripeKey);

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount),
        currency: currency || 'cad',
        metadata: { bookingId, userId: context.auth.uid },
        automatic_payment_methods: { enabled: true },
      });
      return { clientSecret: paymentIntent.client_secret };
    } catch (error) {
      console.error('Stripe error:', error);
      throw new functions.https.HttpsError('internal', 'Failed to create payment intent: ' + error.message);
    }
  });

/**
 * Cancels a booking and issues a Stripe refund if within 30 minutes.
 * Request data: { bookingId: string }
 * Returns: { refunded: boolean, message: string }
 */
exports.cancelBooking = functions
  .runWith({ serviceAccount: RUNTIME_SA })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be signed in.');
    }

    const { bookingId } = data;
    if (!bookingId) {
      throw new functions.https.HttpsError('invalid-argument', 'bookingId is required.');
    }

    const db = getFirestore();
    const bookingRef = db.collection('bookings').doc(bookingId);
    const bookingSnap = await bookingRef.get();

    if (!bookingSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Booking not found.');
    }
    const booking = bookingSnap.data();

    if (booking.userId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'Not your booking.');
    }
    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.COMPLETED) {
      throw new functions.https.HttpsError('failed-precondition', 'Booking cannot be cancelled.');
    }

    const startTime = booking.startTime.toDate
      ? booking.startTime.toDate()
      : new Date(booking.startTime._seconds * 1000);
    const hoursUntilStart = (startTime.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntilStart < 5) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Cancellation is only allowed more than 5 hours before the booking start time.'
      );
    }

    const createdAt = booking.createdAt.toDate
      ? booking.createdAt.toDate()
      : new Date(booking.createdAt._seconds * 1000);
    const minutesSinceBooking = (Date.now() - createdAt.getTime()) / (1000 * 60);
    const isRefundEligible = booking.paymentStatus === 'succeeded' && minutesSinceBooking <= 30;

    let refunded = false;
    const stripeKey = functions.config().stripe?.secretkey || process.env.STRIPE_SECRET_KEY;
    if (isRefundEligible && booking.paymentIntentId && stripeKey) {
      const Stripe = require('stripe');
      const stripe = Stripe(stripeKey);
      try {
        await stripe.refunds.create({ payment_intent: booking.paymentIntentId });
        refunded = true;
      } catch (stripeError) {
        console.error('Stripe refund error:', stripeError);
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

    return { refunded, message };
  });
