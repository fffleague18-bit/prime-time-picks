import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Helper function to add delays
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const serviceRoleClient = base44.asServiceRole;

        const { gameId } = await req.json();
        if (!gameId) {
            return Response.json({ error: 'gameId is required' }, { status: 400 });
        }

        // Fetch game and predictions
        const [game, predictions] = await Promise.all([
            serviceRoleClient.entities.Game.get(gameId),
            serviceRoleClient.entities.Prediction.filter({ game_id: gameId })
        ]);

        if (!game) {
            return Response.json({ error: "Game not found." }, { status: 400 });
        }

        if (game.home_score === null || game.away_score === null || 
            game.home_score === undefined || game.away_score === undefined) {
            return Response.json({ error: "Game's final scores are not set." }, { status: 400 });
        }

        console.log(`Processing ${predictions.length} predictions for game: ${game.away_team} @ ${game.home_team}`);

        const actualSpread = game.home_score - game.away_score; // Home score - Away score
        const totalPoints = game.home_score + game.away_score;
        let processedCount = 0;

        for (const prediction of predictions) {
            try {
                // Calculate spread outcome
                let spreadOutcome = 0;
                if (prediction.spread_pick === 'home') {
                    // User picked home team. Home team covers if (home_score - away_score) > -spread
                    // Which is equivalent to (actual_spread + spread) > 0
                    if (actualSpread + game.spread > 0) {
                        spreadOutcome = 1; // Win
                    } else if (actualSpread + game.spread === 0) {
                        spreadOutcome = 0.5; // Push
                    }
                    // else 0 (loss)
                } else { // away
                    // User picked away team. Away team covers if (away_score - home_score) > spread  
                    // Which is equivalent to -(home_score - away_score) > spread
                    // Which is equivalent to (actual_spread + spread) < 0
                    if (actualSpread + game.spread < 0) {
                        spreadOutcome = 1; // Win
                    } else if (actualSpread + game.spread === 0) {
                        spreadOutcome = 0.5; // Push
                    }
                    // else 0 (loss)
                }

                // Calculate over/under outcome
                let ouOutcome = 0;
                if (totalPoints > game.over_under) {
                    if (prediction.over_under_pick === 'over') ouOutcome = 1;
                } else if (totalPoints < game.over_under) {
                    if (prediction.over_under_pick === 'under') ouOutcome = 1;
                } else {
                    ouOutcome = 0.5; // Push - total equals over/under
                }
                
                // Calculate final points
                let points = 0;
                if (spreadOutcome === 1 && ouOutcome === 1) {
                    points = 1; // Both correct
                } else if ((spreadOutcome === 1 && ouOutcome === 0.5) || (spreadOutcome === 0.5 && ouOutcome === 1)) {
                    points = 0.5; // One correct, one push
                }
                // All other combinations give 0 points
                
                console.log(`Player ${prediction.player_name}: Spread ${spreadOutcome}, O/U ${ouOutcome}, Points: ${points}`);

                // Update prediction with calculated points
                await serviceRoleClient.entities.Prediction.update(prediction.id, { 
                    points_earned: points, 
                    is_locked: true 
                });
                
                processedCount++;
                await delay(200); // Small delay between updates
            } catch (predError) {
                console.error(`Error processing prediction ${prediction.id}:`, predError);
                // Continue processing other predictions
            }
        }
        
        console.log(`Processed ${processedCount} predictions, now updating standings...`);
        
        // Wait a moment then trigger standings update
        await delay(1000);
        
        try {
            const standingsResult = await base44.functions.invoke('updateStandings', { gameId: gameId });
            console.log('Standings update result:', standingsResult);
        } catch (standingsError) {
            console.error('Error updating standings:', standingsError);
            // Don't fail the whole process if standings update fails
        }
        
        return Response.json({ 
            success: true, 
            message: `Calculated ${processedCount} predictions and updated standings.`
        });

    } catch (error) {
        console.error('Error in results calculation process:', error);
        return Response.json({ 
            error: `Failed to calculate results: ${error.message}` 
        }, { status: 500 });
    }
});