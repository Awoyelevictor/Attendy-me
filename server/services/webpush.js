import webpush from 'web-push';

const publicVapidKey = process.env.VAPID_PUBLIC_KEY || 'BIS1hGV4GmszatAYFbGBZTFbUyJBkiIfwiYmEHPjWsm0DEdNQU5g-WjP0uUWEilqeqTZxLm2rxEbiQGOtIiG4Mk';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || 'kcYQIV0fiAvlfamgC_pB9KAQvEZ_CU3N9Y0zO9vx9qM';

webpush.setVapidDetails(
  'mailto:support@example.com',
  publicVapidKey,
  privateVapidKey
);

export { webpush, publicVapidKey };
