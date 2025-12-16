import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Helper function to add delays and avoid rate limits
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const serviceRoleClient = base44.asServiceRole;

        // Step 1: Fetch all necessary data in parallel - FIXED: Reduced prediction limit to 10,000 max
        const [completedGames, allPredictions, allUsers] = await Promise.all([
            serviceRoleClient.entities.Game.filter({ status: 'completed' }, '-game_date', 500),
            serviceRoleClient.entities.Prediction.list(undefined, 10000),
            serviceRoleClient.entities.User.list(undefined, 2000)
        ]);

        if (completedGames.length === 0) {
            return Response.json({ success: true, message: 'No completed games found to recalculate.' });
        }

        // Step 2: Prepare a map to hold new stats for each user, resetting scores to 0
        const userStatsMap = new Map();
        allUsers.forEach(user => {
            userStatsMap.set(user.id, {
                total_score: 0,
                games_played: 0,
                wins: 0,
                losses: 0,
                pushes: 0
            });
        });

        // Step 3: Perform all calculations in memory WITHOUT writing to the database
        for (const game of completedGames) {
            if (game.home_score === null || game.away_score === null) continue;

            const gamePredictions = allPredictions.filter(p => p.game_id === game.id);
            const actualSpread = game.home_score - game.away_score;
            const totalPoints = game.home_score + game.away_score;

            for (const prediction of gamePredictions) {
                const userStat = userStatsMap.get(prediction.player_id);
                if (!userStat) continue;

                let spreadOutcome = 0;
                if (prediction.spread_pick === 'home') {
                    if (actualSpread + game.spread > 0) spreadOutcome = 1;
                    else if (actualSpread + game.spread === 0) spreadOutcome = 0.5;
                } else { // away
                    if (actualSpread + game.spread < 0) spreadOutcome = 1;
                    else if (actualSpread + game.spread === 0) spreadOutcome = 0.5;
                }

                let ouOutcome = 0;
                if (totalPoints > game.over_under) {
                    if (prediction.over_under_pick === 'over') ouOutcome = 1;
                } else if (totalPoints < game.over_under) {
                    if (prediction.over_under_pick === 'under') ouOutcome = 1;
                } else {
                    ouOutcome = 0.5;
                }
                
                let points = 0;
                if (spreadOutcome === 1 && ouOutcome === 1) points = 1;
                else if ((spreadOutcome === 1 && ouOutcome === 0.5) || (spreadOutcome === 0.5 && ouOutcome === 1)) points = 0.5;

                // Update the user's stats in the in-memory map
                userStat.total_score += points;
                userStat.games_played += 1;
                if (points === 1) userStat.wins++;
                else if (points === 0.5) userStat.pushes++;
                else userStat.losses++;
            }
        }
        
        // Step 4: Write the final, calculated stats to the User table with delays
        let updatedUserCount = 0;
        for (const [userId, stats] of userStatsMap.entries()) {
            const newRecord = `${stats.wins}-${stats.losses}-${stats.pushes}`;
            await serviceRoleClient.entities.User.update(userId, {
                total_score: stats.total_score,
                record: newRecord,
                games_played: stats.games_played
            });
            updatedUserCount++;
            await delay(400); // Add a 400ms delay between each user update to be safe
        }

        return Response.json({ 
            success: true, 
            message: `Successfully recalculated standings for ${updatedUserCount} players across ${completedGames.length} games.`
        });

    } catch (error) {
        console.error('Error in full recalculation:', error);
        return Response.json({ 
            error: `Failed to recalculate all results: ${error.message}` 
        }, { status: 500 });
    }
});