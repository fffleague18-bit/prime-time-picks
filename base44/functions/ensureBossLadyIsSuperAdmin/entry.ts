import { createClientFromRequest } from 'npm:@base44/sdk@0.7.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const serviceRoleClient = base44.asServiceRole;
        
        // Find and ensure Boss Lady is always Super Admin
        const users = await serviceRoleClient.entities.User.list();
        
        const bossLady = users.find(user => 
            user.display_name?.toLowerCase() === 'boss lady' || 
            user.full_name?.toLowerCase() === 'boss lady' ||
            user.email?.toLowerCase().includes('bosslady') ||
            user.email?.toLowerCase().includes('boss.lady') ||
            user.display_name?.toLowerCase().includes('boss') ||
            user.full_name?.toLowerCase().includes('boss')
        );
        
        if (bossLady && bossLady.super_admin_level !== 3) {
            await serviceRoleClient.entities.User.update(bossLady.id, {
                super_admin_level: 3,
                role: 'admin'
            });
            
            return Response.json({ 
                success: true, 
                message: `Boss Lady's Super Admin status has been restored.`,
                updated: true
            });
        }
        
        return Response.json({ 
            success: true, 
            message: bossLady ? 'Boss Lady is already Super Admin.' : 'Boss Lady not found.',
            updated: false
        });
        
    } catch (error) {
        console.error('Error ensuring Boss Lady is super admin:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});