import { createClientFromRequest } from 'npm:@base44/sdk@0.7.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const users = await base44.asServiceRole.entities.User.list();
        
        // Find Boss Lady by the specific email address
        const bossLady = users.find(user => 
            user.email?.toLowerCase() === 'fffleague18@gmail.com'
        );
        
        if (!bossLady) {
            return Response.json({ 
                error: 'User with email fffleague18@gmail.com not found. Please ensure this user exists.' 
            }, { status: 404 });
        }
        
        // Force Boss Lady to super admin level 3
        await base44.asServiceRole.entities.User.update(bossLady.id, {
            super_admin_level: 3,
            role: 'admin'
        });
        
        return Response.json({ 
            success: true, 
            message: `${bossLady.display_name || bossLady.full_name} (fffleague18@gmail.com) has been permanently set as Super Admin (Level 3)!`,
        });
        
    } catch (error) {
        console.error('Error making Boss Lady super admin:', error);
        return Response.json({ 
            error: `Failed to grant super admin access: ${error.message}` 
        }, { status: 500 });
    }
});