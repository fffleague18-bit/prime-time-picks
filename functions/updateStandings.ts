import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

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

        // Fetch game, predictions, and all users in parallel for efficiency
        const [game, predictions, allUsers] = await Promise.all([
            serviceRoleClient.entities.Game.get(gameId),
            serviceRoleClient.entities.Prediction.filter({ game_id: gameId }),
            serviceRoleClient.entities.User.list(undefined, 2000) // Get all users at once
        ]);

        if (!game) {
            return Response.json({ error: 'Game not found' }, { status: 400 });
        }

        if (game.status !== 'completed') {
            return Response.json({ error: 'Game must be completed' }, { status: 400 });
        }

        console.log(`Updating standings for ${predictions.length} predictions`);

        // Create a map of users by ID for quick lookup
        const userMap = new Map();
        allUsers.forEach(user => {
            userMap.set(user.id, user);
        });

        let updatedCount = 0;
        const updatePromises = [];
        
        for (const prediction of predictions) {
            try {
                const player = userMap.get(prediction.player_id);
                if (!player) {
                    console.log(`Player ${prediction.player_id} not found, skipping...`);
                    continue;
                }

                const pointsFromThisGame = prediction.points_earned || 0;
                const currentScore = player.total_score || 0;
                const currentGamesPlayed = player.games_played || 0;
                
                // Calculate new totals
                const newTotalScore = currentScore + pointsFromThisGame;
                const newGamesPlayed = currentGamesPlayed + 1;

                // Parse existing record or start fresh
                let [wins, losses, pushes] = [0, 0, 0];
                if (player.record && typeof player.record === 'string' && player.record.trim() !== '') {
                    try {
                        const recordParts = player.record.trim().split('-');
                        if (recordParts.length >= 2) {
                            wins = parseInt(recordParts[0]) || 0;
                            losses = parseInt(recordParts[1]) || 0;
                            pushes = parseInt(recordParts[2]) || 0; // Third part might not exist, defaults to 0
                        }
                    } catch (recordError) {
                        console.warn(`Invalid record format for player ${player.id}: "${player.record}". Starting fresh.`);
                        // wins, losses, pushes remain 0
                    }
                }

                // Update record based on this game's outcome
                if (pointsFromThisGame === 1) {
                    wins++;
                } else if (pointsFromThisGame === 0.5) {
                    pushes++;
                } else { // pointsFromThisGame === 0
                    losses++;
                }

                const newRecord = `${wins}-${losses}-${pushes}`;
                
                console.log(`Updating ${player.display_name || player.full_name}: Score ${currentScore} -> ${newTotalScore}, Record ${player.record || '0-0-0'} -> ${newRecord}, Games ${currentGamesPlayed} -> ${newGamesPlayed}`);

                // Create update promise
                const updatePromise = serviceRoleClient.entities.User.update(player.id, {
                    total_score: newTotalScore,
                    record: newRecord,
                    games_played: newGamesPlayed,
                }).then(() => {
                    console.log(`Successfully updated ${player.display_name || player.full_name}`);
                    return true;
                }).catch((error) => {
                    console.error(`Failed to update player ${player.id} (${player.display_name || player.full_name}):`, error);
                    return false;
                });

                updatePromises.push(updatePromise);
                updatedCount++;
                
            } catch (playerError) {
                console.error(`Error processing player ${prediction.player_id}:`, playerError);
                // Continue with other players
            }
        }

        // Execute all updates with some delay between batches
        console.log(`Executing ${updatePromises.length} player updates...`);
        const batchSize = 5; // Process 5 at a time to avoid rate limits
        
        for (let i = 0; i < updatePromises.length; i += batchSize) {
            const batch = updatePromises.slice(i, i + batchSize);
            await Promise.all(batch);
            
            // Add delay between batches
            if (i + batchSize < updatePromises.length) {
                await delay(500);
            }
        }

        console.log(`Successfully processed ${updatedCount} player updates`);

        return Response.json({ 
            success: true, 
            message: `Successfully updated records for ${updatedCount} players after completing the game.`
        });

    } catch (error) {
        console.error('Error updating standings incrementally:', error);
        return Response.json({ 
            error: `Failed to update standings: ${error.message}` 
        }, { status: 500 });
    }
});