import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Only admins can reset stats
    if (!user.super_admin_level || user.super_admin_level < 2) {
      return Response.json({ error: 'Forbidden: admin access required' }, { status: 403 });
    }

    // Fetch all users via service role
    const users = await base44.asServiceRole.entities.User.list(undefined, 5000);

    let resetCount = 0;
    for (const u of users) {
      await base44.asServiceRole.entities.User.update(u.id, {
        total_score: 0,
        record: "0-0-0",
        games_played: 0
      });
      resetCount++;
    }

    return Response.json({
      success: true,
      message: `Reset stats for ${resetCount} users`,
      resetCount
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}