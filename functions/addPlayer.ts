
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.0';

Deno.serve(async (req) => {
    try {
        // Authenticate the request and ensure the user is an admin
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        console.log('User from auth check:', user); // Debug log
        
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized: User not authenticated.' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }
        
        // Admin Level 2 or higher can add players
        if (!user.super_admin_level || user.super_admin_level < 2) {
            return new Response(JSON.stringify({ error: `Unauthorized: This action requires at least Admin 2 privileges.` }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }

        // Get email and display name from the request body
        const { email, display_name } = await req.json();
        if (!email || !display_name) {
            return new Response(JSON.stringify({ error: 'Email and Display Name are required.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        // Use service role to check if a user with this email already exists
        const existingUsers = await base44.asServiceRole.entities.User.filter({ email: email });
        if (existingUsers.length > 0) {
             return new Response(JSON.stringify({ error: 'A player with this email address already exists.' }), { status: 409, headers: { 'Content-Type': 'application/json' } });
        }

        // Create the new player record
        const newUserPayload = {
            email: email,
            full_name: display_name,
            display_name: display_name,
            profile_icon: '🏈', // Default icon
            role: 'user',
            super_admin_level: 0,
            money_deposited: 0,
            money_owed: 0,
            total_score: 0,
            sms_notifications: true,
            email_notifications: true,
            time_zone: 'America/Los_Angeles' // Default timezone
        };

        const newPlayer = await base44.asServiceRole.entities.User.create(newUserPayload);

        return new Response(JSON.stringify({ success: true, player: newPlayer }), { status: 201, headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error('Error adding player:', error);
        return new Response(JSON.stringify({ error: `Failed to add player: ${error.message}` }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
});
