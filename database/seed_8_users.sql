-- =========================================================================
-- PayPilot Seed Script: 8 Diverse Test Users with Initial Wallets ($1,000)
-- All accounts share the password: Password123!
-- =========================================================================

INSERT INTO "users" ("email", "name", "password_hash", "phone", "avatar_url", "bio")
VALUES
  (
    'alice@paypilot.app',
    'Alice Johnson',
    '$argon2id$v=19$m=65536,t=3,p=4$xtlGy33L5F0mcP5gVwHG6Q$euXrMPwfDaWDniSd8gJdPJYmW2mOKYKkMnck1uQof1U',
    '+15550100001',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
    'Product designer & avid traveler. Loves weekend getaways and shared dinners.'
  ),
  (
    'bob@paypilot.app',
    'Bob Smith',
    '$argon2id$v=19$m=65536,t=3,p=4$xtlGy33L5F0mcP5gVwHG6Q$euXrMPwfDaWDniSd8gJdPJYmW2mOKYKkMnck1uQof1U',
    '+15550100002',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
    'Software engineer and foodie. Always ready to split group brunch bills.'
  ),
  (
    'charlie@paypilot.app',
    'Charlie Davis',
    '$argon2id$v=19$m=65536,t=3,p=4$xtlGy33L5F0mcP5gVwHG6Q$euXrMPwfDaWDniSd8gJdPJYmW2mOKYKkMnck1uQof1U',
    '+15550100003',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
    'Photographer & road-trip enthusiast. Tracking road trip gas and Airbnb stays.'
  ),
  (
    'diana@paypilot.app',
    'Diana Prince',
    '$argon2id$v=19$m=65536,t=3,p=4$xtlGy33L5F0mcP5gVwHG6Q$euXrMPwfDaWDniSd8gJdPJYmW2mOKYKkMnck1uQof1U',
    '+15550100004',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
    'Marketing lead & fitness lover. Organizes group workouts and smoothies.'
  ),
  (
    'ethan@paypilot.app',
    'Ethan Hunt',
    '$argon2id$v=19$m=65536,t=3,p=4$xtlGy33L5F0mcP5gVwHG6Q$euXrMPwfDaWDniSd8gJdPJYmW2mOKYKkMnck1uQof1U',
    '+15550100005',
    'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61',
    'Financial analyst. Passionate about debt simplification and equal splits.'
  ),
  (
    'fiona@paypilot.app',
    'Fiona Gallagher',
    '$argon2id$v=19$m=65536,t=3,p=4$xtlGy33L5F0mcP5gVwHG6Q$euXrMPwfDaWDniSd8gJdPJYmW2mOKYKkMnck1uQof1U',
    '+15550100006',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9',
    'Event planner. Keeps household utilities and shared subscriptions organized.'
  ),
  (
    'george@paypilot.app',
    'George Clark',
    '$argon2id$v=19$m=65536,t=3,p=4$xtlGy33L5F0mcP5gVwHG6Q$euXrMPwfDaWDniSd8gJdPJYmW2mOKYKkMnck1uQof1U',
    '+15550100007',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6',
    'Music producer & vinyl collector. Splits festival tickets and studio rentals.'
  ),
  (
    'hannah@paypilot.app',
    'Hannah Abbott',
    '$argon2id$v=19$m=65536,t=3,p=4$xtlGy33L5F0mcP5gVwHG6Q$euXrMPwfDaWDniSd8gJdPJYmW2mOKYKkMnck1uQof1U',
    '+15550100008',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1',
    'Writer & coffee shop explorer. Splits coworking spaces and book club supplies.'
  )
ON CONFLICT ("email") DO UPDATE SET
  "name" = EXCLUDED."name",
  "phone" = EXCLUDED."phone",
  "bio" = EXCLUDED."bio",
  "avatar_url" = EXCLUDED."avatar_url";

-- Initialize/ensure wallets with 100,000 cents ($1,000.00 USD) starting balance
INSERT INTO "wallets" ("user_id", "balance")
SELECT "id", 100000 FROM "users"
WHERE "email" IN (
  'alice@paypilot.app',
  'bob@paypilot.app',
  'charlie@paypilot.app',
  'diana@paypilot.app',
  'ethan@paypilot.app',
  'fiona@paypilot.app',
  'george@paypilot.app',
  'hannah@paypilot.app'
)
ON CONFLICT ("user_id") DO NOTHING;
