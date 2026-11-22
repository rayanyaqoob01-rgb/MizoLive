/**
 * Mizo Live Cloud Functions Reference Implementation (Firebase Functions v2)
 * Deploy via `firebase deploy --only functions` when Blaze plan is enabled.
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp();
const db = getFirestore();

export const processStorePurchase = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }
  const uid = request.auth.uid;
  const itemId = String(request.data?.itemId || '');
  if (!itemId) {
    throw new HttpsError('invalid-argument', 'itemId is required.');
  }

  return db.runTransaction(async (tx) => {
    const itemSnap = await tx.get(db.doc(`storeItems/${itemId}`));
    if (!itemSnap.exists) {
      throw new HttpsError('not-found', 'Store item not found.');
    }
    const item = itemSnap.data()!;
    const walletRef = db.doc(`wallets/${uid}`);
    const walletSnap = await tx.get(walletRef);
    const coins = Number(walletSnap.data()?.coins ?? 0);
    if (coins < item.price) {
      throw new HttpsError('failed-precondition', 'Insufficient coin balance.');
    }

    tx.set(
      walletRef,
      {
        uid,
        coins: FieldValue.increment(-item.price),
        spentCoins: FieldValue.increment(item.price),
        ownedItemIds: FieldValue.arrayUnion(itemId),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    tx.set(db.collection(`wallets/${uid}/transactions`).doc(), {
      uid,
      type: 'store_purchase',
      title: `${item.name} (${item.category})`,
      amount: item.price,
      direction: 'out',
      createdAt: FieldValue.serverTimestamp(),
    });

    return { ok: true, itemId };
  });
});

export const settleGiftTransfer = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }
  const senderUid = request.auth.uid;
  const { recipientUid, giftPrice, giftName } = request.data || {};
  if (!recipientUid || typeof giftPrice !== 'number' || giftPrice <= 0) {
    throw new HttpsError('invalid-argument', 'Invalid gift payload.');
  }

  return db.runTransaction(async (tx) => {
    const senderWallet = db.doc(`wallets/${senderUid}`);
    const recipientWallet = db.doc(`wallets/${recipientUid}`);
    const senderSnap = await tx.get(senderWallet);
    const balance = Number(senderSnap.data()?.coins ?? 0);
    if (balance < giftPrice) {
      throw new HttpsError('failed-precondition', 'Insufficient coins for gift.');
    }

    const creatorShare = Math.round(giftPrice * 0.8);
    tx.update(senderWallet, {
      coins: FieldValue.increment(-giftPrice),
      spentCoins: FieldValue.increment(giftPrice),
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.set(
      recipientWallet,
      {
        uid: recipientUid,
        receivedCoins: FieldValue.increment(creatorShare),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    tx.set(db.collection(`wallets/${senderUid}/transactions`).doc(), {
      uid: senderUid,
      type: 'gift_sent',
      title: `Sent ${String(giftName || 'Gift')}`,
      amount: giftPrice,
      direction: 'out',
      createdAt: FieldValue.serverTimestamp(),
    });
    return { ok: true, creatorShare };
  });
});
