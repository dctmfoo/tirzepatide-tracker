#!/usr/bin/env node
/**
 * VAPID Key Generator for Web Push Notifications
 *
 * Run once to generate your VAPID key pair:
 *   node scripts/generate-vapid-keys.mjs
 *
 * Then add the output to your .env file.
 */

import webpush from 'web-push';

const vapidKeys = webpush.generateVAPIDKeys();

console.log('Add these to your .env file:\n');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY="${vapidKeys.publicKey}"`);
console.log(`VAPID_PRIVATE_KEY="${vapidKeys.privateKey}"`);
console.log('VAPID_SUBJECT="mailto:notifications@mounjaro-tracker.com"');
console.log('\nNote: Keep VAPID_PRIVATE_KEY secret! Never commit it to version control.');
