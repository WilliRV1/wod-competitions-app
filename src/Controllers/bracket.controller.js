const Match = require('../Models/match.model');
const Battle = require('../Models/battle.model');
const BattleRegistration = require('../Models/battleRegistration.model');
const User = require('../Models/user.model');

// Helper to calculate next power of 2
const nextPowerOf2 = (n) => {
    if (n === 0) return 0;
    return Math.pow(2, Math.ceil(Math.log(n) / Math.log(2)));
};

// Recursive function to build empty bracket tree
const buildBracketTree = async (battleId, category, round, totalRounds, nextMatchId = null, nextMatchSlot = null) => {
    // Create current match
    const match = new Match({
        battle: battleId,
        categoria: category,
        ronda: round,
        // Placeholder IDs for now (will be updated if it's a leaf node, or remain null until progression)
        participante1: new User()._id, // Temporary dummy ID or handle as null in model (model says required, might need to relax or use placeholder)
        participante2: new User()._id,
        nextMatchId: nextMatchId,
        nextMatchSlot: nextMatchSlot,
        roundName: getRoundName(round, totalRounds),
        estado: 'pendiente'
    });

    // We need to save to get the ID
    // BUT: Model requires participants. 
    // FIX: We should probably allow null participants for future matches in the schema, 
    // OR use a specific "TBD" user. 
    // For now, let's assume we can relax the required constraint or use a placeholder.
    // Let's check the model... it says required: true. 
    // I will need to update the model to make participants optional for future matches.
    // For this step, I will assume I can update the model or I will use a "BYE" or "TBD" placeholder if I can't change schema now.
    // Actually, I just updated the model but didn't change required. I should fix that.

    // Let's proceed assuming I will fix the model to not require participants.

    await match.save();

    // If this is NOT the first round (meaning it has children feeding into it), create them
    if (round > 1) {
        await buildBracketTree(battleId, category, round - 1, totalRounds, match._id, 'participante1');
        await buildBracketTree(battleId, category, round - 1, totalRounds, match._id, 'participante2');
    }

    return match;
};

const getRoundName = (round, totalRounds) => {
    if (round === totalRounds) return "Final";
    if (round === totalRounds - 1) return "Semifinals";
    if (round === totalRounds - 2) return "Quarterfinals";
    return `Round ${round}`;
};

exports.generateBracket = async (req, res) => {
    console.log("🚀 generateBracket called");
    try {
        const { battleId, category } = req.body;
        console.log(`Params: battleId=${battleId}, category=${category}`);

        // Map display names to database enum values
        const categoryMap = {
            'Intermedio Masculino': 'intermedio-male',
            'Intermedio Femenino': 'intermedio-female',
            'Scaled Masculino': 'scaled-male',
            'Scaled Femenino': 'scaled-female'
        };

        const dbCategory = categoryMap[category] || category;
        console.log(`Mapped category: ${category} -> ${dbCategory}`);

        // 1. Get confirmed registrations
        const registrations = await BattleRegistration.find({
            eventId: 'WMBATTLE-T1-2026', // Should be dynamic based on battle
            category: dbCategory,
            status: 'confirmed'
        });
        console.log(`Found ${registrations.length} registrations`);

        if (registrations.length < 2) {
            return res.status(400).json({ message: "Not enough participants to generate a bracket (min 2)." });
        }

        // 2. Determine bracket size
        const numParticipants = registrations.length;
        const bracketSize = nextPowerOf2(numParticipants);
        const totalRounds = Math.log2(bracketSize);
        console.log(`Bracket Size: ${bracketSize}, Total Rounds: ${totalRounds}`);

        // 3. Shuffle participants
        const shuffled = registrations.sort(() => 0.5 - Math.random());

        // 4. Build the Tree Structure (Empty Matches)
        let currentRoundMatches = [];
        let previousRoundMatches = [];

        // Create Round 1 (The first round played)
        console.log("Creating Round 1...");
        for (let i = 0; i < bracketSize / 2; i++) {
            const p1 = shuffled[i * 2];
            const p2 = shuffled[i * 2 + 1];

            const match = new Match({
                battle: battleId,
                categoria: dbCategory,
                ronda: 1,
                participante1: p1 ? p1.user : null,
                participante2: p2 ? p2.user : null,
                roundName: getRoundName(1, totalRounds),
                estado: 'pendiente'
            });

            await match.save();
            currentRoundMatches.push(match);
        }
        console.log(`Round 1 created: ${currentRoundMatches.length} matches`);

        previousRoundMatches = currentRoundMatches;

        // Create subsequent rounds
        for (let r = 2; r <= totalRounds; r++) {
            console.log(`Creating Round ${r}...`);
            currentRoundMatches = [];
            for (let i = 0; i < previousRoundMatches.length; i += 2) {
                const matchLeft = previousRoundMatches[i];
                const matchRight = previousRoundMatches[i + 1];

                const nextMatch = new Match({
                    battle: battleId,
                    categoria: dbCategory,
                    ronda: r,
                    participante1: null, // TBD
                    participante2: null, // TBD
                    roundName: getRoundName(r, totalRounds),
                    estado: 'pendiente'
                });

                await nextMatch.save();
                currentRoundMatches.push(nextMatch);

                // Link previous matches to this one
                if (matchLeft) {
                    matchLeft.nextMatchId = nextMatch._id;
                    matchLeft.nextMatchSlot = 'participante1';
                    await matchLeft.save();
                }

                if (matchRight) {
                    matchRight.nextMatchId = nextMatch._id;
                    matchRight.nextMatchSlot = 'participante2';
                    await matchRight.save();
                }
            }
            previousRoundMatches = currentRoundMatches;
        }

        console.log("Bracket generation complete!");
        res.status(201).json({ message: "Bracket generated successfully", totalRounds });

    } catch (error) {
        console.error("❌ Error in generateBracket:", error);
        res.status(500).json({ message: "Error generating bracket", error: error.message });
    }
};

exports.getBracket = async (req, res) => {
    try {
        const { battleId, category } = req.params;
        const matches = await Match.find({ battle: battleId, categoria: category })
            .populate('participante1', 'nombre apellidos')
            .populate('participante2', 'nombre apellidos')
            .sort({ ronda: 1 });

        res.status(200).json(matches);
    } catch (error) {
        res.status(500).json({ message: "Error fetching bracket", error: error.message });
    }
};
