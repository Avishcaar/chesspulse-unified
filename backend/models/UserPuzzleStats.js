import mongoose from 'mongoose';

const themeStatSchema = new mongoose.Schema({
    solved: { type: Number, default: 0 },
    attempted: { type: Number, default: 0 }
}, { _id: false });

const dailyStatSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    solved: { type: Number, default: 0 },
    attempted: { type: Number, default: 0 },
    rating: { type: Number }
}, { _id: false });

const pulseProfileSchema = new mongoose.Schema({
    level: {
        type: String,
        enum: ['new', 'beginner', 'club', 'intermediate', 'advanced', 'expert'],
        required: true
    },
    rating: { type: Number, min: 400, max: 2800, default: null },
    goals: [{
        type: String,
        enum: ['tactics', 'opening', 'middlegame', 'endgame', 'calculation', 'boardVision']
    }],
    challenge: {
        type: String,
        enum: ['missTactics', 'calculateLines', 'openingTransitions', 'middlegamePlans', 'endgameTechnique', 'timePressure', 'unsure'],
        default: 'unsure'
    },
    sessionMinutes: { type: Number, enum: [10, 20, 30], default: 20 },
    externalSources: [{
        type: String,
        enum: ['chesscom', 'lichess']
    }]
}, { _id: false });

const userPuzzleStatsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },
    rating: {
        type: Number,
        default: 1200
    },
    peakRating: {
        type: Number,
        default: 1200
    },
    ratingHistory: [{
        date: { type: Date, default: Date.now },
        rating: { type: Number }
    }],
    totalSolved: {
        type: Number,
        default: 0
    },
    totalAttempted: {
        type: Number,
        default: 0
    },
    currentStreak: {
        type: Number,
        default: 0
    },
    bestStreak: {
        type: Number,
        default: 0
    },
    lastStreakDate: {
        type: Date,
        default: null
    },
    themeStats: {
        type: Map,
        of: themeStatSchema,
        default: new Map()
    },
    difficultyStats: {
        beginner: { type: themeStatSchema, default: () => ({ solved: 0, attempted: 0 }) },
        intermediate: { type: themeStatSchema, default: () => ({ solved: 0, attempted: 0 }) },
        advanced: { type: themeStatSchema, default: () => ({ solved: 0, attempted: 0 }) },
        expert: { type: themeStatSchema, default: () => ({ solved: 0, attempted: 0 }) }
    },
    modeStats: {
        rush: { type: themeStatSchema, default: () => ({ solved: 0, attempted: 0 }) },
        survival: { type: themeStatSchema, default: () => ({ solved: 0, attempted: 0 }) },
        rated: { type: themeStatSchema, default: () => ({ solved: 0, attempted: 0 }) },
        themed: { type: themeStatSchema, default: () => ({ solved: 0, attempted: 0 }) },
      daily: { type: themeStatSchema, default: () => ({ solved: 0, attempted: 0 }) },
      curated: { type: themeStatSchema, default: () => ({ solved: 0, attempted: 0 }) }
    },
    pulseProfile: { type: pulseProfileSchema, default: null },
    pulsePlan: { type: mongoose.Schema.Types.Mixed, default: null },
    pulsePlanUpdatedAt: { type: Date, default: null },
    externalActivity: { type: mongoose.Schema.Types.Mixed, default: () => ({ providers: {} }) },
    dailyHistory: [dailyStatSchema],
    totalTimeMs: {
        type: Number,
        default: 0
    },
    averageTimeMs: {
        type: Number,
        default: 0
    },
    lastActive: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

userPuzzleStatsSchema.index({ rating: -1 });
userPuzzleStatsSchema.index({ totalSolved: -1 });
userPuzzleStatsSchema.index({ bestStreak: -1 });
userPuzzleStatsSchema.index({ lastActive: -1 });

userPuzzleStatsSchema.methods.updateStreak = function (solved) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (solved) {
        if (this.lastStreakDate) {
            const lastDate = new Date(this.lastStreakDate);
            lastDate.setHours(0, 0, 0, 0);

            const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                // Same day, streak continues
            } else if (diffDays === 1) {
                // Next day, increment streak
                this.currentStreak += 1;
            } else {
                // Streak broken, start new
                this.currentStreak = 1;
            }
        } else {
            this.currentStreak = 1;
        }

        this.lastStreakDate = today;

        if (this.currentStreak > this.bestStreak) {
            this.bestStreak = this.currentStreak;
        }
    }
};

userPuzzleStatsSchema.methods.getDifficultyTier = function (rating) {
    if (rating < 1200) return 'beginner';
    if (rating < 1600) return 'intermediate';
    if (rating < 2000) return 'advanced';
    return 'expert';
};

userPuzzleStatsSchema.statics.getOrCreate = async function (userId) {
    let stats = await this.findOne({ userId });
    if (!stats) {
        stats = await this.create({ userId });
    }
    return stats;
};

const UserPuzzleStats = mongoose.model('UserPuzzleStats', userPuzzleStatsSchema);

export default UserPuzzleStats;
