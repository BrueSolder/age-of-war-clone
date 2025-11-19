
// --- Canvas and DOM Elements ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameContainer = document.getElementById('game-container');
const almanacCanvas = document.getElementById('almanac-preview');
const almanacCtx = almanacCanvas.getContext('2d');
const choiceCanvas1 = document.getElementById('choice-canvas-1');
const choiceCtx1 = choiceCanvas1.getContext('2d');
const choiceCanvas2 = document.getElementById('choice-canvas-2');
const choiceCtx2 = choiceCanvas2.getContext('2d');

// --- Game Configuration ---
const groundHeight = 50;
const baseWidth = 100;
const baseHeight = 105;
const spawnCooldown = 2000;
let panSpeed = 20;
let doublePanSpeed = panSpeed * 2;
let panEdgeThreshold = 20;
let gameSpeed = 1;
let lastTime = 0;
let isGameOver = false;
let isPaused = false;
let isSellModeActive = false;
let isPlacingStructure = false; 
let structureToPlace = null; 
let cameraX = 0;
let worldWidth = 0;
let mouseX = 0;
let panLeftBtnDown = false;
let panRightBtnDown = false;
let panLeftKeyDown = false;
let panRightKeyDown = false;
let almanacPreviewUnit = null;
let isAlmanacOpen = false;
let almanacTeamView = 'player';
let screenShakeMagnitude = 0;
let gameTime = 0; 
const DAY_DURATION = 120000; 

// --- Game Constants ---
const INITIAL_HP = 1000;
const INITIAL_GOLD = 180;
const INITIAL_AGE = 1;
const INITIAL_EXP = 0;
const SPECIAL_UNIT_UNLOCK_COST = 500;

// --- Performance & Loop Control ---
let gameLoopStarted = false; // prevent multiple RAF chains
let lastUIUpdateTime = 0;
const UI_UPDATE_INTERVAL = 80; // ms, throttle DOM updates
function isInView(x, width = 0, padding = 120) {
    const left = cameraX - padding;
    const right = cameraX + canvas.width + padding;
    return (x + width) > left && x < right;
}

// --- UI Elements ---
const playerGoldEl = document.getElementById('player-gold');
const playerAgeEl = document.getElementById('player-age');
const playerExpEl = document.getElementById('player-exp');
const aiGoldEl = document.getElementById('ai-gold');
const aiAgeEl = document.getElementById('ai-age');
const aiExpEl = document.getElementById('ai-exp');
const mainControlsContainer = document.getElementById('main-controls');
const mainUnitMenuBtn = document.getElementById('main-unit-menu-btn');
const mainDefenseMenuBtn = document.getElementById('main-defense-menu-btn');
const mainStructuresMenuBtn = document.getElementById('main-structures-menu-btn'); 
const detailedUnitControls = document.getElementById('detailed-unit-controls');
const detailedUnitButtonsContainer = document.getElementById('detailed-unit-buttons-container');
const detailedDefenseControls = document.getElementById('detailed-defense-controls');
const detailedDefenseButtonsContainer = document.getElementById('detailed-defense-buttons-container');
const detailedStructuresControls = document.getElementById('detailed-structures-controls'); 
const detailedStructuresButtonsContainer = document.getElementById('detailed-structures-buttons-container'); 
const backToMainMenuBtn = document.getElementById('back-to-main-menu-btn');
const backToMainMenuFromDefenseBtn = document.getElementById('back-to-main-menu-from-defense-btn');
const backToMainMenuFromStructuresBtn = document.getElementById('back-to-main-menu-from-structures-btn'); 
const cancelPlacementBtn = document.getElementById('cancel-placement-btn'); 
const ageUpBtn = document.getElementById('age-up-btn');
const rockslideBtn = document.getElementById('rockslide-btn');
const deleteDefenseBtn = document.getElementById('delete-defense-btn');
const panLeftBtn = document.getElementById('pan-left-btn');
const panRightBtn = document.getElementById('pan-right-btn');
const messageBox = document.getElementById('message-box');
const endMessage = document.getElementById('end-message');
const retryBtn = document.getElementById('retry-btn');
const pauseBtn = document.getElementById('pause-btn');
const speed1xBtn = document.getElementById('speed-1x-btn');
const speed2xBtn = document.getElementById('speed-2x-btn');
const speed3xBtn = document.getElementById('speed-3x-btn');
const musicBtn = document.getElementById('music-btn');
const troopInfoBtn = document.getElementById('troop-info-btn');
const almanacDiv = document.getElementById('almanac');
const almanacSidebar = document.getElementById('almanac-sidebar');
const almanacUnitList = document.getElementById('almanac-unit-list');
const almanacPlayerBtn = document.getElementById('almanac-player-btn');
const almanacEnemyBtn = document.getElementById('almanac-enemy-btn');
const almanacInfo = document.getElementById('almanac-info');
const almanacCloseBtn = document.getElementById('almanac-close-btn');
const almanacArrow = document.getElementById('almanac-arrow');
const specialUnitChoiceOverlay = document.getElementById('special-unit-choice-overlay');
const choiceCard1 = document.getElementById('choice-card-1');
const choiceInfo1 = document.getElementById('choice-info-1');
const choiceCard2 = document.getElementById('choice-card-2');
const choiceInfo2 = document.getElementById('choice-info-2');
const confirmSpecialUnitBtn = document.getElementById('confirm-special-unit');
const craftingOverlay = document.getElementById('crafting-overlay'); 
const craftingCardsContainer = document.getElementById('crafting-cards'); 
const craftingBackBtn = document.getElementById('crafting-back-btn'); 


// --- Game State ---
const player = {hp: INITIAL_HP, maxHp: INITIAL_HP, gold: INITIAL_GOLD, age: INITIAL_AGE, exp: INITIAL_EXP, units: [], structures: [], craftingLevels: {}, baseX: 0, lastSpawnTime: 0, hasGun: false, hasPoisonBlower: false, lastBaseAttackTime: 0, lastPoisonBlowerAttackTime: 0, lastRockslideTime: 0, rockslideEndTime: 0, lastRockWaveTime: 0, specialUnitUnlocked: false, chosenSpecialUnit: null};
const ai = {
    hp: INITIAL_HP,
    maxHp: INITIAL_HP,
    gold: INITIAL_GOLD,
    age: INITIAL_AGE,
    exp: INITIAL_EXP,
    units: [],
    structures: [],
    craftingLevels: {},
    baseX: 0,
    lastSpawnTime: 0,
    hasGun: false,
    hasPoisonBlower: false,
    lastBaseAttackTime: 0,
    lastPoisonBlowerAttackTime: 0,
    difficulty: 1.0,
    mode: 'balanced',
    lastModeChange: 0,
    lastRockslideTime: 0,
    rockslideEndTime: 0,
    lastRockWaveTime: 0,
    rockslideTargetX: 0,
    specialUnitUnlocked: false,
    chosenSpecialUnit: null,
    incomeMultiplier: 1,
    memory: createInitialAiMemory(),
    strategy: {
        playerUnitProduction: {
            'Clubman': 0,
            'Slinger': 0,
            'Log Rammer': 0,
            'Axeman': 0,
            'Blowgunner': 0,
            'Falcon Caster': 0,
            'Earth Guardian': 0,
            'Stone Guard': 0
        }
    }
};

const unitConfigCache = {};

function createInitialAiMemory() {
    return {
        unitPerformance: {},
        upgradesPurchased: {},
        engagements: [],
        lastUpgradeTime: 0
    };
}

function resetAiMemory() {
    ai.memory = createInitialAiMemory();
}

function getUnitConfigByName(unitName) {
    if (!unitName) return null;
    if (!unitConfigCache[unitName]) {
        for (const ageKey in ageSettings) {
            const ageCfg = ageSettings[ageKey];
            const options = [...ageCfg.units, ...(ageCfg.specialUnits || [])];
            const found = options.find(u => u.name === unitName);
            if (found) {
                unitConfigCache[unitName] = found;
                break;
            }
        }
    }
    return unitConfigCache[unitName] || null;
}

function getAiUnitMemory(unitName) {
    const key = unitName || '_unknown';
    if (!ai.memory.unitPerformance[key]) {
        ai.memory.unitPerformance[key] = {
            totalDamageDealt: 0,
            totalDamageTaken: 0,
            totalKills: 0,
            totalDeaths: 0,
            deployCount: 0,
            lastDeployment: 0,
            recentScore: 0,
            recentDamageDealt: 0,
            recentDamageTaken: 0,
            recentKills: 0,
            recentDeaths: 0
        };
    }
    return ai.memory.unitPerformance[key];
}

function recordAiDeployment(unitName, timestamp) {
    const perf = getAiUnitMemory(unitName);
    perf.deployCount += 1;
    perf.lastDeployment = timestamp;
    perf.recentScore *= 0.92;
}

function resolveAiSourceUnit(attacker) {
    if (!attacker) return null;
    if (attacker.caster) return attacker.caster;
    return attacker;
}

function recordAiDamageDealt(attacker, amount) {
    if (!attacker || !Number.isFinite(amount) || amount <= 0) return;
    const src = resolveAiSourceUnit(attacker);
    if (!src || src.owner !== 'ai') return;
    const perf = getAiUnitMemory(src.name || src.constructor?.name);
    perf.totalDamageDealt += amount;
    perf.recentDamageDealt += amount;
    perf.recentScore = perf.recentScore * 0.9 + amount;
}

function recordAiDamageTaken(unit, amount) {
    if (!unit || unit.owner !== 'ai' || !Number.isFinite(amount) || amount <= 0) return;
    const perf = getAiUnitMemory(unit.name || unit.constructor?.name);
    perf.totalDamageTaken += amount;
    perf.recentDamageTaken += amount;
    perf.recentScore = perf.recentScore * 0.92 - amount * 0.7;
}

function recordAiKill(attacker, victim) {
    const src = resolveAiSourceUnit(attacker);
    if (!src || src.owner !== 'ai') return;
    const perf = getAiUnitMemory(src.name || src.constructor?.name);
    perf.totalKills += 1;
    perf.recentKills += 1;
    perf.recentScore += 60;
}

function recordAiDeath(unit) {
    if (!unit || unit.owner !== 'ai') return;
    const perf = getAiUnitMemory(unit.name || unit.constructor?.name);
    perf.totalDeaths += 1;
    perf.recentDeaths += 1;
    perf.recentScore -= 50;
}

function recordAiUpgrade(unitName, category, itemName) {
    if (!unitName || !category || !itemName) return;
    ai.memory.upgradesPurchased[unitName] = ai.memory.upgradesPurchased[unitName] || {};
    ai.memory.upgradesPurchased[unitName][category] = itemName;
    ai.memory.lastUpgradeTime = Date.now();
}

function recordAiEngagement(delta) {
    if (!Number.isFinite(delta) || delta === 0) return;
    ai.memory.engagements.push({ timestamp: Date.now(), delta });
    if (ai.memory.engagements.length > 80) {
        ai.memory.engagements.shift();
    }
}

function getRecentEngagementScore(windowMs = 60000) {
    const cutoff = Date.now() - windowMs;
    ai.memory.engagements = ai.memory.engagements.filter(entry => entry.timestamp >= cutoff);
    return ai.memory.engagements.reduce((sum, entry) => sum + entry.delta, 0);
}

function decayAiMemory() {
    const decay = 0.95;
    Object.values(ai.memory.unitPerformance).forEach(perf => {
        perf.recentDamageDealt *= decay;
        perf.recentDamageTaken *= decay;
        perf.recentKills *= decay;
        perf.recentDeaths *= decay;
        perf.recentScore *= decay;
    });
}

function decayPlayerUnitProduction() {
    for (const unitName in ai.strategy.playerUnitProduction) {
        ai.strategy.playerUnitProduction[unitName] *= 0.995;
    }
}

function calculatePlayerUnitTypeCounts() {
    const typeCounts = {};
    for (const unitName in ai.strategy.playerUnitProduction) {
        const count = ai.strategy.playerUnitProduction[unitName];
        if (count <= 0) continue;
        const cfg = getUnitConfigByName(unitName);
        const typeKey = cfg?.type || 'unknown';
        typeCounts[typeKey] = (typeCounts[typeKey] || 0) + count;
    }
    return typeCounts;
}

function recordUnitDeath(unit) {
    if (!unit || unit.isCorpse || unit.deathRecorded) return;
    if (unit.owner === 'ai') {
        recordAiDeath(unit);
        const cost = unit.baseConfig?.cost || getUnitConfigByName(unit.name || unit.constructor?.name)?.cost || 40;
        recordAiEngagement(-cost);
    } else if (unit.owner === 'player') {
        const cost = unit.baseConfig?.cost || getUnitConfigByName(unit.name || unit.constructor?.name)?.cost || 40;
        recordAiEngagement(cost);
    }
    const killer = resolveAiSourceUnit(unit.lastAttacker);
    if (killer && killer.owner === 'ai') {
        recordAiKill(killer, unit);
    }
    if (typeof unit.deathRecorded !== 'undefined') {
        unit.deathRecorded = true;
    }
}

function trackDamageEvents(attacker, target, amount) {
    if (!Number.isFinite(amount) || amount <= 0) return;
    const source = resolveAiSourceUnit(attacker);
    if (source && source.owner === 'ai') {
        recordAiDamageDealt(source, amount);
    }
    if (target && target.owner === 'ai') {
        recordAiDamageTaken(target, amount);
    }
}
const ageSettings = {
    1: {name: "Pre-Stone Age", units: [
        {name:'Clubman',cost:15,hp:50,damage:10,range:10,speed:1,expValue:40,goldValue:20, type: 'melee', counters: 'ranged'},
        {name:'Slinger',cost:25,hp:30,damage:15,range:100,speed:0.8,expValue:60,goldValue:32, type: 'ranged', counters: 'melee'},
        {name:'Log Rammer',cost:80,hp:200,damage:13,range:30,speed:0.5,expValue:150,goldValue:110, type: 'melee', counters: 'ranged', knockbackForce: 30, stunDuration: 300}
    ], ageUpCost:650},
    2: {name: "Stone Age", units: [
        {name:'Axeman',cost:60,hp:120,damage:25,range:10,speed:1.1,expValue:80,goldValue:60, type: 'melee', counters: 'ranged'},
        {name:'Blowgunner',cost:75,hp:90,damage:30,range:120,speed:1,expValue:80,goldValue:55, type: 'ranged', counters: 'melee'},
        {name:'Stone Guard', cost:250, hp: 175, shieldHp: 300, damage: 20, maceDamage: 40, range: 10, speed: 0.3, expValue: 250, goldValue: 180, type: 'melee', damageReduction: { ranged: 0.5 }}
    ], 
    specialUnits: [
        {name:'Falcon Caster',cost:150,hp:130,damage:15,range:10,speed:0.77,expValue:100,goldValue:80, type: 'caster'},
        {name:'Earth Guardian', cost:200, hp: 400, damage: 40, range: 10, speed: 0.4, expValue: 200, goldValue: 150, type: 'melee'},
    ],
    ageUpCost:4000}
};

const defenseSettings = {
    'gun': {
        name: 'Sling Defender',
        cost: 100,
        range: 200,
        attackCooldown: 1500,
        damage: { 'Slinger': 7.5, 'Clubman': 10, 'default': 5 }
    },
    'poison-blower': {
        name: 'Poison Blower',
        cost: 250,
        range: 300, // 250 * 1.2
        attackCooldown: 2000,
        damage: 10, // Initial damage on hit
        poisonDamage: 12, // Damage per tick
        poisonDuration: 5000 // 5 seconds
    }
};

const structureSettings = {
    'ancient-crafting-table': {
        name: 'Ancient Crafting Table',
        cost: 80,
        hp: 300,
        width: 60,
        height: 60
    }
};

const craftingSettings = {
    'Axeman': {
        'head': [
            { name: 'Fur Hat', goldCost: 0, expCost: 0, effect: {}, description: "Basic head protection.", purchased: true },
            { name: 'Leather Cap', goldCost: 150, expCost: 200, effect: { hp: 20 }, description: "+20 HP", purchased: false },
            { name: 'Bone Helmet', goldCost: 300, expCost: 400, effect: { hp: 40, damageReduction: 0.05 }, description: "+40 HP, 5% Dmg Reduction", purchased: false }
        ],
        'chest': [
            { name: 'Leather Loincloth', goldCost: 0, expCost: 0, effect: {}, description: "Basic chest protection.", purchased: true },
            { name: 'Primal Leather Tunic', goldCost: 250, expCost: 400, effect: { hp: 75 }, description: "+75 HP", purchased: false },
            { name: 'Bone Plated Armor', goldCost: 600, expCost: 800, effect: { hp: 150, damageReduction: 0.1 }, description: "+150 HP, 10% Dmg Reduction", purchased: false }
        ],
        'weapon': [
            { name: 'Simple Stone Axe', goldCost: 0, expCost: 0, effect: {}, description: "A basic stone axe.", purchased: true },
            { name: 'Obsidian Axe', goldCost: 350, expCost: 500, effect: { damage: 15 }, description: "+15 Damage", purchased: false },
            { name: 'Jagged Bone Axe', goldCost: 700, expCost: 1000, effect: { damage: 30, attackSpeed: 0.15 }, description: "+30 Damage, 15% Atk Speed", purchased: false }
        ]
    },
    'Blowgunner': {
        'head': [
            { name: 'Feather Headband', goldCost: 0, expCost: 0, effect: {}, description: "Basic head protection.", purchased: true },
            { name: 'Leather Hood', goldCost: 150, expCost: 200, effect: { hp: 20 }, description: "+20 HP", purchased: false },
            { name: 'Bone Mask', goldCost: 300, expCost: 400, effect: { hp: 40, damageReduction: 0.05 }, description: "+40 HP, 5% Dmg Reduction", purchased: false }
        ],
        'chest': [
            { name: 'Leather Dress', goldCost: 0, expCost: 0, effect: {}, description: "Basic chest protection.", purchased: true },
            { name: 'Leather Jerkin', goldCost: 250, expCost: 400, effect: { hp: 75 }, description: "+75 HP", purchased: false },
            { name: 'Bone Plated Vest', goldCost: 600, expCost: 800, effect: { hp: 150, damageReduction: 0.1 }, description: "+150 HP, 10% Dmg Reduction", purchased: false }
        ],
        'weapon': [
            { name: 'Reed Blow Pipe', goldCost: 0, expCost: 0, effect: {}, description: "A basic blowpipe.", purchased: true },
            { name: 'Hardened Blowpipe', goldCost: 350, expCost: 500, effect: { damage: 15 }, description: "+15 Damage", purchased: false },
            { name: 'Poisoned Darts', goldCost: 700, expCost: 1000, effect: { damage: 30, attackSpeed: 0.15 }, description: "+30 Damage, 15% Atk Speed", purchased: false }
        ]
    }
};


// --- Game Object Arrays ---
let currentMenuState = 'main';
let rocks = [];
let rockFragments = [];
let falcons = [];
let textPopUps = [];
let particles = [];
let bloodParticles = [];
let smokeParticles = [];
let mountainPeaks = [];
let stars = []; 
let projectiles=[];
let placementStations = []; 
let activeCraftingTable = null; 
let craftingPreviews = {}; 
let almanacStoneGuardState = 'shielded';
let almanacCasterState = 'caster';
let almanacSelectedUnitName = '';
let specialUnitSelection = null;
let choicePreviewUnit1, choicePreviewUnit2;
let craftingUIState = 'unit-selection';
let selectedUnitForCrafting = null;
let selectedCategoryForCrafting = null;
let lastPlayerPressureTime = Date.now();
let lastAiPressureTime = Date.now();
let lastAiEmergencyDefenseTime = 0;
let lastAiStalemateActionTime = 0;
let playerIsPressuringAi = false;
let aiIsPressuringPlayer = false;
let lastAiOffensiveInvestmentTime = 0;
let aiShouldHoldSpawns = false;

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 5 + 2;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.life = 100;
        this.alpha = 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1; // Gravity
        this.vx *= 0.98; // Friction
        this.vy *= 0.98;
        this.life--;
        this.alpha = this.life / 100;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class BloodParticle {
    constructor(x, y, color = '#8A0707') {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 2 + 1; // Smaller particles
        this.life = 40; // Quicker fade
        this.alpha = 1;
        this.vx = (Math.random() - 0.5) * 4; // Wider splatter
        this.vy = (Math.random() - 0.5) * 4;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.05; // A little gravity
        this.life--;
        this.alpha = this.life / 40;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Star {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 2 + 1;
        this.opacity = Math.random() * 0.5 + 0.5; // Random opacity between 0.5 and 1.0
        this.twinkleSpeed = Math.random() * 0.02 + 0.01; // Random twinkle speed
        this.twinkleOffset = Math.random() * Math.PI * 2; // Random twinkle offset
    }

    update() {
        // Stars twinkle by varying their opacity
        const time = Date.now();
        this.opacity += Math.sin(time * this.twinkleSpeed + this.twinkleOffset) * 0.1;
        this.opacity = Math.max(0.3, Math.min(1.0, this.opacity)); // Clamp between 0.3 and 1.0
    }

    draw(ctx) {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}
class SmokeParticle {
    constructor(x, y) {
        this.x = x + (Math.random() - 0.5) * 50;
        this.y = y + (Math.random() - 0.5) * 20;
        this.size = Math.random() * 30 + 20;
        this.initialSize = this.size;
        this.alpha = 0;
        this.vx = (Math.random() - 0.5) * 0.8;
        this.vy = Math.random() * 0.5 + 0.5; // Start with a gentle downward push
        this.life = 200 + Math.random() * 100;
        this.maxLife = this.life;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.01;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.01; // Accelerate downwards slightly
        this.rotation += this.rotationSpeed;
        this.size += 0.2; // Grow over time
        this.life--;

        const fadeInDuration = this.maxLife * 0.2;
        const fadeOutDuration = this.maxLife * 0.8;
        if (this.life > this.maxLife - fadeInDuration) {
            this.alpha = 1 - ((this.maxLife - this.life) / fadeInDuration);
        } else {
            this.alpha = (this.life / fadeOutDuration);
        }
        this.alpha = Math.max(0, this.alpha * 0.6); 
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.alpha;

        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
        gradient.addColorStop(0, 'rgba(200, 200, 200, 0.6)');
        gradient.addColorStop(0.5, 'rgba(180, 180, 180, 0.4)');
        gradient.addColorStop(1, 'rgba(150, 150, 150, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function createExplosion(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        if (particles.length > 300) { particles.shift(); }
        particles.push(new Particle(x, y, color));
    }
}

function createBloodSplatter(x, y, color) {
    for (let i = 0; i < 10; i++) { 
        if (bloodParticles.length > 200) { bloodParticles.shift(); }
        bloodParticles.push(new BloodParticle(x, y, color));
    }
}

class TextPopUp {
    constructor(x, y, text, color) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.startTime = Date.now();
        this.duration = 1500; 
        this.alpha = 1.0;
    }

    update() {
        const elapsed = Date.now() - this.startTime;
        if (elapsed >= this.duration) {
            this.alpha = 0;
            return true; 
        }
        this.y -= 0.5; 
        this.alpha = 1.0 - (elapsed / this.duration);
        return false;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.font = 'bold 16px Arial';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.strokeText(this.text, this.x, this.y);
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

class Rock {
    constructor(startX, startY, endX, endY, owner) {
        this.x = startX;
        this.y = startY;
        this.endX = endX;
        this.endY = endY;
        this.owner = owner;
        this.size = 5 + Math.random() * 10;
        this.speed = 0.3 + Math.random() * 0.2;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
        const dx = endX - startX;
        const dy = endY - startY;
        const dist = Math.hypot(dx, dy);
        this.velocityX = (dx / dist) * this.speed;
        this.velocityY = (dy / dist) * this.speed;
    }

    update(dt) {
        this.x += this.velocityX * dt;
        this.y += this.velocityY * dt;
        this.rotation += this.rotationSpeed * dt;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = '#696969';
        ctx.strokeStyle = '#5C4033';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(-this.size / 2, -this.size / 2, this.size, this.size);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
}

class RockFragment {
    constructor(x, y, vx, vy, owner) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.owner = owner;
        this.size = 3 + Math.random() * 5;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2;
        this.life = 100; // Frames
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1; // Gravity
        this.rotation += this.rotationSpeed;
        this.life--;
        return this.life <= 0;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = '#696969';
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        ctx.restore();
    }
}

class Falcon {
    constructor(x, y, owner, caster, isRespawn = false) {
        this.x = x;
        this.y = y;
        this.owner = owner;
        this.caster = caster;
        this.hp = 75; 
        this.maxHp = 75; 
        this.damage = 30; 
        this.speed = 7.5;
        this.width = 30 * 0.7;
        this.height = 20 * 0.7;
        this.target = null;
        this.state = isRespawn ? 'entering' : 'seeking';
        this.attackPhase = 'none';
        this.attackAnimationTime = 0;
        this.lastAttackTime = 0;
        this.attackCooldown = 1500;
        this.flapCycle = Math.random();
        this.flapSpeed = 0.05;
        this.diveStartY = 0;
        this.diveStartX = 0;
        this.restEndTime = 0;
        this.isDying = false;
        this.isDead = false;
        this.deathAnimationStartTime = 0;
        this.deathAnimationDuration = 1000;
        this.deathRotation = 0;
        this.lastAttacker = null;
        this.killedBy = null;
        this.deathRecorded = false;
    }

    findTarget(enemies) {
        let closest = null;
        let closestDist = Infinity;
        for (const enemy of enemies) {
            if (enemy.isDying || enemy.isDead || enemy.isCorpse) continue; 
            const dist = Math.hypot(this.x - enemy.x, this.y - enemy.y);
            if (dist < closestDist) {
                closestDist = dist;
                closest = enemy;
            }
        }
        this.target = closest;
    }

    update(dt, enemies) {
        const now = Date.now();
        
        if (this.hp <= 0 && !this.isDying) {
            this.isDying = true;
            this.deathAnimationStartTime = now;
            this.killedBy = this.lastAttacker;
            this.deathRotation = (Math.random() - 0.5) * Math.PI * 4;
        }

        if (this.isDying) {
            const elapsed = now - this.deathAnimationStartTime;
            if (elapsed >= this.deathAnimationDuration) {
                this.isDead = true;
            }
            return this.isDead; 
        }

        this.flapCycle = (this.flapCycle + this.flapSpeed * gameSpeed) % 1;

        if (this.caster.isDead || this.caster.hp <= 0) {
            this.hp = 0;
            return false; 
        }

        if (this.caster.isUnderAttack && this.caster.lastAttacker && this.caster.lastAttacker.hp > 0) {
            this.target = this.caster.lastAttacker;
            this.state = 'attacking';
        }

        switch(this.state) {
            case 'entering':
                const restingY = this.caster.y - 40;
                if (this.y < restingY) {
                    this.y += this.speed * 0.5;
                } else {
                    this.y = restingY;
                    this.state = 'seeking';
                }
                break;
            case 'resting':
                if (now > this.restEndTime) {
                    this.state = 'seeking';
                } else {
                    this.x = this.caster.x + (this.owner === 'player' ? 10 : -10);
                    this.y = this.caster.y - 40;
                }
                break;

            case 'returning':
                const targetX = this.caster.x;
                const targetY = this.caster.y - 40;
                const dx = targetX - this.x;
                const dy = targetY - this.y;
                const dist = Math.hypot(dx, dy);
                if (dist < this.speed) {
                    this.state = 'resting';
                    this.restEndTime = now + 5000;
                } else {
                    this.x += (dx / dist) * this.speed;
                    this.y += (dy / dist) * this.speed;
                }
                break;

            case 'attacking':
                if (!this.target || this.target.hp <= 0 || this.target.isDead) {
                    const wasKilledByMe = this.target && this.target.killedBy === this;
                    
                    if (wasKilledByMe) {
                        this.state = 'returning'; 
                    } else {
                        this.findTarget(enemies); 
                        if (this.target) {
                            this.state = 'seeking';
                        } else {
                            this.state = 'returning'; 
                        }
                    }
                    this.target = null; 
                    return false;
                }

                const distToTarget = Math.hypot(this.x - this.target.x, this.y - this.target.y);
                const maxAttackRange = 350; 
                if (distToTarget > maxAttackRange) {
                    this.state = 'returning'; 
                    this.attackPhase = 'none';
                    return false;
                }

                this.attackAnimationTime += dt;
                const targetCenterX = this.target.x + this.target.width / 2;
                const targetCenterY = this.target.y + this.target.height / 2;

                if (this.attackPhase === 'diving') {
                    const diveDuration = 600;
                    const progress = Math.min(this.attackAnimationTime / diveDuration, 1);
                    this.x = this.diveStartX + (targetCenterX - this.diveStartX) * progress;
                    this.y = this.diveStartY + (targetCenterY - this.diveStartY) * progress;
                    if (progress >= 1) {
                        this.attackPhase = 'pecking';
                        this.attackAnimationTime = 0;
                        if(this.target) {
                            this.target.lastAttacker = this;
                            const damageApplied = Math.min(this.damage, this.target.hp);
                            this.target.hp -= damageApplied;
                            trackDamageEvents(this, this.target, damageApplied);
                            if (damageApplied > 0 && this.target.hp <= 0) {
                                this.caster.falconGotKill = true;
                            }
                        }
                    }
                } else if (this.attackPhase === 'pecking') {
                    if (this.attackAnimationTime > 300) {
                        this.attackPhase = 'returning';
                        this.attackAnimationTime = 0;
                    }
                } else if (this.attackPhase === 'returning') {
                    const returnDuration = 600;
                    const progress = Math.min(this.attackAnimationTime / returnDuration, 1);
                    this.x = targetCenterX + (this.diveStartX - targetCenterX) * progress;
                    this.y = targetCenterY + (this.diveStartY - targetCenterY) * progress;
                    if (progress >= 1) {
                        this.attackPhase = 'diving';
                        this.attackAnimationTime = 0;
                        this.diveStartY = this.y;
                        this.diveStartX = this.x;
                    }
                }
                break;

            case 'seeking':
                if (!this.target || this.target.hp <=0 || this.target.isDead) {
                    this.findTarget(enemies);
                }
                
                if (this.target) {
                    const seekDistToTarget = Math.hypot(this.x - (this.target.x + this.target.width / 2), this.y - (this.target.y + this.target.height / 2));
                    if (seekDistToTarget < 200) {
                        this.state = 'attacking';
                        this.attackPhase = 'diving';
                        this.attackAnimationTime = 0;
                        this.diveStartY = this.y;
                        this.diveStartX = this.x;
                    } else {
                        const dir = this.owner === 'player' ? 1 : -1;
                        this.x += this.speed * gameSpeed * dir * 0.5;
                    }
                } else {
                    const dir = this.owner === 'player' ? 1 : -1;
                    this.x += this.speed * gameSpeed * dir * 0.5;
                }
                if (this.x > worldWidth + 50) {
                    this.x = -50;
                } else if (this.x < -50) {
                    this.x = worldWidth + 50;
                }
                break;
        }
        return this.isDead;
    }

    draw(previewMode = false, previewCtx = ctx) {
        const targetCtx = previewMode ? previewCtx : ctx;
        targetCtx.save();
        
        if (this.isDying) {
            const elapsed = Date.now() - this.deathAnimationStartTime;
            const progress = Math.min(elapsed / this.deathAnimationDuration, 1);
            this.y += 2 * progress; // Move down
            targetCtx.translate(this.x, this.y);
            targetCtx.rotate(this.deathRotation * progress);
        } else {
            targetCtx.translate(this.x, this.y);
        }
        
        if (!this.isDying && !previewMode) {
            if (this.hp < this.maxHp) {
                targetCtx.fillStyle = 'black';
                targetCtx.fillRect(-this.width / 2, -this.height - 5, this.width, 4);
                targetCtx.fillStyle = 'green';
                targetCtx.fillRect(-this.width / 2, -this.height - 5, this.width * (this.hp / this.maxHp), 4);
            }
        }

        if (this.owner === 'ai' && !previewMode) {
            targetCtx.scale(-1, 1);
        }
        
        const scale = 0.7;
        const wingY = Math.sin(this.flapCycle * Math.PI * 2) * 10 * scale;
        const bodyColor = '#6F4E37'; 
        const wingColor = '#8B4513';
        const beakColor = '#FFD700';
        const headColor = '#A0522D';

        // Draw left wing
        targetCtx.fillStyle = wingColor;
        targetCtx.beginPath();
        targetCtx.moveTo(-2 * scale, 0);
        targetCtx.quadraticCurveTo(-15 * scale, wingY - 5 * scale, -25 * scale, wingY + 5 * scale);
        targetCtx.quadraticCurveTo(-10 * scale, wingY + 10 * scale, -2 * scale, 0);
        targetCtx.fill();

        // Draw body
        targetCtx.fillStyle = bodyColor;
        targetCtx.beginPath();
        targetCtx.ellipse(0, 0, 15 * scale, 8 * scale, -0.1, 0, Math.PI * 2);
        targetCtx.fill();

        // Draw head
        targetCtx.fillStyle = headColor;
        targetCtx.beginPath();
        targetCtx.arc(12 * scale, -3 * scale, 6 * scale, 0, Math.PI * 2);
        targetCtx.fill();

        // Draw beak
        targetCtx.fillStyle = beakColor;
        targetCtx.beginPath();
        targetCtx.moveTo(18 * scale, -4 * scale);
        targetCtx.lineTo(25 * scale, -2 * scale);
        targetCtx.lineTo(18 * scale, 0 * scale);
        targetCtx.closePath();
        targetCtx.fill();

        // Draw right wing (partially visible behind body)
        targetCtx.fillStyle = wingColor;
        targetCtx.beginPath();
        targetCtx.moveTo(2 * scale, 0);
        targetCtx.quadraticCurveTo(15 * scale, wingY - 5 * scale, 25 * scale, wingY + 5 * scale);
        targetCtx.quadraticCurveTo(10 * scale, wingY + 10 * scale, 2 * scale, 0);
        targetCtx.fill();

        targetCtx.restore();
    }
}

class Structure {
    constructor(cfg, owner, x, y) {
        Object.assign(this, cfg);
        this.owner = owner;
        this.x = x;
        this.y = y;
        this.maxHp = cfg.hp;
        this.isCraftingUIOpen = false;
        this.craftButton = {
            width: 50,
            height: 20
        };
        this.craftButton.x = this.x + (this.width - this.craftButton.width) / 2;
        this.craftButton.y = this.y - this.craftButton.height - 5;
    }

    draw() {
        if (this.hp < this.maxHp) {
            ctx.fillStyle = 'black';
            ctx.fillRect(this.x, this.y - 10, this.width, 5);
            ctx.fillStyle = 'green';
            ctx.fillRect(this.x, this.y - 10, this.width * (this.hp / this.maxHp), 5);
        }

        if (this.name === 'Ancient Crafting Table') {
            const legWidth = 10;
            const legHeight = 25;
            const tableTopHeight = 15;
            const tableTopY = this.y + this.height - legHeight - tableTopHeight;
            const legY = this.y + this.height - legHeight;

            ctx.fillStyle = '#8B4513'; 
            ctx.fillRect(this.x + 5, legY, legWidth, legHeight);
            ctx.fillRect(this.x + this.width - legWidth - 5, legY, legWidth, legHeight);

            ctx.fillStyle = '#A0522D'; 
            ctx.fillRect(this.x, tableTopY, this.width, tableTopHeight);
            ctx.strokeStyle = '#5C4033'; 
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, tableTopY, this.width, tableTopHeight);

            ctx.fillStyle = '#8B4513';
            ctx.fillRect(this.x, legY, legWidth, legHeight);
            ctx.fillRect(this.x + this.width - legWidth, legY, legWidth, legHeight);

            ctx.fillStyle = '#F5DEB3'; 
            ctx.fillRect(this.x + 5, tableTopY + 3, 20, 10);
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x + 5, tableTopY + 3, 20, 10);

            ctx.fillStyle = '#C0C0C0'; 
            ctx.fillRect(this.x + 35, tableTopY - 5, 15, 8);
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(this.x + 40, tableTopY, 5, 10);
        }
        
        if (!this.isCraftingUIOpen) {
            // Draw button background (wooden color)
            ctx.fillStyle = '#d2b48c';
            ctx.fillRect(this.craftButton.x, this.craftButton.y, this.craftButton.width, this.craftButton.height);
            
            // Draw button border
            ctx.strokeStyle = '#8b4513';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.craftButton.x, this.craftButton.y, this.craftButton.width, this.craftButton.height);
            
            // Draw button text
            ctx.fillStyle = '#5d4037';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Craft', this.craftButton.x + this.craftButton.width / 2, this.craftButton.y + this.craftButton.height / 2);
        }
    }
    
    update() {
        // Structures are currently passive
    }
}


class Unit{
    constructor(cfg, owner, isPreview = false) {
        this.isPreview = isPreview; // Flag to indicate if this is a preview unit
        this.baseConfig = JSON.parse(JSON.stringify(cfg)); // Deep copy of base stats
        Object.assign(this, this.baseConfig);
        this.owner=owner;
        this.maxHp=this.baseConfig.hp;
        this.width=30;
        this.height=40;
        this.walkCycle = 0;
        this.killedBy = null;
        this.corpseStartTime = 0;
        this.isPoisoned = false;
        this.poisonEndTime = 0;
        this.poisonDamagePerTick = 0;
        this.lastPoisonTickTime = 0;
        this.poisonStacks = 0;
        this.damageReduction = 0;
        this.equipped = {
            head: this.name === 'Blowgunner' ? 'Feather Headband' : 'Fur Hat',
            chest: this.name === 'Blowgunner' ? 'Leather Dress' : 'Leather Loincloth',
            weapon: this.name === 'Blowgunner' ? 'Reed Blow Pipe' : 'Simple Stone Axe'
        };

        if (this.name === 'Log Rammer') {
            this.width = 70;
        } else if (this.name === 'Earth Guardian') {
            this.width = 60;
            this.height = 80;
            this.walkCycle = Math.random() * Math.PI * 2;
            this.substate = 'idle'; 
            this.corpseTarget = null;
            this.actionStartTime = 0;
            this.heldCorpse = null;
        } else if (this.name === 'Stone Guard') {
            this.width = 40; 
            this.height = 50; 
            this.walkCycle = Math.random() * Math.PI * 2;
            this.shieldHp = cfg.shieldHp; 
            this.maxShieldHp = cfg.shieldHp; 
            this.shieldBroken = false; 
            this.attackType = 'shieldBash'; 
        }
        
        if (owner === 'player') {
            this.x = player.baseX + baseWidth;
        } else {
            this.x = ai.baseX - this.width;
        }

        this.y = canvas.height - groundHeight - this.height;
        
        if (this.name === 'Falcon Caster') {
            // Only create falcon if this is not a preview unit
            if (!this.isPreview) {
                this.myFalcon = new Falcon(this.x, this.y - 50, this.owner, this);
                falcons.push(this.myFalcon);
            }
            this.falconRespawnTimer = 0;
            this.isRespawningFalcon = false;
            this.falconGotKill = false;
            this.actionStartTime = 0; // Ensure actionStartTime is initialized
            this.attackType = 'punch';
        }

        this.isAttacking=false;
        this.attackCooldown=1000;
        this.lastAttackTime=0;
        this.isAnimatingAttack = false;
        this.projectileSpawnedThisAttack = false;
        this.target = null;
        this.stunned = false;
        this.stunEndTime = 0;
        this.knockbackForce = cfg.knockbackForce || 0;
        this.stunDuration = cfg.stunDuration || 0;
        this.ramAnimationStartTime = 0;
        this.ramAnimationTotalDuration = 600;
        this.ramEffectApplied = false;
        this.ramPermanentMoveApplied = false;
        this.ramPushDistance = 20;
        this.currentRamPushDistance = this.ramPushDistance;
        this.knockbackTargetX = 0;
        this.isKnockingBack = false;
        this.baseCollisionBuffer = this.name === 'Log Rammer' ? 8 : 0;
        this.isDying = false;
        this.isDead = false;
        this.isCorpse = false;
        this.deathAnimationDuration = 500;
        this.deathAnimationStartTime = 0;
        this.deathRotation = 0;
        this.isUnderAttack = false;
        this.lastAttacker = null;
        this.deathRecorded = false;

        this.applyCraftingUpgrades();
    }

    applyCraftingUpgrades() {
        const ent = this.owner === 'player' ? player : ai;
        let hpBonus = 0;
        let damageBonus = 0;
        let attackSpeedBonus = 0;
        let damageReductionBonus = 0;
        
        // Reset to default appearance if no crafting levels
        if (!ent.craftingLevels || !ent.craftingLevels[this.name]) {
            this.equipped = {
                head: this.name === 'Blowgunner' ? 'Feather Headband' : 'Fur Hat',
                chest: this.name === 'Blowgunner' ? 'Leather Dress' : 'Leather Loincloth',
                weapon: this.name === 'Blowgunner' ? 'Reed Blow Pipe' : 'Simple Stone Axe'
            };
        }

        if (craftingSettings[this.name]) {
            for (const slot in this.equipped) {
                const equippedItemName = ent.craftingLevels[this.name]?.[slot];
                if (equippedItemName) {
                    this.equipped[slot] = equippedItemName;
                    const item = craftingSettings[this.name][slot].find(i => i.name === equippedItemName);
                    if (item && item.effect) {
                        const effect = item.effect;
                        if (effect.hp) hpBonus += effect.hp;
                        if (effect.damage) damageBonus += effect.damage;
                        if (effect.attackSpeed) attackSpeedBonus += effect.attackSpeed;
                        if (effect.damageReduction) damageReductionBonus += effect.damageReduction;
                        
                        // Update equipped items for visual appearance
                        if (slot === 'head' || slot === 'chest' || slot === 'weapon') {
                            this.equipped[slot] = item.name;
                        }
                    }
                }
            }
        }

        this.hp = this.baseConfig.hp + hpBonus;
        this.maxHp = this.baseConfig.hp + hpBonus;
        this.damage = this.baseConfig.damage + damageBonus;
        this.attackCooldown = this.baseConfig.attackCooldown * (1 - attackSpeedBonus) || 1000 * (1 - attackSpeedBonus);
        this.damageReduction = damageReductionBonus;
    }

    draw(previewMode = false, previewCtx = ctx){
        const targetCtx = previewMode ? previewCtx : ctx;
        targetCtx.save();
        
        if (this.isDying && this.name !== 'Log Rammer') {
            const elapsed = Date.now() - this.deathAnimationStartTime;
            const progress = Math.min(elapsed / this.deathAnimationDuration, 1);
            
            targetCtx.translate(this.x + this.width / 2, this.y + this.height);
            targetCtx.rotate(this.deathRotation * progress);
            targetCtx.translate(-(this.x + this.width / 2), -(this.y + this.height));
        } else if (this.isCorpse && this.name !== 'Log Rammer') {
            targetCtx.translate(this.x + this.width / 2, this.y + this.height);
            targetCtx.rotate(this.deathRotation);
            targetCtx.translate(-(this.x + this.width / 2), -(this.y + this.height));
        }

        if (this.isPoisoned) {
            targetCtx.globalAlpha = 0.5 + Math.sin(Date.now() / 100) * 0.2;
            targetCtx.fillStyle = 'rgba(102, 204, 0, 0.4)';
            targetCtx.fillRect(this.x, this.y, this.width, this.height);
            targetCtx.globalAlpha = 1.0;
        }

        if(!this.isDying && !this.isCorpse && !previewMode){
            const healthBarOffset = this.name === 'Blowgunner' ? 16 : 10;
            targetCtx.fillStyle='black';
            targetCtx.fillRect(this.x,this.y-healthBarOffset,this.width,5);
            targetCtx.fillStyle='green';
            targetCtx.fillRect(this.x,this.y-healthBarOffset,this.width*(this.hp/this.maxHp),5);

            if (this.name === 'Stone Guard' && !this.shieldBroken) {
                targetCtx.fillStyle = 'black';
                targetCtx.fillRect(this.x, this.y - 17, this.width, 5);
                targetCtx.fillStyle = '#ADD8E6'; 
                targetCtx.fillRect(this.x, this.y - 17, this.width * (this.shieldHp / this.maxShieldHp), 5);
            }
        }

        if (this.stunned && !this.isDying && !this.isCorpse) {
            const stunY = this.y - 15;
            const stunX = this.x + this.width / 2;
            targetCtx.save();
            targetCtx.translate(stunX, stunY);
            targetCtx.rotate((Date.now() / 100) % (Math.PI * 2));
            targetCtx.fillStyle = 'yellow';
            targetCtx.font = 'bold 16px Arial';
            targetCtx.fillText('★', -5, 5);
            targetCtx.restore();
        }

        targetCtx.translate(this.x + this.width / 2, this.y + this.height / 2);
        if (this.owner === 'ai' && !previewMode) {
            targetCtx.scale(-1, 1);
        }
        targetCtx.translate(-(this.x + this.width / 2), -(this.y + this.height / 2));

        if (this.name === 'Clubman') {
            const playerBodyColor = '#4682B4';
            const aiBodyColor = '#FF6347';
            const bodyColor = this.owner === 'player' ? playerBodyColor : aiBodyColor;
            const skinColor = '#F0C29F';
            const clubColor = '#5C4033';

            const clubAnimationDuration = 300;
            const swingAngleRadians = 2 * Math.PI / 3;
            let currentRotationAngle = 0;
            const now = Date.now();
            if (this.isAnimatingAttack) {
                const animationProgress = (now - this.lastAttackTime) / clubAnimationDuration;
                currentRotationAngle = Math.sin(animationProgress * Math.PI) * swingAngleRadians;
                if (animationProgress >= 1) {
                    this.isAnimatingAttack = false;
                }
            } else if (!this.isAttacking) {
                currentRotationAngle = Math.sin(now / 200) * 0.2;
            }

            targetCtx.fillStyle = skinColor;
            targetCtx.beginPath();
            targetCtx.arc(this.x + this.width / 2, this.y + 8, 8, 0, Math.PI * 2);
            targetCtx.fill();
            targetCtx.fillStyle = bodyColor;
            targetCtx.fillRect(this.x + 5, this.y + 15, this.width - 10, this.height - 15);
            targetCtx.fillRect(this.x + 5, this.y + this.height - 5, 10, 10);
            targetCtx.fillRect(this.x + this.width - 15, this.y + this.height - 5, 10, 10);

            targetCtx.save();
            const pivotX = this.x + this.width - 10;
            const pivotY = this.y + 15;
            targetCtx.translate(pivotX, pivotY);
            targetCtx.rotate(currentRotationAngle);
            targetCtx.fillStyle = skinColor;
            targetCtx.fillRect(0, 0, 5, 15);
            targetCtx.fillStyle = clubColor;
            targetCtx.fillRect(5, -5, 5, 20);
            targetCtx.beginPath();
            targetCtx.arc(10, -7, 7, 0, Math.PI * 2);
            targetCtx.fill();
            targetCtx.restore();
        } else if (this.name === 'Axeman') {
            const skinColor = '#F0C29F';
            const robeColor = '#8B4513';
            const hatBodyColor = '#5C4033';
            const hatStripeColor = '#A0522D';
            const axeHandleColor = '#A0522D';
            const axeHeadColor = '#C0C0C0';

            const axeAnimationDuration = 300;
            const swingAngleRadians = 2 * Math.PI / 3;
            let currentRotationAngle = 0;
            const now = Date.now();
            if (this.isAnimatingAttack) {
                const animationProgress = (now - this.lastAttackTime) / axeAnimationDuration;
                currentRotationAngle = Math.sin(animationProgress * Math.PI) * swingAngleRadians;
                if (animationProgress >= 1) {
                    this.isAnimatingAttack = false;
                }
            } else if (!this.isAttacking) {
                currentRotationAngle = Math.sin(now / 200) * 0.2;
            }

            targetCtx.fillStyle = skinColor;
            targetCtx.fillRect(this.x + 5, this.y + 15, this.width - 10, this.height - 15);
            targetCtx.fillRect(this.x + 5, this.y + this.height - 5, 10, 10);
            targetCtx.fillRect(this.x + this.width - 15, this.y + this.height - 5, 10, 10);

            if (this.equipped.chest === 'Leather Loincloth' || !this.equipped.chest) {
                targetCtx.fillStyle = robeColor;
                targetCtx.beginPath();
                if (this.owner === 'player') {
                    targetCtx.moveTo(this.x + 5, this.y + 15);
                    targetCtx.lineTo(this.x + this.width - 5, this.y + 15);
                    targetCtx.lineTo(this.x + this.width - 5, this.y + this.height - 10);
                    targetCtx.lineTo(this.x + 15, this.y + this.height - 10);
                } else {
                    targetCtx.moveTo(this.x + 5, this.y + 15);
                    targetCtx.lineTo(this.x + this.width - 5, this.y + 15);
                    targetCtx.lineTo(this.x + 5, this.y + this.height - 10);
                    targetCtx.lineTo(this.x + this.width - 15, this.y + this.height - 10);
                }
                targetCtx.closePath();
                targetCtx.fill();
            } else if (this.equipped.chest === 'Primal Leather Tunic') {
                // Primal Leather Tunic: V-neck, lacing, belt, and shading
                const cx = this.x + this.width / 2;
                const topY = this.y + 15;
                const botY = this.y + this.height - 4;
                const leather = '#8B5A2B';
                const darkLeather = '#5C4033';
                const stitch = '#D2B48C';
                // Torso leather body with slight taper
                targetCtx.fillStyle = leather;
                targetCtx.beginPath();
                targetCtx.moveTo(this.x + 4, topY);
                targetCtx.lineTo(this.x + this.width - 4, topY);
                targetCtx.lineTo(this.x + this.width - 2, botY);
                targetCtx.lineTo(this.x + 2, botY);
                targetCtx.closePath();
                targetCtx.fill();
                // V-neck cutout
                targetCtx.fillStyle = skinColor;
                targetCtx.beginPath();
                targetCtx.moveTo(cx - 4, topY);
                targetCtx.lineTo(cx + 4, topY);
                targetCtx.lineTo(cx, topY + 5);
                targetCtx.closePath();
                targetCtx.fill();
                // Lacing down from V
                targetCtx.strokeStyle = stitch;
                targetCtx.lineWidth = 1;
                for (let i = 0; i < 3; i++) {
                    const y = topY + 6 + i * 3;
                    targetCtx.beginPath();
                    targetCtx.moveTo(cx - 2, y);
                    targetCtx.lineTo(cx + 2, y + 1);
                    targetCtx.moveTo(cx + 2, y);
                    targetCtx.lineTo(cx - 2, y + 1);
                    targetCtx.stroke();
                }
                // Belt
                targetCtx.fillStyle = darkLeather;
                targetCtx.fillRect(this.x + 3, this.y + this.height - 12, this.width - 6, 3);
                // Hem notches
                targetCtx.fillStyle = darkLeather;
                targetCtx.fillRect(cx - 2, botY - 1, 4, 2);
                // Shoulder trim suggestion
                targetCtx.strokeStyle = darkLeather;
                targetCtx.beginPath();
                targetCtx.moveTo(this.x + 4, topY);
                targetCtx.lineTo(this.x + 10, topY - 2);
                targetCtx.moveTo(this.x + this.width - 4, topY);
                targetCtx.lineTo(this.x + this.width - 10, topY - 2);
                targetCtx.stroke();
            } else if (this.equipped.chest === 'Bone Plated Armor') {
                // Bone Plated Armor: rib-like plates with sternum and straps
                const cx2 = this.x + this.width / 2;
                const top = this.y + 14;
                const bottom = this.y + this.height - 6;
                const bone = '#EAE6D3';
                const strap = '#5C4033';
                const outline = '#B9B39C';
                const leatherBase = '#8B5A2B';
                // Leather base under ribs
                targetCtx.fillStyle = leatherBase;
                targetCtx.beginPath();
                targetCtx.moveTo(this.x + 3, top);
                targetCtx.lineTo(this.x + this.width - 3, top);
                targetCtx.lineTo(this.x + this.width - 5, bottom);
                targetCtx.lineTo(this.x + 5, bottom);
                targetCtx.closePath();
                targetCtx.fill();
                // Sternum plate
                targetCtx.fillStyle = bone;
                targetCtx.beginPath();
                targetCtx.moveTo(cx2 - 2, top);
                targetCtx.lineTo(cx2 + 2, top);
                targetCtx.lineTo(cx2 + 3, bottom);
                targetCtx.lineTo(cx2 - 3, bottom);
                targetCtx.closePath();
                targetCtx.fill();
                // Rib plates (left/right)
                targetCtx.fillStyle = bone;
                for (let i = 0; i < 3; i++) {
                    const y = top + 3 + i * 5;
                    // left rib
                    targetCtx.beginPath();
                    targetCtx.moveTo(cx2 - 3, y);
                    targetCtx.lineTo(this.x + 4, y + 1);
                    targetCtx.lineTo(this.x + 4, y + 3);
                    targetCtx.lineTo(cx2 - 3, y + 2);
                    targetCtx.closePath();
                    targetCtx.fill();
                    // right rib
                    targetCtx.beginPath();
                    targetCtx.moveTo(cx2 + 3, y);
                    targetCtx.lineTo(this.x + this.width - 4, y + 1);
                    targetCtx.lineTo(this.x + this.width - 4, y + 3);
                    targetCtx.lineTo(cx2 + 3, y + 2);
                    targetCtx.closePath();
                    targetCtx.fill();
                }
                // Shoulder bone caps
                targetCtx.beginPath();
                targetCtx.arc(this.x + 3, top - 2, 3, 0, Math.PI * 2);
                targetCtx.arc(this.x + this.width - 3, top - 2, 3, 0, Math.PI * 2);
                targetCtx.fill();
                // Leather straps horizontally
                targetCtx.fillStyle = strap;
                targetCtx.fillRect(this.x + 2, top + 8, this.width - 4, 2);
                targetCtx.fillRect(this.x + 2, top + 16, this.width - 4, 2);
                // Subtle outline accent
                targetCtx.strokeStyle = outline;
                targetCtx.lineWidth = 1;
                targetCtx.beginPath();
                targetCtx.moveTo(this.x + 2, top + 8);
                targetCtx.lineTo(this.x + this.width - 2, top + 8);
                targetCtx.stroke();
            }

            targetCtx.fillStyle = skinColor;
            targetCtx.beginPath();
            targetCtx.arc(this.x + this.width / 2, this.y + 8, 8, 0, Math.PI * 2);
            targetCtx.fill();

            const hatY = this.y;
            if (this.equipped.head === 'Fur Hat' || !this.equipped.head) {
                const tailLength = 15;
                const tailWidth = 5;
                targetCtx.fillStyle = hatBodyColor;
                targetCtx.beginPath();
                targetCtx.arc(this.x + this.width / 2, hatY + 5, 9, Math.PI, 0);
                targetCtx.fill();
                targetCtx.fillStyle = hatStripeColor;
                const tailStartX = this.x + 5;
                targetCtx.fillRect(tailStartX - tailLength, hatY + 2, tailLength, tailWidth);
                targetCtx.fillStyle = hatBodyColor;
                for (let i = 0; i < 3; i++) {
                    targetCtx.fillRect(tailStartX - tailLength + i * 5, hatY + 2, 2, tailWidth);
                }
            } else if (this.equipped.head === 'Leather Cap') {
                const cx = this.x + this.width / 2;
                targetCtx.fillStyle = '#8B4513';
                targetCtx.beginPath();
                targetCtx.arc(cx, this.y + 4, 9, Math.PI, 0);
                targetCtx.fill();
                targetCtx.fillStyle = '#7A3F1A';
                targetCtx.fillRect(cx - 6, this.y + 4, 12, 2);
                targetCtx.strokeStyle = '#A4703A';
                targetCtx.lineWidth = 1;
                for (let i = -6; i <= 6; i += 6) {
                    targetCtx.beginPath();
                    targetCtx.moveTo(cx + i, this.y + 0);
                    targetCtx.lineTo(cx + i, this.y + 3);
                    targetCtx.stroke();
                }
            } else if (this.equipped.head === 'Bone Helmet') {
                // Deer skull style mask
                const cx = this.x + this.width / 2;
                const cy = this.y + 5;
                const bone = '#E9E4CF';
                const shadow = '#D8D2B8';
                const line = '#8C8366';
                // Upper skull dome
                targetCtx.fillStyle = bone;
                targetCtx.beginPath();
                targetCtx.ellipse(cx, cy - 1, 9, 7, 0, Math.PI, 0);
                targetCtx.fill();
                // Lower mask/jaw shape
                targetCtx.beginPath();
                targetCtx.moveTo(cx - 7, cy + 1);
                targetCtx.lineTo(cx + 7, cy + 1);
                targetCtx.lineTo(cx + 5, cy + 6);
                targetCtx.lineTo(cx - 5, cy + 6);
                targetCtx.closePath();
                targetCtx.fill();
                // Subtle shading
                targetCtx.fillStyle = shadow;
                targetCtx.fillRect(cx - 6, cy + 2, 12, 1);
                // Eye sockets
                targetCtx.fillStyle = 'black';
                targetCtx.beginPath();
                targetCtx.arc(cx - 3, cy - 2, 2, 0, Math.PI * 2);
                targetCtx.arc(cx + 3, cy - 2, 2, 0, Math.PI * 2);
                targetCtx.fill();
                // Nasal opening (inverted triangle)
                targetCtx.beginPath();
                targetCtx.moveTo(cx, cy);
                targetCtx.lineTo(cx - 1.5, cy + 3);
                targetCtx.lineTo(cx + 1.5, cy + 3);
                targetCtx.closePath();
                targetCtx.fill();
                // Small horn nubs
                targetCtx.fillStyle = bone;
                targetCtx.beginPath();
                targetCtx.moveTo(cx - 7, cy - 5);
                targetCtx.lineTo(cx - 10, cy - 7);
                targetCtx.lineTo(cx - 9, cy - 4);
                targetCtx.closePath();
                targetCtx.fill();
                targetCtx.beginPath();
                targetCtx.moveTo(cx + 7, cy - 5);
                targetCtx.lineTo(cx + 10, cy - 7);
                targetCtx.lineTo(cx + 9, cy - 4);
                targetCtx.closePath();
                targetCtx.fill();
                // Outline accents
                targetCtx.strokeStyle = line;
                targetCtx.lineWidth = 1;
                targetCtx.beginPath();
                targetCtx.moveTo(cx - 6, cy + 1);
                targetCtx.lineTo(cx + 6, cy + 1);
                targetCtx.stroke();
            }


            targetCtx.save();
            const pivotX = this.x + this.width - 10;
            const pivotY = this.y + 15;
            targetCtx.translate(pivotX, pivotY);
            targetCtx.rotate(currentRotationAngle);
            targetCtx.fillStyle = skinColor;
            targetCtx.fillRect(0, 0, 5, 15);
            
            if (this.equipped.weapon === 'Simple Stone Axe' || !this.equipped.weapon) {
                targetCtx.fillStyle = axeHandleColor;
                targetCtx.fillRect(5, -5, 5, 25);
                targetCtx.fillStyle = axeHeadColor;
                targetCtx.beginPath();
                targetCtx.moveTo(10, -10);
                targetCtx.lineTo(20, -15);
                targetCtx.lineTo(20, 0);
                targetCtx.lineTo(10, 5);
                targetCtx.closePath();
                targetCtx.fill();
            } else if (this.equipped.weapon === 'Obsidian Axe') {
                targetCtx.fillStyle = '#A0522D';
                targetCtx.fillRect(5, -5, 5, 25);
                targetCtx.fillStyle = '#343434';
                targetCtx.beginPath();
                targetCtx.moveTo(10, -12);
                targetCtx.lineTo(22, -18);
                targetCtx.lineTo(22, 2);
                targetCtx.lineTo(10, 8);
                targetCtx.closePath();
                targetCtx.fill();
            } else if (this.equipped.weapon === 'Jagged Bone Axe') {
                targetCtx.fillStyle = '#654321';
                targetCtx.fillRect(5, -5, 5, 25);
                targetCtx.fillStyle = '#F5F5DC';
                targetCtx.beginPath();
                targetCtx.moveTo(10, -10);
                targetCtx.lineTo(15, -15);
                targetCtx.lineTo(20, -12);
                targetCtx.lineTo(22, -5);
                targetCtx.lineTo(20, 2);
                targetCtx.lineTo(15, 5);
                targetCtx.lineTo(10, 2);
                targetCtx.closePath();
                targetCtx.fill();
            }
            targetCtx.restore();

        } else if (this.name === 'Slinger' || this.name === 'Blowgunner') {
            const isSlinger = this.name === 'Slinger';
            const playerBodyColor = isSlinger ? '#00008B' : '#8B4513';
            const aiBodyColor = isSlinger ? '#8B0000' : '#8B4513';
            const bodyColor = this.owner === 'player' ? playerBodyColor : aiBodyColor;
            const skinColor = '#F0C29F';
            const weaponColor = isSlinger ? '#8B4513' : '#FFFF00';
            const projectileColor = '#808080';

            const animationDuration = 400;
            let currentRotationAngle = isSlinger ? -Math.PI * 0.6 : 0;
            let weaponOffsetX = 0;
            const now = Date.now();

            if (this.isAnimatingAttack) {
                const animationProgress = (now - this.lastAttackTime) / animationDuration;
                if (isSlinger) {
                    const idleAngle = -Math.PI * 0.6;
                    const windUpAngle = -Math.PI * 0.8;
                    const throwAngle = Math.PI * 0.2;
                    if (animationProgress < 0.5) {
                        currentRotationAngle = idleAngle + (windUpAngle - idleAngle) * (animationProgress / 0.5);
                    } else if (animationProgress < 1) {
                        currentRotationAngle = windUpAngle + (throwAngle - windUpAngle) * ((animationProgress - 0.5) / 0.5);
                    } else {
                        this.isAnimatingAttack = false;
                        this.projectileSpawnedThisAttack = false;
                        this.target = null;
                    }
                } else {
                    if (animationProgress < 0.4) {
                        weaponOffsetX = -10 * (animationProgress / 0.4);
                    } else if (animationProgress < 0.6) {
                        weaponOffsetX = -10;
                    } else if (animationProgress < 1) {
                        weaponOffsetX = -10 + 10 * ((animationProgress - 0.6) / 0.4);
                    } else {
                        this.isAnimatingAttack = false;
                        this.projectileSpawnedThisAttack = false;
                        this.target = null;
                    }
                }
            } else if (!this.isAttacking) {
                if (isSlinger) { 
                    currentRotationAngle = -Math.PI * 0.6 + Math.sin(now / 200) * 0.3;
                } else {
                    weaponOffsetX = Math.sin(now / 250) * 5;
                }
            }

            let armColor = skinColor;
            if (isSlinger) {
                targetCtx.fillStyle = bodyColor;
                targetCtx.beginPath();
                targetCtx.moveTo(this.x + this.width / 2, this.y + 5);
                targetCtx.lineTo(this.x + 5, this.y + this.height);
                targetCtx.lineTo(this.x + this.width - 5, this.y + this.height);
                targetCtx.closePath();
                targetCtx.fill();
            } else {
                const equippedChest = this.equipped?.chest || 'Leather Dress';
                targetCtx.save();
                targetCtx.translate(this.x + this.width / 2, this.y + this.height / 2 + 4);
                const scale = 0.44;
                targetCtx.scale(scale, scale);
                drawBlowgunnerChestPreview(targetCtx, equippedChest);
                targetCtx.restore();
            }

            targetCtx.save();
            targetCtx.translate(this.x + this.width / 2, this.y);
            if (isSlinger) {
                targetCtx.fillStyle = skinColor;
                targetCtx.beginPath();
                targetCtx.arc(0, 0, 8, 0, Math.PI * 2);
                targetCtx.fill();
            } else {
                const equippedHead = this.equipped?.head || 'Feather Headband';
                const scale = 0.4;
                targetCtx.scale(scale, scale);
                drawBlowgunnerHeadPreview(targetCtx, equippedHead);
            }
            targetCtx.restore();

            targetCtx.save();
            const pivotX = this.x + this.width / 2;
            let pivotY = isSlinger ? this.y + 10 : this.y + 4;
            targetCtx.translate(pivotX + weaponOffsetX, pivotY);
            targetCtx.rotate(currentRotationAngle);

            if (isSlinger) {
                const armLength = 20;
                const forearmLength = 10;
                const slingTipXOffset = 15;
                const slingVerticalOffset = 10;
                targetCtx.fillStyle = skinColor;
                targetCtx.fillRect(-2.5, 0, 5, armLength);
                const forearmLocalX = 2.5;
                const forearmLocalY = armLength;
                targetCtx.fillRect(forearmLocalX, forearmLocalY, forearmLength, 5);
                const slingAttachX = forearmLocalX + forearmLength;
                const slingAttachY = forearmLocalY + 2.5;
                targetCtx.strokeStyle = weaponColor;
                targetCtx.lineWidth = 2;
                targetCtx.beginPath();
                targetCtx.moveTo(slingAttachX, slingAttachY);
                targetCtx.lineTo(slingAttachX + slingTipXOffset, slingAttachY - slingVerticalOffset);
                targetCtx.lineTo(slingAttachX + slingTipXOffset, slingAttachY + slingVerticalOffset);
                targetCtx.lineTo(slingAttachX, slingAttachY);
                targetCtx.stroke();
                targetCtx.fillStyle = projectileColor;
                targetCtx.beginPath();
                targetCtx.arc(slingAttachX + slingTipXOffset, slingAttachY, 4, 0, Math.PI * 2);
                targetCtx.fill();
            } else {
                targetCtx.fillStyle = armColor;
                targetCtx.fillRect(-5, 0, 10, 5);
                targetCtx.fillRect(15, 0, 10, 5);
                
                let weaponMainColor = '#87A96B'; // Green color for reed blow pipe
                let weaponAccentColor = '#C5D887';
                const weaponItem = this.equipped.weapon || 'Reed Blow Pipe';

                if (weaponItem === 'Hardened Blowpipe') {
                    weaponMainColor = '#3C3C3C'; // Dark gray for hardened blowpipe
                    weaponAccentColor = '#8B4513';
                } else if (weaponItem === 'Poisoned Darts') {
                    weaponMainColor = '#4B3621'; // Dark brown for poisoned darts
                    weaponAccentColor = '#2E8B57';
                }

                targetCtx.fillStyle = weaponMainColor;
                targetCtx.fillRect(0, -2, 30, 4);

                if (weaponItem === 'Hardened Blowpipe') {
                    targetCtx.fillStyle = weaponAccentColor;
                    for (let i = 4; i <= 24; i += 8) {
                        targetCtx.fillRect(i, -3, 3, 6);
                    }
                } else if (weaponItem === 'Poisoned Darts') {
                    targetCtx.fillStyle = weaponAccentColor;
                    for (let i = 6; i <= 24; i += 9) {
                        targetCtx.beginPath();
                        targetCtx.moveTo(i, -5);
                        targetCtx.lineTo(i + 3, -11);
                        targetCtx.lineTo(i + 6, -5);
                        targetCtx.closePath();
                        targetCtx.fill();
                    }
                } else {
                    targetCtx.fillStyle = weaponAccentColor;
                    targetCtx.fillRect(10, -3, 10, 6);
                }
            }

            targetCtx.restore();

        } else if (this.name === 'Falcon Caster') {
            const robeColor = this.owner === 'player' ? '#367588' : '#800020';
            const furColor = '#FFFFFF';
            const skinColor = '#F0C29F';
            const hatColor = this.owner === 'player' ? '#4682B4' : '#FF6347';
            
            let armAngle = 0;
            let armX = 0;
            let armY = 0;
            let bodyTilt = 0;

            if (this.isRespawningFalcon) {
                const animDuration = 1500;
                const elapsed = Date.now() - this.actionStartTime;
                const progress = Math.min(elapsed / animDuration, 1);

                if (progress < 0.33) { // Arm up
                    armAngle = -(Math.PI / 2) * (progress / 0.33);
                } else if (progress < 0.66) { // Tilt back
                    armAngle = -Math.PI / 2;
                    bodyTilt = -0.2 * ((progress - 0.33) / 0.33);
                } else { // Stomp and hold
                    armAngle = -Math.PI / 2;
                    bodyTilt = -0.2;
                }
            } else if (this.isAnimatingAttack) {
                const animDuration = 400;
                const elapsed = Date.now() - this.lastAttackTime;
                const progress = Math.min(elapsed / animDuration, 1);
                const swing = Math.sin(progress * Math.PI);

                if (this.attackType === 'punch') {
                    armX = swing * 15;
                } else { // slam
                    armAngle = -swing * (Math.PI / 2);
                }
            } else {
                armX = Math.sin(this.walkCycle) * 2;
                armY = Math.cos(this.walkCycle) * 2;
            }

            targetCtx.save();
            targetCtx.translate(this.x + this.width / 2, this.y + this.height);
            targetCtx.rotate(bodyTilt);
            targetCtx.translate(-(this.x + this.width / 2), -(this.y + this.height));


            targetCtx.fillStyle = robeColor;
            targetCtx.fillRect(this.x + 5, this.y + 15, this.width - 10, this.height - 15);
            
            targetCtx.fillStyle = furColor;
            targetCtx.fillRect(this.x + 5, this.y + 15, this.width - 10, 5); // Collar
            targetCtx.fillRect(this.x + (this.width/2) - 2.5, this.y + 15, 5, this.height - 15); // Center line

            targetCtx.fillStyle = skinColor;
            targetCtx.beginPath();
            targetCtx.arc(this.x + this.width / 2, this.y + 8, 8, 0, Math.PI * 2);
            targetCtx.fill();

            targetCtx.fillStyle = hatColor;
            targetCtx.beginPath();
            targetCtx.moveTo(this.x + this.width / 2 - 12, this.y + 5);
            targetCtx.lineTo(this.x + this.width / 2 + 12, this.y + 5);
            targetCtx.lineTo(this.x + this.width / 2, this.y - 8);
            targetCtx.closePath();
            targetCtx.fill();
            targetCtx.fillStyle = furColor;
            targetCtx.fillRect(this.x + this.width / 2 - 12, this.y + 5, 24, 4);

            targetCtx.save();
            targetCtx.translate(this.x + this.width - 5 + armX, this.y + 20 + armY);
            targetCtx.rotate(armAngle);
            targetCtx.fillStyle = skinColor;
            targetCtx.fillRect(0, 0, 10, 5); 
            
            targetCtx.fillStyle = '#8B4513'; 
            targetCtx.beginPath();
            targetCtx.arc(10 + 4, 2.5, 6, 0, Math.PI * 2); 
            targetCtx.fill();
            targetCtx.fillRect(10, -1.5, 4, 8); 
            targetCtx.restore();

            targetCtx.restore(); 

        } else if (this.name === 'Earth Guardian') {
            const darkRockColor = '#5D6D7E';
            const lightRockColor = '#85929E';
            const glowColor = '#1ABC9C';
            const mossColor = '#28B463';
            const now = Date.now();
            
            let armRotation = 0;
            let bodyBob = 0;
            let legMovement = 0;

            if (this.isAnimatingAttack) {
                const animationDuration = 500;
                const animationProgress = (now - this.lastAttackTime) / animationDuration;
                if (animationProgress < 0.5) {
                    armRotation = (animationProgress / 0.5) * -Math.PI / 2; 
                } else if (animationProgress < 1) {
                    armRotation = (1 - (animationProgress - 0.5) / 0.5) * -Math.PI / 2; 
                } else {
                    this.isAnimatingAttack = false;
                }
            } else {
                bodyBob = Math.sin(this.walkCycle) * 2;
                legMovement = Math.sin(this.walkCycle) * 6.4; 
            }

            const baseX = this.x;
            const baseY = this.y + bodyBob;
            const groundLine = this.y + this.height;

            targetCtx.fillStyle = darkRockColor;
            targetCtx.beginPath();
            targetCtx.moveTo(baseX + 35 + legMovement, groundLine);
            targetCtx.lineTo(baseX + 55 + legMovement, groundLine);
            targetCtx.lineTo(baseX + 50 + legMovement, baseY + 40);
            targetCtx.lineTo(baseX + 30 + legMovement, baseY + 40);
            targetCtx.closePath();
            targetCtx.fill();

            targetCtx.fillStyle = lightRockColor;
            targetCtx.beginPath();
            targetCtx.moveTo(baseX + 10 - legMovement, groundLine);
            targetCtx.lineTo(baseX + 30 - legMovement, groundLine);
            targetCtx.lineTo(baseX + 25 - legMovement, baseY + 40);
            targetCtx.lineTo(baseX + 5 - legMovement, baseY + 40);
            targetCtx.closePath();
            targetCtx.fill();

            targetCtx.fillStyle = lightRockColor;
            targetCtx.beginPath();
            targetCtx.moveTo(baseX + 5, baseY + 45);
            targetCtx.lineTo(baseX + 55, baseY + 45);
            targetCtx.lineTo(baseX + 45, baseY + 10);
            targetCtx.lineTo(baseX + 15, baseY + 10);
            targetCtx.closePath();
            targetCtx.fill();

            targetCtx.strokeStyle = glowColor;
            targetCtx.lineWidth = 2;
            targetCtx.beginPath();
            targetCtx.moveTo(baseX + 20, baseY + 40);
            targetCtx.lineTo(baseX + 30, baseY + 25);
            targetCtx.lineTo(baseX + 40, baseY + 35);
            targetCtx.stroke();

            targetCtx.fillStyle = darkRockColor;
            targetCtx.beginPath();
            targetCtx.moveTo(baseX + 20, baseY + 15);
            targetCtx.lineTo(baseX + 40, baseY + 15);
            targetCtx.lineTo(baseX + 35, baseY);
            targetCtx.lineTo(baseX + 25, baseY);
            targetCtx.closePath();
            targetCtx.fill();

            targetCtx.fillStyle = glowColor;
            targetCtx.fillRect(baseX + 26, baseY + 5, 3, 3);
            targetCtx.fillRect(baseX + 31, baseY + 5, 3, 3);
            
            targetCtx.save();
            targetCtx.fillStyle = darkRockColor;
            targetCtx.translate(baseX + 50, baseY + 20);
            targetCtx.rotate(-legMovement / 40 + armRotation);
            targetCtx.beginPath();
            targetCtx.moveTo(0, 0);
            targetCtx.lineTo(15, 10);
            targetCtx.lineTo(10, 30);
            targetCtx.lineTo(-5, 25);
            targetCtx.closePath();
            targetCtx.fill();
            targetCtx.restore();

            targetCtx.save();
            targetCtx.fillStyle = lightRockColor;
            targetCtx.translate(baseX + 10, baseY + 20);
            targetCtx.rotate(legMovement / 40 + armRotation);
            targetCtx.beginPath();
            targetCtx.moveTo(0, 0);
            targetCtx.lineTo(-15, 10);
            targetCtx.lineTo(-10, 30);
            targetCtx.lineTo(5, 25);
            targetCtx.closePath();
            targetCtx.fill();
            targetCtx.restore();

            targetCtx.fillStyle = mossColor;
            targetCtx.fillRect(baseX + 40, baseY + 15, 10, 5); 
            targetCtx.fillRect(baseX + 15, baseY + 60, 15, 5); 

            if (this.heldCorpse) {
                targetCtx.save();
                let corpseX = this.x + this.width - 20;
                let corpseY = this.y + 20;
                let corpseRotation = 0;

                if (this.substate === 'raisingCorpse') {
                    const animDuration = 500;
                    const progress = Math.min((Date.now() - this.actionStartTime) / animDuration, 1);
                    corpseY -= progress * 40; 
                } else if (this.substate === 'clubbing') {
                    const animDuration = 500;
                    const progress = Math.min((Date.now() - this.actionStartTime) / animDuration, 1);
                    corpseRotation = Math.sin(progress * Math.PI) * -Math.PI / 2;
                } else if (this.substate === 'throwing' || this.substate === 'aimingThrow') {
                        corpseY -= 40; 
                }

                targetCtx.translate(corpseX, corpseY);
                targetCtx.rotate(corpseRotation);
                // Draw the actual held corpse object instead of creating a new one
                this.heldCorpse.x = -this.heldCorpse.width / 2;
                this.heldCorpse.y = -this.heldCorpse.height / 2;
                this.heldCorpse.draw();
                targetCtx.restore();
            }


        } else if (this.name === 'Stone Guard') {
            const skinColor = '#F0C29F';
            const armorColor = '#8a8a8a';
            const armorHighlight = '#a9a9a9';
            const armorShadow = '#696969';
            
            let armX = 0;
            let armY = 0;
            let armRotation = 0;
            let maceRotation = 0;
            let pushOffsetX = 0;
            let bodyOffsetX = 0;
            if (this.isAnimatingAttack) {
                const animDuration = 600;
                const elapsed = Date.now() - this.lastAttackTime;
                const progress = Math.min(elapsed / animDuration, 1);
                const swing = Math.sin(progress * Math.PI);

                if (this.shieldBroken) {
                    if (this.attackType === 'maceSmash') {
                        if (progress < 0.5) {
                            armRotation = (progress / 0.5) * -Math.PI / 1.5;
                            // Add forward body movement for mace smash
                            bodyOffsetX = Math.sin(progress * Math.PI) * 8;
                        } else {
                            armRotation = (1 - (progress - 0.5) / 0.5) * -Math.PI / 1.5;
                            bodyOffsetX = Math.sin(progress * Math.PI) * 8;
                        }
                    } else { // Stabbing attack - push the mace head forward
                        if (progress < 0.3) {
                            // Wind up phase - pull back slightly
                            armX = -5 * (progress / 0.3);
                            bodyOffsetX = -2 * (progress / 0.3);
                        } else if (progress < 0.7) {
                            // Thrust forward phase
                            const thrustProgress = (progress - 0.3) / 0.4;
                            armX = -5 + 25 * thrustProgress;
                            bodyOffsetX = -2 + 8 * thrustProgress;
                            maceRotation = Math.PI / 4; // Rotate mace for thrusting motion
                        } else {
                            // Recovery phase
                            const recoveryProgress = (progress - 0.7) / 0.3;
                            armX = 20 - 25 * recoveryProgress;
                            bodyOffsetX = 6 - 8 * recoveryProgress;
                            maceRotation = Math.PI / 4 * (1 - recoveryProgress);
                        }
                    }
                } else {
                    // Shield push animation - FORWARD ONLY
                    if (progress < 0.3) {
                        const phaseProgress = progress / 0.3;
                        bodyOffsetX = 0; // No backward movement
                        pushOffsetX = 0; // Shield stays in place initially
                    } else if (progress < 0.7) {
                        const phaseProgress = (progress - 0.3) / 0.4;
                        bodyOffsetX = 0; // No backward movement
                        pushOffsetX = 15 * phaseProgress; // Shield pushes forward
                    } else if (progress < 1) {
                        const phaseProgress = (progress - 0.7) / 0.3;
                        bodyOffsetX = 0; // No backward movement
                        pushOffsetX = 15; // Shield stays extended
                    }
                }
            } else if (this.shieldBroken) {
                armRotation = -Math.PI / 4;
                // Add walk animation for disarmed Stone Guard's mace - slower than axeman
                const now = Date.now();
                const walkRotation = Math.sin(now / 300) * 0.15; // Slower than axeman's 200ms cycle
                armRotation += walkRotation;
            }

            const drawRockPlate = (points, color) => {
                targetCtx.fillStyle = color;
                targetCtx.beginPath();
                targetCtx.moveTo(this.x + points[0][0], this.y + points[0][1]);
                for (let i = 1; i < points.length; i++) {
                    targetCtx.lineTo(this.x + points[i][0], this.y + points[i][1]);
                }
                targetCtx.closePath();
                targetCtx.fill();
            };

            const legBob = Math.sin(this.walkCycle * 1.5) * 2;
            targetCtx.fillStyle = skinColor;
            targetCtx.fillRect(this.x + 8 + bodyOffsetX, this.y + 40 + legBob, 8, 10);
            targetCtx.fillRect(this.x + 24 + bodyOffsetX, this.y + 40 - legBob, 8, 10);

            drawRockPlate([[8 + bodyOffsetX, 15], [32 + bodyOffsetX, 15], [35 + bodyOffsetX, 30], [25 + bodyOffsetX, 45], [5 + bodyOffsetX, 45]], armorShadow);
            drawRockPlate([[10 + bodyOffsetX, 16], [30 + bodyOffsetX, 16], [33 + bodyOffsetX, 28], [24 + bodyOffsetX, 43], [7 + bodyOffsetX, 43]], armorColor);
            drawRockPlate([[12 + bodyOffsetX, 18], [28 + bodyOffsetX, 18], [25 + bodyOffsetX, 25]], armorHighlight);

            drawRockPlate([[15 + bodyOffsetX, 2], [25 + bodyOffsetX, 2], [28 + bodyOffsetX, 12], [12 + bodyOffsetX, 12]], armorColor);
            drawRockPlate([[17 + bodyOffsetX, 3], [23 + bodyOffsetX, 3], [25 + bodyOffsetX, 10], [15 + bodyOffsetX, 10]], armorHighlight);
            targetCtx.fillStyle = '#333'; 
            targetCtx.fillRect(this.x + 16 + bodyOffsetX, this.y + 7, 8, 2);

            targetCtx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
            targetCtx.lineWidth = 1;
            targetCtx.beginPath();
            targetCtx.moveTo(this.x + 10 + bodyOffsetX, this.y + 20);
            targetCtx.lineTo(this.x + 15 + bodyOffsetX, this.y + 25);
            targetCtx.lineTo(this.x + 12 + bodyOffsetX, this.y + 30);
            targetCtx.stroke();
            targetCtx.beginPath();
            targetCtx.moveTo(this.x + 28 + bodyOffsetX, this.y + 35);
            targetCtx.lineTo(this.x + 32 + bodyOffsetX, this.y + 40);
            targetCtx.stroke();

            targetCtx.save();
            targetCtx.translate(this.x + this.width - 20, this.y + 20);
            if (this.shieldBroken) {
                targetCtx.translate(armX, armY);
                targetCtx.rotate(-armRotation);
                const maceHandleColor = '#8B4513';
                const maceHeadColor = '#808080';
                
                targetCtx.save();
                targetCtx.rotate(-maceRotation);
                targetCtx.fillStyle = maceHandleColor;
                targetCtx.fillRect(-2.5, -25, 5, 25);
                targetCtx.fillStyle = maceHeadColor;
                targetCtx.beginPath();
                targetCtx.arc(0, -30, 10, 0, Math.PI * 2);
                targetCtx.fill();
                // Add small stone attached to the mace
                targetCtx.fillStyle = armorShadow;
                targetCtx.beginPath();
                targetCtx.arc(12, -25, 6, 0, Math.PI * 2);
                targetCtx.fill();
                targetCtx.restore();
            } else {
                targetCtx.translate(armX, 0);
                drawRockPlate([[-2,0], [8,0], [6, 5], [-4, 5]], armorColor);
                targetCtx.fillStyle = armorShadow;
                targetCtx.beginPath();
                targetCtx.arc(12, 2.5, 6, 0, Math.PI * 2);
                targetCtx.fill();
            }
            targetCtx.restore();

            if (!this.shieldBroken) {
                const shieldArmAngle = -Math.PI / 8;
                targetCtx.save();
                targetCtx.translate(this.x + 10 + pushOffsetX, this.y + 20);
                targetCtx.rotate(shieldArmAngle);
                // New walk animation: arms move away and back with shield
                const walkPhase = Math.sin(this.walkCycle * 2) * 0.5; // Creates back and forth motion
                targetCtx.translate(walkPhase * 8, 0); // Arms move away and back
                targetCtx.fillStyle = skinColor;
                targetCtx.fillRect(0, 0, 15, 6);
                
                const shieldWidth = this.width * 1.2;
                const shieldHeight = this.height * 1.3;
                const shieldX = 15;
                const shieldY = -shieldHeight / 2 + 3;

                targetCtx.fillStyle = '#8a8a8a';
                targetCtx.beginPath();
                targetCtx.moveTo(shieldX, shieldY);
                targetCtx.lineTo(shieldX + shieldWidth, shieldY + 5);
                targetCtx.lineTo(shieldX + shieldWidth - 5, shieldY + shieldHeight);
                targetCtx.lineTo(shieldX + 5, shieldY + shieldHeight - 5);
                targetCtx.closePath();
                targetCtx.fill();

                targetCtx.fillStyle = '#a9a9a9';
                targetCtx.beginPath();
                targetCtx.moveTo(shieldX + 2, shieldY + 2);
                targetCtx.lineTo(shieldX + shieldWidth - 5, shieldY + 7);
                targetCtx.lineTo(shieldX + shieldWidth - 10, shieldY + 15);
                targetCtx.lineTo(shieldX + 5, shieldY + 10);
                targetCtx.closePath();
                targetCtx.fill();

                targetCtx.fillStyle = '#696969';
                targetCtx.beginPath();
                targetCtx.moveTo(shieldX + 5, shieldY + shieldHeight - 7);
                targetCtx.lineTo(shieldX + shieldWidth - 7, shieldY + shieldHeight - 2);
                targetCtx.lineTo(shieldX + shieldWidth - 12, shieldY + shieldHeight - 8);
                targetCtx.lineTo(shieldX + 10, shieldY + shieldHeight - 12);
                targetCtx.closePath();
                targetCtx.fill();

                targetCtx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
                targetCtx.lineWidth = 1.5;
                targetCtx.beginPath();
                targetCtx.moveTo(shieldX + shieldWidth * 0.7, shieldY + shieldHeight * 0.2);
                targetCtx.lineTo(shieldX + shieldWidth * 0.6, shieldY + shieldHeight * 0.3);
                targetCtx.lineTo(shieldX + shieldWidth * 0.75, shieldY + shieldHeight * 0.4);
                targetCtx.stroke();

                targetCtx.beginPath();
                targetCtx.moveTo(shieldX + shieldWidth * 0.3, shieldY + shieldHeight * 0.8);
                targetCtx.lineTo(shieldX + shieldWidth * 0.4, shieldY + shieldHeight * 0.7);
                targetCtx.stroke();

                targetCtx.restore();
            } else {
                targetCtx.save();
                targetCtx.translate(this.x + 10, this.y + 20);
                targetCtx.fillStyle = skinColor;
                targetCtx.fillRect(0, 0, 15, 6);
                targetCtx.restore();
            }

        } else if (this.name === 'Log Rammer') {
            const playerBodyColor = '#4682B4';
            const aiBodyColor = '#FF6347';
            const bodyColor = this.owner === 'player' ? playerBodyColor : aiBodyColor;
            const skinColor = '#F0C29F';
            const logColor = '#8B4513';
            const figureWidth = 25;
            const figureHeight = 35;
            const logHeight = 15 * 1.3;
            const logWidth = 45 * 2;
            const pullBackDistance = 10;
            const pushForwardDistance = 20;
            let figure1OffsetX = 0, figure2OffsetX = 0, logOffsetX = 0;
            let swayOffsetX = 0;
            const now = Date.now();
            
            if(this.isDying || this.isCorpse){
                const elapsed = now - this.deathAnimationStartTime;
                const progress = this.isDying ? Math.min(elapsed / this.deathAnimationDuration, 1) : 1;

                targetCtx.save();
                targetCtx.translate(this.x + figureWidth / 2, this.y + this.height);
                targetCtx.rotate(this.deathRotation1 * progress);
                targetCtx.translate(-(this.x + figureWidth / 2), -(this.y + this.height));
                targetCtx.fillStyle = bodyColor;
                targetCtx.fillRect(this.x, this.y + this.height - figureHeight, figureWidth, figureHeight);
                targetCtx.fillStyle = skinColor;
                targetCtx.beginPath();
                targetCtx.arc(this.x + figureWidth / 2, this.y + this.height - figureHeight - 5, 8, 0, Math.PI * 2);
                targetCtx.fill();
                targetCtx.restore();

                targetCtx.save();
                targetCtx.translate(this.x + this.width - figureWidth / 2, this.y + this.height);
                targetCtx.rotate(this.deathRotation2 * progress);
                targetCtx.translate(-(this.x + this.width - figureWidth / 2), -(this.y + this.height));
                targetCtx.fillStyle = bodyColor;
                targetCtx.fillRect(this.x + this.width - figureWidth, this.y + this.height - figureHeight, figureWidth, figureHeight);
                targetCtx.fillStyle = skinColor;
                targetCtx.beginPath();
                targetCtx.arc(this.x + this.width - figureWidth / 2, this.y + this.height - figureHeight - 5, 8, 0, Math.PI * 2);
                targetCtx.fill();
                targetCtx.restore();

                const startLogY = this.y + this.height - logHeight - 10;
                const endLogY = canvas.height - groundHeight - logHeight;
                const currentLogY = startLogY + (endLogY - startLogY) * progress;
                targetCtx.fillStyle = logColor;
                targetCtx.fillRect(this.x + (this.width - logWidth) / 2, currentLogY, logWidth, logHeight);

            } else {
                if (this.isAnimatingAttack) {
                    const elapsed = now - this.ramAnimationStartTime;
                    const progress = elapsed / this.ramAnimationTotalDuration;
                    if (progress < 0.25) {
                        const phaseProgress = progress / 0.25;
                        figure1OffsetX = -pullBackDistance * phaseProgress;
                        logOffsetX = -pullBackDistance * 0.5 * phaseProgress;
                    } else if (progress < 0.5) {
                        const phaseProgress = (progress - 0.25) / 0.25;
                        figure1OffsetX = -pullBackDistance;
                        figure2OffsetX = -pullBackDistance * phaseProgress;
                        logOffsetX = -pullBackDistance * 0.5 - (pullBackDistance * 0.5) * phaseProgress;
                    } else if (progress < 1) {
                        const phaseProgress = (progress - 0.5) / 0.5;
                        figure1OffsetX = -pullBackDistance + (pullBackDistance + pushForwardDistance) * phaseProgress;
                        figure2OffsetX = -pullBackDistance + (pullBackDistance + pushForwardDistance) * phaseProgress;
                        logOffsetX = -pullBackDistance + (pullBackDistance + pushForwardDistance) * phaseProgress;
                    }
                } else if (!this.isAttacking) {
                    swayOffsetX = Math.sin(now / 300) * 5;
                }
                const figure1X = this.x + figure1OffsetX;
                const figure1Y = this.y + this.height - figureHeight;
                const figure2X = this.x + this.width - figureWidth + figure2OffsetX;
                const figure2Y = this.y + this.height - figureHeight;
                const logX = this.x + (this.width - logWidth) / 2 + logOffsetX + swayOffsetX;
                const logY = this.y + this.height - logHeight - 10;
                targetCtx.fillStyle = bodyColor;
                targetCtx.fillRect(figure1X, figure1Y, figureWidth, figureHeight);
                targetCtx.fillStyle = skinColor;
                targetCtx.beginPath();
                targetCtx.arc(figure1X + figureWidth / 2, figure1Y - 5, 8, 0, Math.PI * 2);
                targetCtx.fill();
                targetCtx.fillStyle = bodyColor;
                targetCtx.fillRect(figure2X, figure2Y, figureWidth, figureHeight);
                targetCtx.fillStyle = skinColor;
                targetCtx.beginPath();
                targetCtx.arc(figure2X + figureWidth / 2, figure2Y - 5, 8, 0, Math.PI * 2);
                targetCtx.fill();
                targetCtx.fillStyle = logColor;
                targetCtx.fillRect(logX, logY, logWidth, logHeight);
                targetCtx.strokeStyle = '#5C4033';
                targetCtx.lineWidth = 2;
                targetCtx.beginPath();
                targetCtx.moveTo(logX + logWidth * 0.2, logY);
                targetCtx.lineTo(logX + logWidth * 0.2, logY + logHeight);
                targetCtx.moveTo(logX + logWidth * 0.8, logY);
                targetCtx.lineTo(logX + logWidth * 0.8, logY + logHeight);
                targetCtx.stroke();
                targetCtx.fillStyle = skinColor;
                targetCtx.fillRect(figure1X + figureWidth - 5 + swayOffsetX, figure1Y + figureHeight / 2 - 5, 10, 5);
                targetCtx.fillRect(figure2X - 5 + swayOffsetX, figure2Y + figureHeight / 2 - 5, 10, 5);
            }
        } else {
            targetCtx.fillStyle=this.owner==='player'?'blue':'red';
            targetCtx.fillRect(this.x,this.y,this.width,this.height);
        }
        targetCtx.restore();
    }
    update(dt,enemies){
        const now = Date.now();
        this.isUnderAttack = false; 

        if (this.isPoisoned) {
            if (now > this.poisonEndTime) {
                this.isPoisoned = false;
                this.poisonStacks = 0;
            } else if (now - this.lastPoisonTickTime > 500) { 
                const poisonDamage = this.poisonDamagePerTick * this.poisonStacks;
                this.hp -= poisonDamage;
                trackDamageEvents(null, this, poisonDamage);
                this.lastPoisonTickTime = now;
                createBloodSplatter(this.x + this.width / 2, this.y + this.height / 2, 'rgba(0, 255, 0, 0.7)');
            }
        }

        if (this.hp <= 0 && !this.isDying && !this.isDead && !this.isCorpse) {
            this.isDying = true;
            this.deathAnimationStartTime = now;
            this.killedBy = this.lastAttacker;
            this.deathRotation = (Math.random() < 0.5 ? 1 : -1) * (Math.PI / 2);
            
            if (this.name === 'Earth Guardian' || this.name === 'Stone Guard') {
                for(let i = 0; i < 20; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 2 + Math.random() * 3;
                    rockFragments.push(new RockFragment(this.x + this.width / 2, this.y + this.height / 2, Math.cos(angle) * speed, Math.sin(angle) * speed, this.owner));
                }
            } 

            if (this.name === 'Log Rammer') {
                this.deathRotation1 = (Math.random() < 0.5 ? 1 : -1) * (Math.PI / 2);
                this.deathRotation2 = (Math.random() < 0.5 ? 1 : -1) * (Math.PI / 2);
            }

            if (this.owner === 'player') {
                ai.gold += this.goldValue;
                ai.exp += this.expValue;
            } else {
                player.gold += this.goldValue;
                player.exp += this.expValue;
                textPopUps.push(new TextPopUp(this.x + this.width / 2, this.y, `+${this.goldValue}G`, 'yellow'));
                textPopUps.push(new TextPopUp(this.x + this.width / 2, this.y + 20, `+${this.expValue}exp`, '#87CEEB'));
            }
        }

        if (this.isDying) {
            if (now - this.deathAnimationStartTime >= this.deathAnimationDuration) {
                this.isDying = false;
                if (this.name !== 'Earth Guardian' && this.name !== 'Stone Guard') {
                        this.isCorpse = true;
                        this.corpseStartTime = now;
                } else {
                    this.isDead = true;
                }
            }
            return this.isDead;
        }

        if (this.isCorpse) {
            const corpseDuration = 8000;
            if (now - this.corpseStartTime >= corpseDuration) {
                this.isDead = true;
            }
            return this.isDead;
        }

        if (this.isDead) return true;

        if (this.name === 'Falcon Caster') {
            if ((!this.myFalcon || this.myFalcon.isDead) && this.falconRespawnTimer === 0) {
                const cooldown = this.falconGotKill ? 2000 : 5000;
                this.falconRespawnTimer = now + cooldown;
                this.falconGotKill = false; 
            }

            if (this.falconRespawnTimer > 0 && now >= this.falconRespawnTimer) {
                this.isRespawningFalcon = true;
                this.actionStartTime = now;
                this.falconRespawnTimer = 0;
                // Force create a new falcon immediately
                this.myFalcon = new Falcon(this.x, -50, this.owner, this, true);
                falcons.push(this.myFalcon);
                this.isRespawningFalcon = false;
            }

            if (this.isRespawningFalcon) {
                const animDuration = 1500;
                if (now - this.actionStartTime >= animDuration) {
                    this.isRespawningFalcon = false;
                    this.myFalcon = new Falcon(this.x, -50, this.owner, this, true);
                    falcons.push(this.myFalcon);
                }
                return false; 
            }
        }

        if (this.stunned) {
            if (now > this.stunEndTime) {
                this.stunned = false;
            }
            return false;
        }

        if (this.isKnockingBack) {
            const direction = Math.sign(this.knockbackTargetX - this.x);
            const distanceToTarget = Math.abs(this.knockbackTargetX - this.x);
            const knockbackMove = this.knockbackSpeed * dt;

            if (distanceToTarget < knockbackMove) {
                this.x = this.knockbackTargetX;
                this.isKnockingBack = false;
            } else {
                this.x += knockbackMove * direction;
            }
            return false;
        }
        
        if (this.name === 'Earth Guardian') {
            const allUnits = [...player.units, ...ai.units];
            const meleeClubRange = 150; 

            if (this.substate === 'idle' && !this.isAttacking && !this.heldCorpse) {
                let closestCorpse = null;
                let closestDist = 250;
                for (const unit of allUnits) {
                    if (unit.isCorpse && !unit.isBeingTargetedByGuardian) {
                        const dist = Math.hypot(this.x - unit.x, this.y - unit.y);
                        if (dist < closestDist) {
                            closestDist = dist;
                            closestCorpse = unit;
                        }
                    }
                }
                if (closestCorpse) {
                    this.corpseTarget = closestCorpse;
                    this.corpseTarget.isBeingTargetedByGuardian = true;
                    this.substate = 'seekingCorpse';
                }
            } else if (this.substate === 'seekingCorpse') {
                if (!this.corpseTarget || this.corpseTarget.isDead) {
                    this.substate = 'idle';
                } else {
                    const dx = this.corpseTarget.x - this.x;
                    if (Math.abs(dx) < 5) {
                        this.substate = 'pickingUp';
                        this.actionStartTime = now;
                    } else {
                        this.x += Math.sign(dx) * this.speed * gameSpeed;
                    }
                }
                return false;
            } else if (this.substate === 'pickingUp') {
                if (now - this.actionStartTime > 500) {
                    this.heldCorpse = this.corpseTarget;
                    this.corpseTarget.isDead = true;
                    this.corpseTarget = null;
                    this.target = this.findTarget(enemies);
                    if (this.target) {
                        const dist = Math.abs(this.target.x - this.x);
                        if (dist < meleeClubRange) {
                            this.substate = 'clubbing';
                            this.attackCooldown = 700; 
                        } else {
                            this.substate = 'raisingCorpse';
                            this.attackCooldown = 1000;
                        }
                        this.actionStartTime = now;
                    } else {
                        this.substate = 'idle';
                        this.heldCorpse = null; 
                    }
                }
                return false;
            } else if (this.substate === 'clubbing') {
                this.isAnimatingAttack = true;
                if (now - this.actionStartTime > 500) { 
                    if (this.target) this.dealDamage(this.target);
                    this.isAnimatingAttack = false;
                    
                    this.target = this.findTarget(enemies);
                    if (this.target && Math.abs(this.target.x - this.x) < meleeClubRange) {
                        this.actionStartTime = now; 
                    } else {
                        if (this.heldCorpse) {
                            createExplosion(this.x + this.width / 2, this.y + this.height / 2, 'red', 50);
                        }
                        this.heldCorpse = null;
                        this.substate = 'idle';
                        this.target = null;
                    }
                }
                return false;
            } else if (this.substate === 'raisingCorpse') {
                if (now - this.actionStartTime > 500) {
                    this.substate = 'throwing';
                    this.actionStartTime = now;
                }
                return false;
            } else if (this.substate === 'throwing') {
                this.isAnimatingAttack = true;
                if (now - this.actionStartTime > 500) {
                    if (this.target) {
                        projectiles.push(new Projectile(this, this.y - 40, this.target, 50, this.owner, 'corpse', this.heldCorpse.name));
                    }
                    this.heldCorpse = null;
                    this.substate = 'idle';
                    this.isAnimatingAttack = false;
                    this.target = null;
                }
                return false;
            }
        }

        if (this.name === 'Stone Guard' && this.isAnimatingAttack && this.attackType === 'shieldPush') {
            const elapsed = Date.now() - this.lastAttackTime;
            const progress = elapsed / 600;
            const direction = this.owner === 'player' ? 1 : -1;
            if (!this.ramEffectApplied && progress >= 0.7) { // Trigger at 70% instead of 50%
                if(this.target) {
                    this.dealDamage(this.target);
                }
                if (this.target && !this.target.isBase) {
                    const MAX_KNOCKBACK_UNITS = 2;
                    const KNOCKBACK_GROUPING_DISTANCE = 50;

                    const sortedEnemies = [...enemies].sort((a, b) => direction === 1 ? a.x - b.x : b.x - a.x);
                    const targetIndex = sortedEnemies.indexOf(this.target);

                    if (targetIndex !== -1) {
                        const unitsToKnockback = [this.target];
                        for (let i = 1; i < MAX_KNOCKBACK_UNITS; i++) {
                            const nextUnitIndex = targetIndex + i;
                            if (nextUnitIndex < sortedEnemies.length) {
                                const prevUnitInGroup = unitsToKnockback[unitsToKnockback.length - 1];
                                if (Math.abs(sortedEnemies[nextUnitIndex].x - prevUnitInGroup.x) <= KNOCKBACK_GROUPING_DISTANCE) {
                                    unitsToKnockback.push(sortedEnemies[nextUnitIndex]);
                                } else {
                                    break;
                                }
                            }
                        }

                        unitsToKnockback.forEach(unit => {
                            let calculatedTargetX = unit.x + this.knockbackForce * direction;
                            const playerBaseRightEdge = player.baseX + baseWidth;
                            const aiBaseLeftEdge = ai.baseX;
                            if (direction === 1) {
                                unit.knockbackTargetX = Math.min(calculatedTargetX, aiBaseLeftEdge - unit.width);
                            } else {
                                unit.knockbackTargetX = Math.max(calculatedTargetX, playerBaseRightEdge);
                            }
                            unit.isKnockingBack = true;
                            unit.knockbackSpeed = 2;
                            unit.stunned = true;
                            unit.stunEndTime = Date.now() + this.stunDuration;
                        });
                    }
                }
                this.ramEffectApplied = true;
            }
            if (progress >= 1) {
                if (!this.ramPermanentMoveApplied) {
                    const finalX = this.x + 5 * direction; // Stone guard moves forward 5 units
                    const boundary = direction === 1 ? ai.baseX - this.width : player.baseX + baseWidth;
                    this.x = direction === 1 ? Math.min(finalX, boundary) : Math.max(finalX, boundary);
                    this.ramPermanentMoveApplied = true;
                }
                this.isAnimatingAttack = false;
                this.isAttacking = false;
                this.ramEffectApplied = false;
            }
            return false;
        }
        if (this.name === 'Log Rammer' && this.isAnimatingAttack) {
            const elapsed = now - this.ramAnimationStartTime;
            const progress = elapsed / this.ramAnimationTotalDuration;
            const direction = this.owner === 'player' ? 1 : -1;
            if (!this.ramEffectApplied && progress >= 0.5) { 
                if(this.target) {
                    this.dealDamage(this.target);
                }
                let maxAdvance = this.ramPushDistance;
                const safeSpacing = 12;
                const baseBuffer = this.baseCollisionBuffer || 0;
                if (this.target && !this.target.isBase) {
                    const MAX_KNOCKBACK_UNITS = 3;
                    const KNOCKBACK_GROUPING_DISTANCE = 50;
                    
                    const sortedEnemies = [...enemies]
                        .filter(unit => !unit.isDead && !unit.isCorpse && !unit.isKnockingBack)
                        .sort((a, b) => direction === 1 ? a.x - b.x : b.x - a.x);
                    const targetIndex = sortedEnemies.indexOf(this.target);

                    if (targetIndex !== -1) {
                        const unitsToKnockback = [this.target];
                        for (let i = 1; i < MAX_KNOCKBACK_UNITS; i++) {
                            const nextUnitIndex = targetIndex + i;
                            if (nextUnitIndex < sortedEnemies.length) {
                                const prevUnitInGroup = unitsToKnockback[unitsToKnockback.length - 1];
                                if (Math.abs(sortedEnemies[nextUnitIndex].x - prevUnitInGroup.x) <= KNOCKBACK_GROUPING_DISTANCE) {
                                    unitsToKnockback.push(sortedEnemies[nextUnitIndex]);
                                } else {
                                    break;
                                }
                            }
                        }

                        unitsToKnockback.forEach(unit => {
                            let calculatedTargetX = unit.x + this.knockbackForce * direction;
                            const playerBaseRightEdge = player.baseX + baseWidth;
                            const aiBaseLeftEdge = ai.baseX;
                            if (direction === 1) {
                                unit.knockbackTargetX = Math.min(calculatedTargetX, aiBaseLeftEdge - unit.width);
                            } else {
                                unit.knockbackTargetX = Math.max(calculatedTargetX, playerBaseRightEdge);
                            }
                            unit.isKnockingBack = true;
                            unit.knockbackSpeed = 2;
                            unit.stunned = true;
                            unit.stunEndTime = now + this.stunDuration;
                        });

                        const primaryTarget = unitsToKnockback[0];
                        if (primaryTarget) {
                            if (direction === 1) {
                                const targetLimit = primaryTarget.x - safeSpacing - this.width;
                                const distanceToTarget = Math.max(0, targetLimit - this.x);
                                maxAdvance = Math.min(maxAdvance, distanceToTarget);
                            } else {
                                const targetLimit = primaryTarget.x + primaryTarget.width + safeSpacing;
                                const distanceToTarget = Math.max(0, this.x - targetLimit);
                                maxAdvance = Math.min(maxAdvance, distanceToTarget);
                            }
                        }
                    }
                } else if (this.target && this.target.isBase) {
                    const distanceToBase = direction === 1
                        ? Math.max(0, (ai.baseX - baseBuffer - this.width) - this.x)
                        : Math.max(0, this.x - (player.baseX + baseWidth + baseBuffer));
                    maxAdvance = Math.min(maxAdvance, distanceToBase);
                }
                const distanceToBoundary = direction === 1
                    ? Math.max(0, (ai.baseX - baseBuffer - this.width) - this.x)
                    : Math.max(0, this.x - (player.baseX + baseWidth + baseBuffer));
                maxAdvance = Math.min(maxAdvance, distanceToBoundary);
                this.currentRamPushDistance = Math.max(0, maxAdvance);
                this.ramEffectApplied = true;
            }
            if (progress >= 1) {
                if (!this.ramPermanentMoveApplied) {
                    const finalX = this.x + this.currentRamPushDistance * direction;
                    const baseBuffer = this.baseCollisionBuffer || 0;
                    const boundary = direction === 1 ? ai.baseX - this.width - baseBuffer : player.baseX + baseWidth + baseBuffer;
                    this.x = direction === 1 ? Math.min(finalX, boundary) : Math.max(finalX, boundary);
                    this.ramPermanentMoveApplied = true;
                }
                this.isAnimatingAttack = false;
                this.isAttacking = false;
                this.ramEffectApplied = false;
                this.currentRamPushDistance = this.ramPushDistance;
            }
            return false;
        }

        if (this.isAnimatingAttack && this.type === 'ranged' && !this.projectileSpawnedThisAttack && this.target) {
            if (this.target.hp <= 0 || this.target.isDead) {
                this.isAnimatingAttack = false;
                this.target = null;
                return false; 
            }
            const animationDuration = 400;
            const animationProgress = (now - this.lastAttackTime) / animationDuration;

            if (this.name === 'Slinger' && animationProgress >= 0.75) {
                projectiles.push(new Projectile(this, this.y + this.height / 2, this.target, this.damage, this.owner, 'stone'));
                this.projectileSpawnedThisAttack = true;
            }
            if (this.name === 'Blowgunner' && animationProgress >= 0.4 && animationProgress < 0.6) {
                // Calculate the blowgun end position in world coordinates
                const pivotX = this.x + this.width / 2;
                const pivotY = this.y + 4;
                const blowgunLength = 30;
                // Blowgunner has horizontal blowgun, so no rotation needed
                const blowgunEndX = pivotX + blowgunLength;
                const blowgunEndY = pivotY;
                projectiles.push(new Projectile({x: blowgunEndX, y: blowgunEndY}, blowgunEndY, this.target, this.damage, this.owner, 'dart'));
                this.projectileSpawnedThisAttack = true;
            }
        }

        let target = this.findTarget(enemies);
        const spacing = 5; 
        let inRange = false;

        if (target) {
            const dir = this.owner === 'player' ? 1 : -1;
            let distance;
            if (dir === 1) { 
                const targetX = target.isBase ? ai.baseX : target.x;
                distance = targetX - (this.x + this.width);
            } else { 
                const targetWidth = target.isBase ? baseWidth : target.width;
                const targetX = target.isBase ? player.baseX : target.x;
                distance = this.x - (targetX + targetWidth);
            }

            if (distance <= this.range + spacing) {
                inRange = true;
            }
        }

        if (inRange) {
            this.isAttacking = true;
            if (this.name === 'Log Rammer') {
                if (!this.isAnimatingAttack) {
                    if (target.name === 'Log Rammer') {
                        if (this.lastAttackTime <= target.lastAttackTime) {
                            this.ram(target);
                        }
                    } else {
                        this.ram(target);
                    }
                }
            } else {
                this.attack(target);
            }
        } else {
            this.isAttacking = false;
            if (this.isAnimatingAttack && now - this.lastAttackTime > 500) {
                this.isAnimatingAttack = false;
            }
            this.move();
        }
        return this.isDead;
    }
    move(){
        const dir = this.owner === 'player' ? 1 : -1;
        const allies = this.owner === 'player' ? player.units : ai.units;
        const spacing = 10;
        const nextX = this.x + this.speed * gameSpeed * dir;
        const baseBuffer = this.baseCollisionBuffer || 0;

        if (dir === 1 && nextX + this.width >= ai.baseX - baseBuffer) {
            this.x = ai.baseX - this.width - baseBuffer;
            return;
        } else if (dir === -1 && nextX <= player.baseX + baseWidth + baseBuffer) {
            this.x = player.baseX + baseWidth + baseBuffer;
            return;
        }

        for(const ally of allies){
            if(ally === this || ally.isDying || ally.isCorpse) continue;
            if(dir === 1){
                if(ally.x > this.x && (ally.x - (this.x + this.width)) < spacing) return;
            } else {
                if(ally.x < this.x && ((this.x - ally.x) - ally.width) < spacing) return;
            }
        }
        this.x = nextX;
        if (this.name === 'Earth Guardian' || this.name === 'Stone Guard') {
            this.walkCycle = (this.walkCycle + 0.04 * this.speed * gameSpeed) % (Math.PI * 2);
        }
    }
    findTarget(enemies){
        let closest=null,cd=Infinity;
        const enemyFalcons = falcons.filter(f => f.owner !== this.owner);
        const allEnemies = [...enemies, ...enemyFalcons];

        for(const e of allEnemies){
            if(e.isDying || e.isCorpse || (e instanceof Falcon && this.type !== 'ranged')) continue;

            const dist=this.owner==='player'?e.x-this.x:this.x-e.x;
            if(dist>0&&dist<cd){
                cd=dist;
                closest=e;
            }
        }
        const baseX=this.owner==='player'?ai.baseX:player.baseX+baseWidth;
        const bd=Math.abs(baseX-this.x);
        if(bd<cd)closest={x:baseX,y:canvas.height-groundHeight-baseHeight,hp:this.owner==='player'?ai.hp:player.hp,isBase:true,height:baseHeight,width:baseWidth};
        return closest;
    }
    attack(t){
        const now=Date.now();
        if (this.isAnimatingAttack && now - this.lastAttackTime < 500) return;

        const minCooldown = this.attackCooldown * 0.9;
        const maxCooldown = this.attackCooldown * 1.3;
        const randomCooldown = minCooldown + Math.random() * (maxCooldown - minCooldown);
        if(now-this.lastAttackTime>randomCooldown){
            this.lastAttackTime=now;
            this.isAnimatingAttack = true;
            this.projectileSpawnedThisAttack = false; 
            if (this.name === 'Falcon Caster') {
                this.attackType = Math.random() < 0.5 ? 'punch' : 'slam';
            }
            if (this.name === 'Stone Guard' && this.shieldBroken) {
                this.attackType = 'maceSmash'; // Only one attack type now - the stabbing attack
            }
            if (this.name === 'Stone Guard' && !this.shieldBroken) {
                this.attackType = 'shieldPush';
            }
            if (this.type === 'ranged') {
                this.target = t;
            } else {
                if(this.range>20)projectiles.push(new Projectile(this,this.y+this.height/2,t,this.damage,this.owner));
                else {
                    setTimeout(() => this.dealDamage(t), 250); 
                }
            }
        }
    }
    ram(target) {
        const now = Date.now();
        const minCooldown = this.attackCooldown * 0.9;
        const maxCooldown = this.attackCooldown * 1.3;
        const randomCooldown = minCooldown + Math.random() * (maxCooldown - minCooldown);
        if (now - this.lastAttackTime > randomCooldown) {
            this.lastAttackTime = now;
            this.isAnimatingAttack = true;
            this.ramAnimationStartTime = now;
            this.ramEffectApplied = false;
            this.ramPermanentMoveApplied = false;
            this.currentRamPushDistance = this.ramPushDistance;
            this.target = target;
        }
    }
    dealDamage(t){
        if(!t) return;
        
        let currentDamage = this.damage;
        if (this.name === 'Stone Guard' && this.shieldBroken) {
            currentDamage = this.maceDamage;
        }

        // NEW: Apply target's damage reduction
        if (t.damageReduction) {
            currentDamage *= (1 - t.damageReduction);
        }

        if (t.name === 'Stone Guard' && !t.shieldBroken) {
            const shieldDamage = currentDamage;
            if (t.shieldHp > shieldDamage) {
                t.shieldHp -= shieldDamage;
            } else {
                const overflowDamage = shieldDamage - t.shieldHp;
                t.shieldHp = 0;
                t.shieldBroken = true;
                t.speed *= 1.20; 
                t.hp -= overflowDamage;

                // Dramatic shield break animation
                createExplosion(t.x + t.width / 2, t.y + t.height / 2, '#C0C0C0', 80);
                screenShakeMagnitude = 15;

                // Stone guard gets enraged and does extra damage when shield breaks
                if (t.owner === 'player') {
                    player.units.forEach(unit => {
                        if (unit.name === 'Stone Guard' && unit.shieldBroken) {
                            unit.maceDamage = unit.damage * 2; // Double damage when shield broken
                        }
                    });
                } else {
                    ai.units.forEach(unit => {
                        if (unit.name === 'Stone Guard' && unit.shieldBroken) {
                            unit.maceDamage = unit.damage * 2; // Double damage when shield broken
                        }
                    });
                }
            }
            createBloodSplatter(t.x + t.width / 2, t.y + t.height / 2, '#C0C0C0'); 
            t.isUnderAttack = true;
            t.lastAttacker = this;
            return; 
        }
        
        if(t.isBase)this.owner==='player'?ai.hp-=currentDamage:player.hp-=currentDamage;
        else {
            t.hp-=currentDamage;
            createBloodSplatter(t.x + t.width / 2, t.y + t.height / 2);
            t.isUnderAttack = true;
            t.lastAttacker = this;
        }
    }
}

class Projectile{
    constructor(attacker,y,target,damage,owner, type, unitName = null){
        this.x = attacker.x;
        this.y=y;
        this.attacker = attacker; 
        this.target=target;
        this.damage=damage;
        this.owner=owner;
        this.type = type || 'stone';
        this.speed = this.type === 'poison-dart' ? 7 : 5;
        this.width= this.type === 'dart' || this.type === 'poison-dart' ? 15 : 5;
        this.height= this.type === 'dart' || this.type === 'poison-dart' ? 2 : 5;
        this.rotation = 0;
        this.unitName = unitName;
        this.rotationSpeed = this.type === 'corpse' ? 0.1 : 0;
        this.onGround = false;
        this.groundedTime = 0;
    }
    update(){
        if (this.onGround) {
            if (Date.now() - this.groundedTime > 3000) {
                createExplosion(this.x, this.y, 'red', 50);
                return true; 
            }
            return false;
        }

        if (!this.target || this.target.hp <= 0 || this.target.isDead) {
            if (this.type === 'corpse') {
                this.target = { x: this.x, y: canvas.height - groundHeight };
            } else {
                return true; 
            }
        }

        let ty = this.target.y + (this.target.height?this.target.height/2:0);
        let groundY = canvas.height - groundHeight - 20; 
        
        if (this.type === 'corpse') {
            ty = groundY;
        }

        const dx = this.target.x - this.x;
        const dy = ty - this.y;
        
        if (this.type !== 'corpse') {
            this.rotation = Math.atan2(dy, dx);
        } else {
            this.rotation += this.rotationSpeed * gameSpeed;
        }

        const d = Math.hypot(dx, dy);

        if (d < this.speed * gameSpeed || (this.type === 'corpse' && this.y >= groundY)) {
            if (this.type === 'corpse') {
                this.y = groundY;
                createExplosion(this.x, this.y, 'red', 50);
                const enemies = this.owner === 'player' ? ai.units : player.units;
                enemies.forEach(unit => {
                    if (Math.abs(unit.x - this.x) < 50) { 
                        unit.hp -= this.damage;
                    }
                });
                return true; 
            } else {
                this.hit();
                return true;
            }
        }

        this.x += (dx / d) * this.speed * gameSpeed;
        this.y += (dy / d) * this.speed * gameSpeed;
        return false;
    }
    hit(){
        let finalDamage = this.damage;
        
        // NEW: Apply target's damage reduction
        if (this.target.damageReduction) {
            finalDamage *= (1 - this.target.damageReduction);
        }

        if (this.target.name === 'Stone Guard' && !this.target.shieldBroken) {
            const shieldDamage = finalDamage;
            if (this.target.shieldHp > shieldDamage) {
                this.target.shieldHp -= shieldDamage;
            } else {
                const overflowDamage = shieldDamage - this.target.shieldHp;
                this.target.shieldHp = 0;
                this.target.shieldBroken = true;
                this.target.speed *= 1.20; 
                this.target.hp -= overflowDamage;
            }
            createBloodSplatter(this.target.x + this.target.width / 2, this.target.y + this.target.height / 2, '#C0C0C0'); 
            this.target.isUnderAttack = true;
            this.target.lastAttacker = this.attacker;
            return; 
        }
        
        if (this.type === 'poison-dart') {
            if (this.target && !this.target.isBase) {
                const effect = defenseSettings['poison-blower'];
                this.target.hp -= finalDamage; 
                this.target.isPoisoned = true;
                this.target.poisonDamagePerTick = effect.poisonDamage;
                this.target.poisonEndTime = Date.now() + effect.poisonDuration;
                this.target.lastPoisonTickTime = Date.now();
                this.target.poisonStacks = (this.target.poisonStacks || 0) + 1;
            }
            return;
        }

        if(this.target.isBase)this.owner==='player'?ai.hp-=finalDamage:player.hp-=finalDamage;
        else {
            this.target.hp-=finalDamage;
            createBloodSplatter(this.target.x + this.target.width / 2, this.target.y + this.target.height / 2);
            this.target.isUnderAttack = true;
            this.target.lastAttacker = this.attacker; 
        }
    }
    
    drawCorpse(unitName) {
        const enemyOwner = this.owner === 'player' ? 'ai' : 'player';
        const unitConfig = ageSettings[1].units.find(u => u.name === unitName) || ageSettings[2].units.find(u => u.name === unitName);
        if (unitConfig) {
            const tempUnit = new Unit(unitConfig, enemyOwner);
            tempUnit.x = -tempUnit.width / 2;
            tempUnit.y = -tempUnit.height / 2;
            tempUnit.isDying = false;
            tempUnit.isCorpse = false;
            tempUnit.draw();
        }
    }

    draw(){
        ctx.save();
        ctx.translate(this.x, this.y);
        if (this.onGround) {
            this.rotation = 0; 
        }
        ctx.rotate(this.rotation);
        
        if (this.type === 'dart' || this.type === 'poison-dart') {
            const shaftColor = this.type === 'poison-dart' ? '#556B2F' : '#8B4513';
            const headColor = this.type === 'poison-dart' ? '#6B8E23' : '#C0C0C0';
            const fletchingColor = this.type === 'poison-dart' ? '#3CB371' : '#FFFFFF';

            ctx.fillStyle = shaftColor;
            ctx.fillRect(0, -1, this.width, this.height);
            ctx.fillStyle = headColor;
            ctx.beginPath();
            ctx.moveTo(this.width, 0);
            ctx.lineTo(this.width - 5, -3);
            ctx.lineTo(this.width - 5, 3);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = fletchingColor;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-5, -4);
            ctx.lineTo(-5, 4);
            ctx.closePath();
            ctx.fill();
        } else if (this.type === 'corpse' && this.unitName) {
            this.drawCorpse(this.unitName);
        } else {
            ctx.fillStyle='#808080';
            ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        }
        ctx.restore();
    }
}

function resizeCanvas(){
    canvas.width=gameContainer.clientWidth;
    canvas.height=gameContainer.clientHeight;
    worldWidth=canvas.width*5; 
    const safeZone = canvas.width * 0.5;
    player.baseX = safeZone;
    ai.baseX = worldWidth - baseWidth - safeZone;

    mountainPeaks = [
        { x: worldWidth * 0.15, y: canvas.height - groundHeight - 200 },
        { x: worldWidth * 0.45, y: canvas.height - groundHeight - 250 },
        { x: worldWidth * 0.8, y: canvas.height - groundHeight - 280 }
    ];
    
    stars = [];
    for (let i = 0; i < 100; i++) {
        stars.push({
            x: Math.random() * worldWidth,
            y: Math.random() * canvas.height * 0.7,
            size: Math.random() * 2 + 0.5,
            opacity: Math.random() * 0.5 + 0.5
        });
    }
}

function setupUI(){
detailedUnitButtonsContainer.innerHTML='';
detailedDefenseButtonsContainer.innerHTML='';
detailedStructuresButtonsContainer.innerHTML = ''; 

ageSettings[player.age].units.forEach((cfg,i)=>{
const btn=document.createElement('button');
btn.className='unit-btn';
btn.innerText=`${cfg.name} (${cfg.cost}G)`;
btn.onclick=()=>{ if (isPaused) return; spawnUnit('player',i); };
btn.dataset.unitIndex = i;
btn.dataset.cooldown='spawn';
const overlay=document.createElement('div');
overlay.className='cooldown-overlay';
btn.appendChild(overlay);
detailedUnitButtonsContainer.appendChild(btn);
});

if (player.age === 2) {
if (player.specialUnitUnlocked) {
const specialUnitConfig = ageSettings[2].specialUnits.find(u => u.name === player.chosenSpecialUnit);
const btn = document.createElement('button');
btn.className = 'unit-btn';
btn.innerText = `${specialUnitConfig.name} (${specialUnitConfig.cost}G)`;
btn.onclick = () => { if (isPaused) return; spawnSpecialUnit('player', player.chosenSpecialUnit); };
btn.dataset.specialUnit = player.chosenSpecialUnit;
btn.dataset.cooldown='spawn';
const overlay=document.createElement('div');
overlay.className='cooldown-overlay';
btn.appendChild(overlay);
detailedUnitButtonsContainer.appendChild(btn);
} else {
const btn = document.createElement('button');
btn.className = 'unit-btn';
btn.innerHTML = `&#128274; Unlock Specialist (${SPECIAL_UNIT_UNLOCK_COST} Exp)`;
btn.onclick = () => { if (isPaused) return; showSpecialUnitChoice(); };
detailedUnitButtonsContainer.appendChild(btn);
}
}

const gunDef = defenseSettings['gun'];
const gunBtn = document.createElement('button');
gunBtn.className = 'unit-btn';
gunBtn.innerText = `${gunDef.name} (${gunDef.cost}G)`;
gunBtn.onclick = () => { if (isPaused) return; purchaseDefense('player', 'gun'); };
gunBtn.id = 'gun-defense-btn';
detailedDefenseButtonsContainer.appendChild(gunBtn);

if (player.age >= 2) {
const poisonDef = defenseSettings['poison-blower'];
const poisonBtn = document.createElement('button');
poisonBtn.className = 'unit-btn';
poisonBtn.innerText = `${poisonDef.name} (${poisonDef.cost}G)`;
poisonBtn.onclick = () => { if (isPaused) return; purchaseDefense('player', 'poison-blower'); };
poisonBtn.id = 'poison-blower-defense-btn';
detailedDefenseButtonsContainer.appendChild(poisonBtn);
}

mainStructuresMenuBtn.style.display = player.age >= 2 ? 'flex' : 'none';
if (player.age >= 2) {
const tableCfg = structureSettings['ancient-crafting-table'];
const btn = document.createElement('button');
btn.className = 'unit-btn';
btn.innerText = `${tableCfg.name} (${tableCfg.cost}G)`;
btn.onclick = () => { if (isPaused) return; startPlacingStructure('ancient-crafting-table'); };
detailedStructuresButtonsContainer.appendChild(btn);
}

ageUpBtn.innerText=`Age Up (Cost: ${ageSettings[player.age].ageUpCost} Exp)`;
mainControlsContainer.style.display = 'none';
detailedUnitControls.style.display = 'none';
detailedDefenseControls.style.display = 'none';
detailedStructuresControls.style.display = 'none'; 

if (currentMenuState === 'main') {
mainControlsContainer.style.display = 'flex';
} else if (currentMenuState === 'units') {
detailedUnitControls.style.display = 'flex';
} else if (currentMenuState === 'defenses') {
detailedDefenseControls.style.display = 'flex';
} else if (currentMenuState === 'structures') { 
detailedStructuresControls.style.display = 'flex';
}
    detailedDefenseControls.style.display = 'none';
    detailedStructuresControls.style.display = 'none'; 

    if (currentMenuState === 'main') {
        mainControlsContainer.style.display = 'flex';
    } else if (currentMenuState === 'units') {
        detailedUnitControls.style.display = 'flex';
    } else if (currentMenuState === 'defenses') {
        detailedDefenseControls.style.display = 'flex';
    } else if (currentMenuState === 'structures') { 
        detailedStructuresControls.style.display = 'flex';
    }
}

function toggleMenu(menu) {
    currentMenuState = menu;
    if (isPlacingStructure && menu !== 'none') {
        isPlacingStructure = false;
        structureToPlace = null;
        placementStations = [];
    }
    setupUI();
    updateUI();
}

function purchaseDefense(owner, defenseType) {
    const ent = owner === 'player' ? player : ai;
    const defCfg = defenseSettings[defenseType];
    if (ent.gold >= defCfg.cost) {
        if (defenseType === 'gun' && !ent.hasGun) {
            ent.gold -= defCfg.cost;
            ent.hasGun = true;
        } else if (defenseType === 'poison-blower' && !ent.hasPoisonBlower) {
            ent.gold -= defCfg.cost;
            ent.hasPoisonBlower = true;
        }
        updateUI();
    }
}

function updateBattlePressure(now) {
    const dangerRange = 220;
    const activePlayerUnits = player.units.filter(unit => !unit.isDying && !unit.isCorpse);
    const activeAiUnits = ai.units.filter(unit => !unit.isDying && !unit.isCorpse);

    playerIsPressuringAi = activePlayerUnits.some(unit => (ai.baseX - (unit.x + unit.width)) <= dangerRange);
    aiIsPressuringPlayer = activeAiUnits.some(unit => (unit.x - (player.baseX + baseWidth)) <= dangerRange);

    if (playerIsPressuringAi) {
        lastPlayerPressureTime = now;
    }

    if (aiIsPressuringPlayer) {
        lastAiPressureTime = now;
    }

    if (aiIsPressuringPlayer) {
        aiShouldHoldSpawns = true;
    } else if (now - lastAiPressureTime > 4000) {
        aiShouldHoldSpawns = false;
    }
}

function handleAiEmergencyDefense(now) {
    const emergencyWindow = 3500;
    const cooldown = 8000;
    if (now - lastPlayerPressureTime > emergencyWindow) return;
    if (now - lastAiEmergencyDefenseTime < cooldown) return;

    const closeThreat = player.units.filter(unit => !unit.isDying && !unit.isCorpse)
        .some(unit => (ai.baseX - (unit.x + unit.width)) < 160);
    if (!closeThreat) return;

    const aiLosing = ai.units.filter(unit => !unit.isDying && !unit.isCorpse).length + 1 < player.units.filter(unit => !unit.isDying && !unit.isCorpse).length
        || ai.hp < player.hp;
    if (!aiLosing) return;

    if (ai.age >= 2 && !ai.hasPoisonBlower && ai.gold >= defenseSettings['poison-blower'].cost) {
        purchaseDefense('ai', 'poison-blower');
        lastAiEmergencyDefenseTime = now;
        return;
    }

    if (!ai.hasGun && ai.gold >= defenseSettings['gun'].cost) {
        purchaseDefense('ai', 'gun');
        lastAiEmergencyDefenseTime = now;
    }
}

function aiHasCraftingTable() {
    return ai.structures.some(struct => struct.name === 'Ancient Crafting Table');
}

function isSpotFree(x, y, width, height) {
    const allStructures = [...player.structures, ...ai.structures];
    return allStructures.every(struct => {
        const noOverlap = x + width <= struct.x || struct.x + struct.width <= x || y + height <= struct.y || struct.y + struct.height <= y;
        return noOverlap;
    });
}

function getAiPlacementSpots(structureCfg) {
    const spots = [];
    const stationWidth = structureCfg.width;
    const stationHeight = structureCfg.height;
    const startX = ai.baseX + baseWidth + 20;
    const y = canvas.height - groundHeight - stationHeight;
    for (let i = 0; i < 8; i++) {
        const x = startX + i * (stationWidth + 10);
        if (x + stationWidth <= worldWidth - 20) {
            spots.push({ x, y, width: stationWidth, height: stationHeight });
        }
    }
    return spots;
}

function placeStructureForAi(structureName) {
    const cfg = structureSettings[structureName];
    if (!cfg) return false;
    if (structureName === 'ancient-crafting-table' && ai.age < 2) return false;
    if (ai.gold < cfg.cost) return false;
    const spots = getAiPlacementSpots(cfg).filter(spot => isSpotFree(spot.x, spot.y, spot.width, spot.height));
    if (spots.length === 0) return false;
    const chosenSpot = spots[Math.floor(Math.random() * spots.length)];
    ai.gold -= cfg.cost;
    const structure = new Structure(cfg, 'ai', chosenSpot.x, chosenSpot.y);
    ai.structures.push(structure);
    if (structureName === 'ancient-crafting-table') {
        ai.incomeMultiplier = 1.4;
    }
    updateUI();
    return true;
}

function evaluateCraftingItemValue(effect = {}) {
    const hpValue = (effect.hp || 0);
    const damageValue = (effect.damage || 0) * 5;
    const attackSpeedValue = (effect.attackSpeed || 0) * 150;
    const damageReductionValue = (effect.damageReduction || 0) * 1200;
    return hpValue + damageValue + attackSpeedValue + damageReductionValue;
}

function aiPurchaseBestUpgrade(unitName, category) {
    if (!aiHasCraftingTable()) return false;
    const categoryItems = craftingSettings[unitName]?.[category];
    if (!categoryItems || categoryItems.length === 0) return false;
    const currentItem = ai.craftingLevels?.[unitName]?.[category];
    const currentConfig = currentItem ? categoryItems.find(item => item.name === currentItem) : null;
    const affordable = categoryItems
        .filter(item => item.name !== currentItem && ai.gold >= item.goldCost && ai.exp >= item.expCost)
        .filter(item => !currentConfig || item.goldCost > currentConfig.goldCost)
        .sort((a, b) => {
            const diff = evaluateCraftingItemValue(b.effect) - evaluateCraftingItemValue(a.effect);
            if (diff !== 0) return diff;
            return a.goldCost - b.goldCost;
        });
    if (affordable.length === 0) return false;

    const chosen = affordable[0];
    ai.gold -= chosen.goldCost;
    ai.exp -= chosen.expCost;
    if (!ai.craftingLevels[unitName]) {
        ai.craftingLevels[unitName] = {};
    }
    ai.craftingLevels[unitName][category] = chosen.name;

    ai.units.forEach(unit => {
        if (unit.name === unitName) {
            unit.applyCraftingUpgrades();
        }
    });
    updateUI();
    return true;
}

function handleAiStalemateActions(now) {
    const stalemateDuration = 20000;
    const cooldown = 15000;
    if (now - lastPlayerPressureTime < stalemateDuration) return;
    if (now - lastAiPressureTime < stalemateDuration) return;
    if (now - lastAiStalemateActionTime < cooldown) return;

    let actionTaken = false;

    if (!aiHasCraftingTable()) {
        const placed = placeStructureForAi('ancient-crafting-table');
        if (placed) {
            actionTaken = true;
        }
    }

    const unitsToUpgrade = ['Axeman', 'Blowgunner'];
    const categories = ['head', 'chest', 'weapon'];
    unitsToUpgrade.forEach(unitName => {
        categories.forEach(category => {
            if (aiPurchaseBestUpgrade(unitName, category)) {
                actionTaken = true;
            }
        });
    });

    if (actionTaken) {
        lastAiStalemateActionTime = now;
    }
}

function handleAiOffensiveUpgrades(now) {
    if (!aiShouldHoldSpawns) return;
    const cooldown = 4000;
    if (now - lastAiOffensiveInvestmentTime < cooldown) return;

    let actionTaken = false;

    if (ai.age >= 2 && !aiHasCraftingTable()) {
        if (placeStructureForAi('ancient-crafting-table')) {
            actionTaken = true;
        }
    }

    const unitsToUpgrade = ['Axeman', 'Blowgunner'];
    const categories = ['weapon', 'chest', 'head'];
    unitsToUpgrade.forEach(unitName => {
        categories.forEach(category => {
            if (aiPurchaseBestUpgrade(unitName, category)) {
                actionTaken = true;
            }
        });
    });

    if (actionTaken) {
        lastAiOffensiveInvestmentTime = now;
    }
}

function updateUI(){
    const now = Date.now();
    playerGoldEl.textContent=Math.floor(player.gold);
    playerExpEl.textContent=Math.floor(player.exp);
    playerAgeEl.textContent = ageSettings[player.age].name;
    aiGoldEl.textContent=Math.floor(ai.gold);
    aiExpEl.textContent=Math.floor(ai.exp);
    aiAgeEl.textContent = ageSettings[ai.age].name;
    const curUnitAgeSettings=ageSettings[player.age].units;
    const timeSinceSpawn = now - player.lastSpawnTime;
    const spawnOnCooldown = timeSinceSpawn < spawnCooldown;
    const spawnProgress = spawnOnCooldown ? Math.min(Math.max(timeSinceSpawn / spawnCooldown, 0), 1) : 1;
    Array.from(detailedUnitButtonsContainer.children).forEach((btn,i) => {
        if (btn.innerText.includes('Unlock Specialist')) {
            btn.disabled = player.exp < SPECIAL_UNIT_UNLOCK_COST;
        } else if (player.age === 2 && player.specialUnitUnlocked && btn.dataset.specialUnit === player.chosenSpecialUnit) {
            const specialUnitConfig = ageSettings[2].specialUnits.find(u => u.name === player.chosenSpecialUnit);
            btn.disabled = player.gold < specialUnitConfig.cost || spawnOnCooldown;
        } else if (curUnitAgeSettings[i]) {
            btn.disabled = player.gold < curUnitAgeSettings[i].cost || spawnOnCooldown;
        }

        const overlay = btn.querySelector('.cooldown-overlay');
        if (overlay) {
            if (spawnOnCooldown && btn.dataset.cooldown === 'spawn') {
                overlay.style.width = `${(1 - spawnProgress) * 100}%`;
            } else {
                overlay.style.width = '0%';
            }
        }
    });

    const gunBtn = document.getElementById('gun-defense-btn');
    if (gunBtn) {
        const gunDef = defenseSettings['gun'];
        gunBtn.disabled = player.gold < gunDef.cost || player.hasGun;
    }

    const poisonBtn = document.getElementById('poison-blower-defense-btn');
    if (poisonBtn) {
        const poisonDef = defenseSettings['poison-blower'];
        poisonBtn.disabled = player.gold < poisonDef.cost || player.hasPoisonBlower;
    }

    Array.from(detailedStructuresButtonsContainer.children).forEach(btn => {
        const tableCfg = structureSettings['ancient-crafting-table'];
        if (btn.innerText.includes(tableCfg.name)) {
            btn.disabled = player.gold < tableCfg.cost;
        }
    });

    ageUpBtn.disabled = player.exp < ageSettings[player.age].ageUpCost;

    const rockslideCooldown = 70000 / gameSpeed;
    const rockslideOverlay = rockslideBtn.querySelector('.cooldown-overlay');
    const timeSinceRockslide = now - player.lastRockslideTime;

    if (timeSinceRockslide < rockslideCooldown) {
        rockslideBtn.disabled = true;
        const progress = timeSinceRockslide / rockslideCooldown;
        rockslideOverlay.style.width = `${(1 - progress) * 100}%`;
    } else {
        rockslideBtn.disabled = false;
        rockslideOverlay.style.width = '0%';
    }
}

function spawnUnit(owner,i){
    const ent=owner==='player'?player:ai;
    const now=Date.now();
    if(now-ent.lastSpawnTime<spawnCooldown)return;
    const cfg=ageSettings[ent.age].units[i];
    if(ent.gold>=cfg.cost){
        ent.gold-=cfg.cost;
        const newUnit = new Unit(cfg,owner);
        ent.units.push(newUnit);
        ent.lastSpawnTime=now;

        if (owner === 'player' && cfg.name) {
            ai.strategy.playerUnitProduction[cfg.name]++;
        }
    }
}

function spawnSpecialUnit(owner, unitName) {
    const ent = owner === 'player' ? player : ai;
    const now = Date.now();
    if (now - ent.lastSpawnTime < spawnCooldown) return;
    const cfg = ageSettings[ent.age].specialUnits.find(u => u.name === unitName);
    if (ent.gold >= cfg.cost) {
        ent.gold -= cfg.cost;
        const newUnit = new Unit(cfg, owner);
        ent.units.push(newUnit);
        ent.lastSpawnTime = now;
        if (owner === 'player') {
            ai.strategy.playerUnitProduction[cfg.name]++;
        }
    }
}

function ageUp(){
    const cost=ageSettings[player.age].ageUpCost;
    if(player.exp>=cost&&ageSettings[player.age+1]){
        player.exp-=cost;
        player.age++;
        setupUI();
    }
}

function activateRockslide(owner) {
    const cooldown = 70000 / gameSpeed;
    const duration = 10000 / gameSpeed;
    const now = Date.now();
    const entity = owner === 'player' ? player : ai;

    if (now - entity.lastRockslideTime > cooldown) {
        entity.lastRockslideTime = now;
        entity.rockslideEndTime = now + duration;
        entity.lastRockWaveTime = 0;
        screenShakeMagnitude = 10;
    }
}

function assessThreatAndSetMode() {
    const now = Date.now();
    if (now - ai.lastModeChange < 5000) return;

    const threatDistance = worldWidth / 3;
    let threatScore = 0;
    player.units.forEach(unit => {
        const distance = ai.baseX - (unit.x + unit.width);
        if (distance < threatDistance) {
            threatScore += (unit.cost + unit.hp / 10) * (1 - distance / threatDistance);
        }
    });

    if (threatScore > 300) {
        ai.mode = 'defensive';
    } else if (threatScore < 50 && ai.units.length > player.units.length + 2) {
        ai.mode = 'aggressive';
    } else {
        ai.mode = 'passive';
    }
    ai.lastModeChange = now;
}

function aiLogic(){
    // Double gold gain if AI is Age 2 or higher, scaled by game speed
    const baseGain = (ai.age >= 2 ? 0.1 : 0.05);
    const goldGain = baseGain * ai.incomeMultiplier * gameSpeed;
    ai.gold += goldGain;

    assessThreatAndSetMode();
    const now = Date.now();
    updateBattlePressure(now);
    handleAiEmergencyDefense(now);
    handleAiStalemateActions(now);
    handleAiOffensiveUpgrades(now);
    
    switch (ai.mode) {
        case 'passive':
            passiveStrategy(now);
            break;
        case 'aggressive':
            aggressiveStrategy(now);
            break;
        case 'defensive':
            defensiveStrategy(now);
            break;
    }
    
    const ageUpCost = ageSettings[ai.age].ageUpCost;
    if (ai.exp >= ageUpCost && ageSettings[ai.age + 1] && ai.mode !== 'defensive') {
       ai.exp -= ageUpCost;
       ai.age++;
    }

    if (ai.age === 2 && !ai.specialUnitUnlocked && ai.exp >= SPECIAL_UNIT_UNLOCK_COST) {
        ai.exp -= SPECIAL_UNIT_UNLOCK_COST;
        ai.specialUnitUnlocked = true;
        ai.chosenSpecialUnit = Math.random() < 0.5 ? 'Falcon Caster' : 'Earth Guardian';
    }
}

function passiveStrategy(now) {
    if (aiShouldHoldSpawns) return;
    if (now - ai.lastSpawnTime < spawnCooldown * 2) return;
    
    const cheapestUnit = ageSettings[ai.age].units.reduce((prev, curr) => prev.cost < curr.cost ? prev : curr);
    if (ai.gold >= cheapestUnit.cost * 3) {
        const unitIndex = ageSettings[ai.age].units.findIndex(u => u.name === cheapestUnit.name);
        spawnUnit('ai', unitIndex);
    }
    
    if (!ai.hasGun && ai.gold > 150) {
        purchaseDefense('ai', 'gun');
    }
    if (ai.age >= 2 && !ai.hasPoisonBlower && ai.gold > defenseSettings['poison-blower'].cost * 1.5) {
        purchaseDefense('ai', 'poison-blower');
    }
}

function aggressiveStrategy(now) {
    if (aiShouldHoldSpawns) return;
    if (now - ai.lastSpawnTime < spawnCooldown) return;

    if (ai.specialUnitUnlocked) {
        const specialUnitConfig = ageSettings[2].specialUnits.find(u => u.name === ai.chosenSpecialUnit);
        if (ai.gold >= specialUnitConfig.cost) {
            spawnSpecialUnit('ai', ai.chosenSpecialUnit);
            return;
        }
    }

    const availableUnits = ageSettings[ai.age].units.filter(u => u.cost <= ai.gold).sort((a,b) => b.cost - a.cost);
    
    if (availableUnits.length > 0) {
        const unitIndex = ageSettings[ai.age].units.findIndex(u => u.name === availableUnits[0].name);
        spawnUnit('ai', unitIndex);
    }

    if (ai.exp >= 150) {
        activateRockslide('ai');
    }
}

function defensiveStrategy(now) {
    if (aiShouldHoldSpawns) return;
    if (!ai.hasGun && ai.gold >= defenseSettings.gun.cost) {
        purchaseDefense('ai', 'gun');
        return; 
    }
    if (ai.age >= 2 && !ai.hasPoisonBlower && ai.gold >= defenseSettings['poison-blower'].cost) {
        purchaseDefense('ai', 'poison-blower');
        return;
    }

    if (now - ai.lastSpawnTime < spawnCooldown * 1.5) return; 

    let dominantPlayerType = null;
    let maxCount = 0;
    for (const unitName in ai.strategy.playerUnitProduction) {
        const count = ai.strategy.playerUnitProduction[unitName];
        if (count > maxCount) {
            maxCount = count;
            const unitInfo = [...ageSettings[1].units, ...ageSettings[2].units, ...ageSettings[2].specialUnits].find(u => u.name === unitName);
            if (unitInfo) {
                dominantPlayerType = unitInfo.type;
            }
        }
    }

    let unitToBuild = null;

    if (dominantPlayerType) {
        const allAvailableUnits = [...ageSettings[ai.age].units];
        if (ai.specialUnitUnlocked) {
            allAvailableUnits.push(ageSettings[2].specialUnits.find(u => u.name === ai.chosenSpecialUnit));
        }
        const counterUnit = allAvailableUnits.find(u => u.counters === dominantPlayerType && u.cost <= ai.gold);
        if (counterUnit) {
            unitToBuild = counterUnit;
        }
    }

    if (!unitToBuild) {
        const strongestAffordable = [...ageSettings[ai.age].units]
            .filter(u => u.cost <= ai.gold)
            .sort((a, b) => b.cost - a.cost)[0]; 
        if (strongestAffordable) {
            unitToBuild = strongestAffordable;
        }
    }

    if (unitToBuild) {
        if (unitToBuild.name === ai.chosenSpecialUnit) {
            spawnSpecialUnit('ai', unitToBuild.name);
        } else {
            const unitIndex = ageSettings[ai.age].units.findIndex(u => u.name === unitToBuild.name);
            if (unitIndex !== -1) {
                spawnUnit('ai', unitIndex);
            }
        }
    }
}

function panCamera(){
    if(panLeftBtnDown || panLeftKeyDown) {
        cameraX = Math.max(cameraX - doublePanSpeed, 0);
    } else if(panRightBtnDown || panRightKeyDown) {
        cameraX = Math.min(cameraX + doublePanSpeed, worldWidth - canvas.width);
    } else if(mouseX < panEdgeThreshold) {
        cameraX = Math.max(cameraX - panSpeed, 0);
    } else if(mouseX > canvas.width - panEdgeThreshold) {
        cameraX = Math.min(cameraX + doublePanSpeed, worldWidth - canvas.width);
    }
}

function drawTree(x, y) {
    ctx.fillStyle = '#5C4033';
    ctx.fillRect(x - 8, y - 50, 16, 50);
    const foliageColors = ['#0A3D0A', '#1A521A', '#228B22'];
    const layerHeight = 30;
    const baseWidth = 60;
    for (let i = 0; i < 3; i++) {
        ctx.fillStyle = foliageColors[i];
        ctx.beginPath();
        const currentWidth = baseWidth - (i * 15);
        const currentY = y - 50 - (i * (layerHeight - 10));
        ctx.moveTo(x, currentY - layerHeight);
        ctx.lineTo(x - currentWidth / 2, currentY);
        ctx.lineTo(x + currentWidth / 2, currentY);
        ctx.closePath();
        ctx.fill();
    }
}

function drawDefenders(owner) {
    const entity = owner === 'player' ? player : ai;
    const isPlayerBase = owner === 'player';
    
    const defenderTypes = [];
    if (entity.hasGun) defenderTypes.push('gun');
    if (entity.hasPoisonBlower && entity.age >= 2) defenderTypes.push('poison-blower');

    if (defenderTypes.length === 0) return;

    const scaleFactor = 0.7;
    
    defenderTypes.forEach((type, index) => {
        let holeCenterX, holeCenterY, holeRadiusX, holeRadiusY;

        if (entity.age === 1) {
            const mudBodyWidth = baseWidth + 30;
            const mudBodyX = entity.baseX - 15;
            const mudBodyHeight = 80;
            const mudBodyTopY = canvas.height - groundHeight - mudBodyHeight;
            holeRadiusX = 20 * scaleFactor;
            holeRadiusY = 30 * scaleFactor;
            holeCenterY = mudBodyTopY + mudBodyHeight / 2 - 20;
            if (isPlayerBase) {
                holeCenterX = mudBodyX + mudBodyWidth - holeRadiusX - 10;
            } else {
                holeCenterX = mudBodyX + holeRadiusX + 10;
            }
        } else { // Age 2+
            const hutBodyWidth = (baseWidth + 60) * 1.1;
            const hutBodyHeight = 120 * 1.3;
            const hutBodyX = entity.baseX - (hutBodyWidth - baseWidth) / 2;
            const hutBodyTopY = canvas.height - groundHeight - hutBodyHeight;
            holeRadiusX = 20 * scaleFactor;
            holeRadiusY = 30 * scaleFactor;
            
            const yOffset = (defenderTypes.length > 1 && index === 1) ? (holeRadiusY * 2.2) : 0;
            holeCenterY = hutBodyTopY + hutBodyHeight / 3 + yOffset;
            
            const adjustment = hutBodyWidth * 0.20; 
            if (isPlayerBase) {
                holeCenterX = hutBodyX + hutBodyWidth - holeRadiusX - 15 - adjustment;
            } else {
                holeCenterX = hutBodyX + holeRadiusX + 15 + adjustment;
            }
        }

        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.ellipse(holeCenterX, holeCenterY, holeRadiusX, holeRadiusY, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.beginPath();
        ctx.ellipse(holeCenterX, holeCenterY, holeRadiusX, holeRadiusY, 0, 0, Math.PI * 2);
        ctx.clip();

        const unitWidth = 30 * scaleFactor;
        const unitHeight = 40 * scaleFactor;
        const unitX = holeCenterX - unitWidth / 2;
        const unitY = holeCenterY + holeRadiusY - unitHeight * 0.7;
        
        ctx.save();
        if (!isPlayerBase) {
            ctx.translate(unitX + unitWidth / 2, unitY + unitHeight / 2);
            ctx.scale(-1, 1);
            ctx.translate(-(unitX + unitWidth / 2), -(unitY + unitHeight / 2));
        }

        if (type === 'gun') {
            const slingerBodyColor = isPlayerBase ? '#00008B' : '#8B0000';
            const skinColor = '#F0C29F';
            const slingColor = '#8B4513';
            const stoneColor = '#808080';

            ctx.fillStyle = skinColor;
            ctx.beginPath();
            ctx.arc(unitX + unitWidth / 2, unitY + (8 * scaleFactor), (8 * scaleFactor), 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = slingerBodyColor;
            ctx.beginPath();
            ctx.moveTo(unitX + unitWidth / 2, unitY + (15 * scaleFactor));
            ctx.lineTo(unitX + (5 * scaleFactor), unitY + unitHeight * 0.7);
            ctx.lineTo(unitX + unitWidth - (5 * scaleFactor), unitY + unitHeight * 0.7);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = skinColor;
            ctx.fillRect(unitX + unitWidth - (10 * scaleFactor), unitY + (10 * scaleFactor), (5 * scaleFactor), (15 * scaleFactor));
            ctx.fillRect(unitX + unitWidth - (5 * scaleFactor), unitY + (15 * scaleFactor), (10 * scaleFactor), (5 * scaleFactor));
            ctx.strokeStyle = slingColor;
            ctx.lineWidth = 2 * scaleFactor;
            ctx.beginPath();
            ctx.moveTo(unitX + unitWidth + (5 * scaleFactor), unitY + (17.5 * scaleFactor));
            ctx.lineTo(unitX + unitWidth + (15 * scaleFactor), unitY + (10 * scaleFactor));
            ctx.lineTo(unitX + unitWidth + (15 * scaleFactor), unitY + (25 * scaleFactor));
            ctx.lineTo(unitX + unitWidth + (5 * scaleFactor), unitY + (17.5 * scaleFactor));
            ctx.stroke();
            ctx.fillStyle = stoneColor;
            ctx.beginPath();
            ctx.arc(unitX + unitWidth + (15 * scaleFactor), unitY + (17.5 * scaleFactor), (4 * scaleFactor), 0, Math.PI * 2);
            ctx.fill();
        } else if (type === 'poison-blower') {
            const bodyColor = isPlayerBase ? '#8B4513' : '#5C4033';
            const skinColor = '#F0C29F';
            const weaponColor = '#FFFF00';
            const blowpipeLength = 30 * 2.0 * scaleFactor; 

            ctx.fillStyle = bodyColor;
            ctx.beginPath();
            ctx.moveTo(unitX + unitWidth / 2, unitY + (5 * scaleFactor));
            ctx.lineTo(unitX + (5 * scaleFactor), unitY + unitHeight);
            ctx.lineTo(unitX + unitWidth - (5 * scaleFactor), unitY + unitHeight);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = skinColor;
            ctx.beginPath();
            ctx.arc(unitX + unitWidth / 2, unitY, 8 * scaleFactor, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = skinColor;
            ctx.fillRect(unitX + (5 * scaleFactor), unitY + (10 * scaleFactor), 10 * scaleFactor, 5 * scaleFactor);
            ctx.fillRect(unitX + (15 * scaleFactor), unitY + (10 * scaleFactor), 10 * scaleFactor, 5 * scaleFactor);
            ctx.fillStyle = weaponColor;
            ctx.fillRect(unitX + (10 * scaleFactor), unitY + (8 * scaleFactor), blowpipeLength, 4 * scaleFactor);

            const maskWidth = 20 * scaleFactor;
            const maskHeight = 25 * scaleFactor;
            const maskX = unitX + unitWidth / 2;
            const maskY = unitY;

            const mainColor = '#6d4c41'; 
            const accentColor = '#a1887f'; 
            
            ctx.save();
            ctx.translate(maskX, maskY);
            
            ctx.fillStyle = mainColor;
            ctx.beginPath();
            ctx.moveTo(0, -maskHeight / 2); 
            ctx.quadraticCurveTo(maskWidth / 1.5, -maskHeight / 4, maskWidth / 2, maskHeight / 4); 
            ctx.lineTo(0, maskHeight / 2); 
            ctx.lineTo(-maskWidth / 2, maskHeight / 4); 
            ctx.quadraticCurveTo(-maskWidth / 1.5, -maskHeight / 4, 0, -maskHeight / 2); 
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.moveTo(-maskWidth / 5, -maskHeight / 4);
            ctx.lineTo(-maskWidth / 3, -maskHeight / 6);
            ctx.lineTo(-maskWidth / 5, -maskHeight / 8);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(maskWidth / 5, -maskHeight / 4);
            ctx.lineTo(maskWidth / 3, -maskHeight / 6);
            ctx.lineTo(maskWidth / 5, -maskHeight / 8);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = accentColor;
            ctx.lineWidth = 1.5 * scaleFactor;
            ctx.beginPath();
            ctx.moveTo(0, -maskHeight / 2 + 3);
            ctx.lineTo(0, 0);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(-maskWidth / 2 + 3, maskHeight / 6);
            ctx.lineTo(maskWidth / 2 - 3, maskHeight / 6);
            ctx.stroke();
            
            ctx.restore();
        }
        
        ctx.restore();
        ctx.restore();
    });
}

function getDefenderBoundingBox(owner, defenseType) {
    const entity = owner === 'player' ? player : ai;
    const isPlayerBase = owner === 'player';
    let boxX, boxY;
    const boxWidth = 40;
    const boxHeight = 50;

    const scaleFactor = 0.7;

    if (entity.age === 1) {
        const mudBodyWidth = baseWidth + 30;
        const mudBodyX = entity.baseX - 15;
        const mudBodyHeight = 80;
        const mudBodyTopY = canvas.height - groundHeight - mudBodyHeight;
        const holeRadiusX = 20 * scaleFactor;
        boxY = mudBodyTopY + mudBodyHeight / 2 - 20 - boxHeight / 2;
        if (isPlayerBase) {
            boxX = mudBodyX + mudBodyWidth - holeRadiusX - 10 - boxWidth / 2;
        } else {
            boxX = mudBodyX + holeRadiusX + 10 - boxWidth / 2;
        }
    } else { // Age 2+
        const hutBodyWidth = (baseWidth + 60) * 1.1;
        const hutBodyHeight = 120 * 1.3;
        const hutBodyX = entity.baseX - (hutBodyWidth - baseWidth) / 2;
        const hutBodyTopY = canvas.height - groundHeight - hutBodyHeight;
        const holeRadiusY = 30 * scaleFactor;
        
        const yOffset = (defenseType === 'poison-blower' && entity.hasGun) ? (holeRadiusY * 2.2) : 0;
        boxY = hutBodyTopY + hutBodyHeight / 3 + yOffset - boxHeight / 2;
        
        const adjustment = hutBodyWidth * 0.20;
        if (isPlayerBase) {
            boxX = hutBodyX + hutBodyWidth - 20 * scaleFactor - 15 - adjustment - boxWidth / 2;
        } else {
            boxX = hutBodyX + 20 * scaleFactor + 15 + adjustment - boxWidth / 2;
        }
    }
    return { x: boxX, y: boxY, width: boxWidth, height: boxHeight };
}

function getDefenderFiringPosition(owner, defenseType) {
    const entity = owner === 'player' ? player : ai;
    const isPlayerBase = owner === 'player';
    let fireX, fireY;

    const scaleFactor = 0.7;

    if (entity.age === 1) {
        const mudBodyWidth = baseWidth + 30;
        const mudBodyX = entity.baseX - 15;
        const mudBodyHeight = 80;
        const mudBodyTopY = canvas.height - groundHeight - mudBodyHeight;
        const holeRadiusX = 20 * scaleFactor;
        fireY = mudBodyTopY + mudBodyHeight / 2 - 20;
        if (isPlayerBase) {
            fireX = mudBodyX + mudBodyWidth - holeRadiusX - 10;
        } else {
            fireX = mudBodyX + holeRadiusX + 10;
        }
    } else { // Age 2+
        const hutBodyWidth = (baseWidth + 60) * 1.1;
        const hutBodyHeight = 120 * 1.3;
        const hutBodyX = entity.baseX - (hutBodyWidth - baseWidth) / 2;
        const hutBodyTopY = canvas.height - groundHeight - hutBodyHeight;
        const holeRadiusX = 20 * scaleFactor;
        const holeRadiusY = 30 * scaleFactor;
        
        const yOffset = (defenseType === 'poison-blower' && entity.hasGun) ? (holeRadiusY * 2.2) : 0;
        fireY = hutBodyTopY + hutBodyHeight / 3 + yOffset;
        
        const adjustment = hutBodyWidth * 0.20;
        if (isPlayerBase) {
            fireX = hutBodyX + hutBodyWidth - holeRadiusX - 15 - adjustment;
        } else {
            fireX = hutBodyX + holeRadiusX + 15 + adjustment;
        }
    }
    
    if (defenseType === 'gun') {
        fireX += isPlayerBase ? (20 * scaleFactor) : (-20 * scaleFactor);
        fireY += 10 * scaleFactor;
    } else if (defenseType === 'poison-blower') {
        const blowpipeLength = 30 * 2.0 * scaleFactor;
        fireX += isPlayerBase ? (10 * scaleFactor + blowpipeLength) : -(10 * scaleFactor + blowpipeLength);
        fireY += 10 * scaleFactor;
    }


    return { x: fireX, y: fireY };
}


function drawZuluBase(x, y, isPlayerBase, hp, maxHp) {
    const mudColor = '#8B4513';
    const roofColor = '#FFD700';
    const roofDetailColor = '#DAA520';
    const doorColor = '#5C4033';
    
    const mudBodyHeight = 80;
    const mudBodyWidth = baseWidth + 30;
    const mudBodyX = x - 15;
    
    const mudBodyBottomY = y;
    const mudBodyTopY = mudBodyBottomY - mudBodyHeight;
    const mudBodyCenterX = mudBodyX + mudBodyWidth / 2;
    ctx.fillStyle = mudColor;
    ctx.beginPath();
    ctx.moveTo(mudBodyX, mudBodyBottomY);
    ctx.lineTo(mudBodyX, mudBodyTopY + 20);
    ctx.arc(mudBodyCenterX, mudBodyTopY + 20, mudBodyWidth / 2, Math.PI, 0);
    ctx.lineTo(mudBodyX + mudBodyWidth, mudBodyBottomY);
    ctx.closePath();
    ctx.fill();
    
    const roofHeight = 80;
    const roofPeakY = mudBodyTopY - roofHeight;
    const roofBaseY = mudBodyTopY - 10;
    const roofBaseWidth = mudBodyWidth + 20;
    const roofBaseX = mudBodyX - 10;
    ctx.fillStyle = roofColor;
    ctx.beginPath();
    ctx.moveTo(mudBodyCenterX, roofPeakY);
    ctx.lineTo(roofBaseX, roofBaseY);
    ctx.lineTo(roofBaseX + roofBaseWidth, roofBaseY);
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = roofDetailColor;
    ctx.lineWidth = 1;
    for (let i = 0; i < 9; i++) {
        ctx.beginPath();
        const startX = roofBaseX + (i * roofBaseWidth / 8);
        ctx.moveTo(mudBodyCenterX, roofPeakY);
        ctx.lineTo(startX, roofBaseY);
        ctx.stroke();
    }

    const doorWidth = 40;
    const doorHeight = 50;
    const doorX = mudBodyCenterX - doorWidth / 2;
    const doorBottomY = y;
    const doorTopY = doorBottomY - doorHeight;
    const doorRadius = doorWidth / 2;
    ctx.fillStyle = doorColor;
    ctx.beginPath();
    ctx.moveTo(doorX, doorBottomY);
    ctx.lineTo(doorX, doorTopY + doorRadius);
    ctx.arc(doorX + doorRadius, doorTopY + doorRadius, doorRadius, Math.PI, 0);
    ctx.lineTo(doorX + doorWidth, doorBottomY);
    ctx.closePath();
    ctx.fill();
    const healthBarY = mudBodyTopY - 15;
    const healthBarHeight = 10;
    const healthBarX = x;
    const currentHealthWidth = baseWidth * (hp / maxHp);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.strokeRect(healthBarX, healthBarY, baseWidth, healthBarHeight);
    ctx.fillStyle = 'red';
    ctx.fillRect(healthBarX, healthBarY, currentHealthWidth, healthBarHeight);
}

function drawWoodenHutBase(x, y, isPlayerBase, hp, maxHp) {
    const wallColor = '#A0522D';
    const wallDetailColor = '#8B4513';
    const doorColor = '#2F1B1A';

    const hutBodyWidth = (baseWidth + 60) * 1.1;
    const hutBodyHeight = 120 * 1.3;
    const hutBodyX = x - (hutBodyWidth - baseWidth) / 2;
    const hutBodyBottomY = y;
    const hutBodyTopY = hutBodyBottomY - hutBodyHeight;
    const hutBodyCenterX = hutBodyX + hutBodyWidth / 2;

    ctx.fillStyle = wallColor;
    ctx.beginPath();
    ctx.moveTo(hutBodyCenterX, hutBodyTopY);
    ctx.lineTo(hutBodyX, hutBodyBottomY);
    ctx.lineTo(hutBodyX + hutBodyWidth, hutBodyBottomY);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = wallDetailColor;
    ctx.lineWidth = 2;
    for (let i = 0; i < 10; i++) {
        const progress = i / 9;
        const startX = hutBodyX + progress * hutBodyWidth;
        ctx.beginPath();
        ctx.moveTo(hutBodyCenterX, hutBodyTopY);
        ctx.lineTo(startX, hutBodyBottomY);
        ctx.stroke();
    }

    const doorHeight = hutBodyHeight * 0.7;
    const doorBottomWidth = hutBodyWidth * 0.7;
    const doorTopY = hutBodyBottomY - doorHeight;
    const doorBottomLeftX = hutBodyCenterX - doorBottomWidth / 2;
    const doorBottomRightX = hutBodyCenterX + doorBottomWidth / 2;

    ctx.fillStyle = doorColor;
    ctx.beginPath();
    ctx.moveTo(hutBodyCenterX, doorTopY);
    ctx.lineTo(doorBottomLeftX, hutBodyBottomY);
    ctx.lineTo(doorBottomRightX, hutBodyBottomY);
    ctx.closePath();
    ctx.fill();

    const healthBarY = hutBodyTopY - 20;
    const healthBarHeight = 10;
    const healthBarX = x;
    const currentHealthWidth = baseWidth * (hp / maxHp);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.strokeRect(healthBarX, healthBarY, baseWidth, healthBarHeight);
    ctx.fillStyle = 'red';
    ctx.fillRect(healthBarX, healthBarY, currentHealthWidth, healthBarHeight);
}

function lerpColor(a, b, amount) {
    const ar = a >> 16, ag = a >> 8 & 0xff, ab = a & 0xff,
          br = b >> 16, bg = b >> 8 & 0xff, bb = b & 0xff,
          rr = ar + amount * (br - ar),
          rg = ag + amount * (bg - ag),
          rb = ab + amount * (bb - ab);
    return `#${((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1)}`;
}

function getSkyStyle() {
    const cycleProgress = (gameTime % DAY_DURATION) / DAY_DURATION;

    // Define cycle phases - now with equal day/night lengths and transition periods
    const dawnStart = 0.0;
    const dawnEnd = 0.1;      // 10% - dawn transition
    const dayStart = 0.1;
    const dayEnd = 0.6;       // 50% - full day
    const duskStart = 0.6;
    const duskEnd = 0.7;      // 10% - dusk transition
    const nightStart = 0.7;
    const nightEnd = 1.0;     // 30% - full night

    const colors = {
        dawn: { skyTop: '#FFDAB9', skyMid: '#FFA07A', sun: '#FFD700', ambient: 0.3, starOpacity: 0.0 },
        day: { skyTop: '#87CEEB', skyMid: '#FFA500', sun: '#FFD700', ambient: 0, starOpacity: 0.0 },
        dusk: { skyTop: '#FF4500', skyMid: '#8B0000', sun: '#FF8C00', ambient: 0.5, starOpacity: 0.0 },
        night: { skyTop: '#000033', skyMid: '#2c3e50', sun: '#F5F5F5', ambient: 0.8, starOpacity: 1.0 }
    };

    let from, to, progress, starOpacity = 0.0, ambientAlpha = 0.0, isNight = false;

    if (cycleProgress >= dawnStart && cycleProgress < dawnEnd) {
        // Dawn transition
        from = colors.night;
        to = colors.dawn;
        progress = (cycleProgress - dawnStart) / (dawnEnd - dawnStart);
        starOpacity = 1.0 - progress; // Stars fade out during dawn
        ambientAlpha = 0.8 - (0.8 - 0.3) * progress;
    } else if (cycleProgress >= dayStart && cycleProgress < dayEnd) {
        // Full day
        from = colors.dawn;
        to = colors.day;
        progress = (cycleProgress - dayStart) / (dayEnd - dayStart);
        starOpacity = 0.0;
        ambientAlpha = 0.3 - (0.3 - 0) * progress;
    } else if (cycleProgress >= duskStart && cycleProgress < duskEnd) {
        // Dusk transition
        from = colors.day;
        to = colors.dusk;
        progress = (cycleProgress - duskStart) / (duskEnd - duskStart);
        starOpacity = 0.0; // Stars not visible yet
        ambientAlpha = 0 + (0.5 - 0) * progress;
    } else if (cycleProgress >= nightStart && cycleProgress < nightEnd) {
        // Full night
        from = colors.dusk;
        to = colors.night;
        progress = (cycleProgress - nightStart) / (nightEnd - nightStart);
        starOpacity = 0.0 + (1.0 - 0.0) * progress; // Stars fade in during night
        ambientAlpha = 0.5 + (0.8 - 0.5) * progress;
        isNight = true;
    }

    const skyTop = lerpColor(parseInt(from.skyTop.slice(1), 16), parseInt(to.skyTop.slice(1), 16), progress);
    const skyMid = lerpColor(parseInt(from.skyMid.slice(1), 16), parseInt(to.skyMid.slice(1), 16), progress);
    const sunColor = lerpColor(parseInt(from.sun.slice(1), 16), parseInt(to.sun.slice(1), 16), progress);

    return { skyTop, skyMid, sunColor, ambientAlpha, isNight, starOpacity };
}

function startPlacingStructure(structureName) {
    const cfg = structureSettings[structureName];
    if (player.gold < cfg.cost) return;

    isPlacingStructure = true;
    structureToPlace = cfg;
    generatePlacementStations();
    toggleMenu('none'); 
    detailedStructuresControls.style.display = 'flex';
    detailedStructuresButtonsContainer.style.display = 'none';
    backToMainMenuFromStructuresBtn.style.display = 'none';
    cancelPlacementBtn.style.display = 'flex';
}

function generatePlacementStations() {
    placementStations = [];
    const stationWidth = structureToPlace.width;
    const stationHeight = structureToPlace.height;
    for (let i = 0; i < 8; i++) {
        placementStations.push({
            x: player.baseX - (i + 1) * (stationWidth + 10),
            y: canvas.height - groundHeight - stationHeight,
            width: stationWidth,
            height: stationHeight
        });
    }
}

function drawPlacementStations() {
    if (!isPlacingStructure) return;
    ctx.save();
    const glowAlpha = 0.4 + Math.sin(Date.now() / 200) * 0.3; 
    ctx.shadowColor = `rgba(0, 255, 0, ${glowAlpha})`;
    ctx.shadowBlur = 20;

    placementStations.forEach(station => {
        ctx.fillStyle = `rgba(0, 255, 0, ${glowAlpha})`;
        ctx.fillRect(station.x, station.y, station.width, station.height);
    });
    ctx.restore();
}


function placeStructure(x, y) {
    if (!structureToPlace || player.gold < structureToPlace.cost) return;
    player.gold -= structureToPlace.cost;
    player.structures.push(new Structure(structureToPlace, 'player', x, y));
    isPlacingStructure = false;
    structureToPlace = null;
    placementStations = [];
    cancelPlacementBtn.style.display = 'none';
    detailedStructuresButtonsContainer.style.display = 'flex';
    backToMainMenuFromStructuresBtn.style.display = 'flex';
    toggleMenu('main');
}


// --- Main Game Loop ---
function gameLoop(ts){
    if(isGameOver){
        gameLoopStarted = false;
        return;
    }

    panCamera();
    const dt=(ts-lastTime)||0;
    lastTime=ts;
    const now = Date.now();
    // Only update simulation when not paused and not in Almanac
    if (!isPaused && !isAlmanacOpen) {
        gameTime += dt * gameSpeed;
        aiLogic();

        for (let i = player.units.length - 1; i >= 0; i--) {
            if (player.units[i].update(dt, ai.units)) player.units.splice(i, 1);
        }
        for (let i = ai.units.length - 1; i >= 0; i--) {
            if (ai.units[i].update(dt, player.units)) ai.units.splice(i, 1);
        }
        player.structures.forEach(s => s.update()); 
        ai.structures.forEach(s => s.update()); 
        for (let i = falcons.length - 1; i >= 0; i--) {
            const enemies = falcons[i].owner === 'player' ? ai.units : player.units;
            if (falcons[i].update(dt, enemies)) {
            recordUnitDeath(falcons[i]);
            falcons.splice(i, 1);
        }
        }
        for (let i = textPopUps.length - 1; i >= 0; i--) {
            if (textPopUps[i].update()) textPopUps.splice(i, 1);
        }
        for (let i = rockFragments.length - 1; i >= 0; i--) {
            if (rockFragments[i].update()) rockFragments.splice(i, 1);
        }
        for (let i = projectiles.length - 1; i >= 0; i--) {
            if (projectiles[i].update()) projectiles.splice(i, 1);
        }
        
        if (now < player.rockslideEndTime || now < ai.rockslideEndTime) {
            if (Math.random() < 0.08 && mountainPeaks.length > 0) { 
                const peak = mountainPeaks[Math.floor(Math.random() * mountainPeaks.length)];
                if (smokeParticles.length > 150) { smokeParticles.shift(); }
                smokeParticles.push(new SmokeParticle(peak.x, peak.y));
            }
        }

        for (let i = smokeParticles.length - 1; i >= 0; i--) {
            smokeParticles[i].update();
            if (smokeParticles[i].life <= 0) smokeParticles.splice(i, 1);
        }

        // Update stars
        stars.forEach(star => star.update());

        if (now < player.rockslideEndTime) {
            if (now - player.lastRockWaveTime > 500 / gameSpeed) {
                player.lastRockWaveTime = now;
                const rocksPerWave = 3 + Math.floor(Math.random() * 3);
                if (ai.units.length > 0) {
                    for (let i = 0; i < rocksPerWave; i++) {
                        const targetUnit = ai.units[Math.floor(Math.random() * ai.units.length)];
                        const startX = targetUnit.x + (Math.random() - 0.5) * 200;
                        const startY = canvas.height - groundHeight - (250 + Math.random() * 100);
                        const endX = startX + (Math.random() - 0.5) * 100;
                        const endY = canvas.height - groundHeight;
                        rocks.push(new Rock(startX, startY, endX, endY, 'player'));
                    }
                }
            }
        }

        if (now < ai.rockslideEndTime) {
            if (now - ai.lastRockWaveTime > 500 / gameSpeed) {
                ai.lastRockWaveTime = now;
                const rocksPerWave = 3 + Math.floor(Math.random() * 3);
                if (player.units.length > 0) {
                    for (let i = 0; i < rocksPerWave; i++) {
                        const targetUnit = player.units[Math.floor(Math.random() * player.units.length)];
                        const startX = targetUnit.x + (Math.random() - 0.5) * 200;
                        const startY = canvas.height - groundHeight - (250 + Math.random() * 100);
                        const endX = startX + (Math.random() - 0.5) * 100;
                        const endY = canvas.height - groundHeight;
                        rocks.push(new Rock(startX, startY, endX, endY, 'ai'));
                    }
                }
            }
        }
        
        for (let i = rocks.length - 1; i >= 0; i--) {
            const rock = rocks[i];
            rock.update(dt);
            if (rock.y >= canvas.height - groundHeight) {
                const unitsToDamage = rock.owner === 'player' ? [...ai.units, ...falcons.filter(f => f.owner === 'ai')] : [...player.units, ...falcons.filter(f => f.owner === 'player')];
                unitsToDamage.forEach(unit => {
                    const dist = Math.abs(rock.x - (unit.x + unit.width / 2));
                    if (dist < 30) {
                        unit.hp -= 30;
                        createBloodSplatter(unit.x + unit.width / 2, unit.y + unit.height / 2);
                    }
                });
                rocks.splice(i, 1);
            }
        }

        if (player.hasGun && now - player.lastBaseAttackTime > defenseSettings.gun.attackCooldown) {
            let target = null;
            let closestDist = Infinity;
            const allEnemies = [...ai.units, ...falcons.filter(f => f.owner === 'ai')];
            for (const enemyUnit of allEnemies) {
                if (enemyUnit.isDying || enemyUnit.isCorpse) continue;
                const dist = enemyUnit.x - (player.baseX + baseWidth);
                if (dist >= 0 && dist <= defenseSettings.gun.range && dist < closestDist) {
                    closestDist = dist;
                    target = enemyUnit;
                }
            }
            if (target) {
                const damage = defenseSettings.gun.damage[target.name] || defenseSettings.gun.damage.default;
                const firePos = getDefenderFiringPosition('player', 'gun');
                projectiles.push(new Projectile({x: firePos.x}, firePos.y, target, damage, 'player'));
                player.lastBaseAttackTime = now;
            }
        }

        if (player.hasPoisonBlower && now - player.lastPoisonBlowerAttackTime > defenseSettings['poison-blower'].attackCooldown) {
            let target = null;
            let closestDist = Infinity;
            const allEnemies = [...ai.units, ...falcons.filter(f => f.owner === 'ai')];
            for (const enemyUnit of allEnemies) {
                if (enemyUnit.isDying || enemyUnit.isCorpse) continue;
                const dist = enemyUnit.x - (player.baseX + baseWidth);
                if (dist >= 0 && dist <= defenseSettings['poison-blower'].range && dist < closestDist) {
                    closestDist = dist;
                    target = enemyUnit;
                }
            }
            if (target) {
                const firePos = getDefenderFiringPosition('player', 'poison-blower');
                projectiles.push(new Projectile({x: firePos.x}, firePos.y, target, 0, 'player', 'poison-dart'));
                player.lastPoisonBlowerAttackTime = now;
            }
        }

        if (ai.hasGun && now - ai.lastBaseAttackTime > defenseSettings.gun.attackCooldown) {
            let target = null;
            let closestDist = Infinity;
            const allEnemies = [...player.units, ...falcons.filter(f => f.owner === 'player')];
            for (const enemyUnit of allEnemies) {
                if (enemyUnit.isDying || enemyUnit.isCorpse) continue;
                const dist = ai.baseX - (enemyUnit.x + enemyUnit.width);
                if (dist >= 0 && dist <= defenseSettings.gun.range && dist < closestDist) {
                    closestDist = dist;
                    target = enemyUnit;
                }
            }
            if (target) {
                const damage = defenseSettings.gun.damage[target.name] || defenseSettings.gun.damage.default;
                const firePos = getDefenderFiringPosition('ai', 'gun');
                projectiles.push(new Projectile({x: firePos.x}, firePos.y, target, damage, 'ai'));
                ai.lastBaseAttackTime = now;
            }
        }

        if (ai.hasPoisonBlower && now - ai.lastPoisonBlowerAttackTime > defenseSettings['poison-blower'].attackCooldown) {
            let target = null;
            let closestDist = Infinity;
            const allEnemies = [...player.units, ...falcons.filter(f => f.owner === 'player')];
            for (const enemyUnit of allEnemies) {
                if (enemyUnit.isDying || enemyUnit.isCorpse) continue;
                const dist = ai.baseX - (enemyUnit.x + enemyUnit.width);
                if (dist >= 0 && dist <= defenseSettings['poison-blower'].range && dist < closestDist) {
                    closestDist = dist;
                    target = enemyUnit;
                }
            }
            if (target) {
                const firePos = getDefenderFiringPosition('ai', 'poison-blower');
                projectiles.push(new Projectile({x: firePos.x}, firePos.y, target, 0, 'ai', 'poison-dart'));
                ai.lastPoisonBlowerAttackTime = now;
            }
        }

        if(player.hp<=0)endGame('You Lose!');
        else if(ai.hp<=0)endGame('You Win!');
        if (now - lastUIUpdateTime > UI_UPDATE_INTERVAL) {
            updateUI();
            lastUIUpdateTime = now;
        }
    }
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.save();

    if (now < player.rockslideEndTime || now < ai.rockslideEndTime) {
        const dx = (Math.random() - 0.5) * screenShakeMagnitude;
        const dy = (Math.random() - 0.5) * screenShakeMagnitude;
        ctx.translate(dx, dy);
    }

    ctx.translate(-cameraX,0);
    
    const skyStyle = getSkyStyle();
    let skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height - groundHeight);
    skyGradient.addColorStop(0, skyStyle.skyTop);
    skyGradient.addColorStop(0.5, skyStyle.skyMid);
    skyGradient.addColorStop(1, '#87CEEB');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, worldWidth, canvas.height - groundHeight);

    ctx.fillStyle = skyStyle.sunColor;
    ctx.beginPath();
    ctx.arc(worldWidth * 0.5 + 100, (canvas.height - groundHeight) * 0.2, 80, 0, Math.PI * 2);
    ctx.fill();
    
    if (skyStyle.starOpacity > 0) {
        stars.forEach(star => {
            if (isInView(star.x, star.size)) {
                ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * skyStyle.starOpacity})`;
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    ctx.fillStyle = '#696969';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - groundHeight - 100);
    ctx.lineTo(worldWidth * 0.15, canvas.height - groundHeight - 200);
    ctx.lineTo(worldWidth * 0.3, canvas.height - groundHeight - 120);
    ctx.lineTo(worldWidth * 0.45, canvas.height - groundHeight - 250);
    ctx.lineTo(worldWidth * 0.6, canvas.height - groundHeight - 180);
    ctx.lineTo(worldWidth * 0.8, canvas.height - groundHeight - 280);
    ctx.lineTo(worldWidth, canvas.height - groundHeight - 150);
    ctx.lineTo(worldWidth, canvas.height - groundHeight);
    ctx.lineTo(0, canvas.height - groundHeight);
    ctx.closePath();
    ctx.fill();
    
    const treeSpacing = 150;
    const minTreeX = Math.max(100, Math.floor((cameraX - 200 - 100) / treeSpacing) * treeSpacing + 100);
    const maxTreeX = Math.min(worldWidth - 100, Math.ceil((cameraX + canvas.width + 200 - 100) / treeSpacing) * treeSpacing + 100);
    for (let i = minTreeX; i <= maxTreeX; i += treeSpacing) {
        drawTree(i, canvas.height - groundHeight);
    }
    
    ctx.fillStyle='#228B22';
    ctx.fillRect(0,canvas.height-groundHeight,worldWidth,groundHeight);
    
    if (player.age === 1) {
        drawZuluBase(player.baseX, canvas.height - groundHeight, true, player.hp, player.maxHp);
    } else {
        drawWoodenHutBase(player.baseX, canvas.height - groundHeight, true, player.hp, player.maxHp);
    }

    if (ai.age === 1) {
        drawZuluBase(ai.baseX, canvas.height - groundHeight, false, ai.hp, ai.maxHp);
    } else {
        drawWoodenHutBase(ai.baseX, canvas.height - groundHeight, false, ai.hp, ai.maxHp);
    }
    
    drawDefenders('player');
    drawDefenders('ai');

    if (isSellModeActive) {
        if (player.hasGun) {
            const box = getDefenderBoundingBox('player', 'gun');
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.lineWidth = 3;
            ctx.strokeRect(box.x, box.y, box.width, box.height);
        }
        if (player.hasPoisonBlower) {
            const box = getDefenderBoundingBox('player', 'poison-blower');
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.lineWidth = 3;
            ctx.strokeRect(box.x, box.y, box.width, box.height);
        }
    }

    player.structures.forEach(s => { if (isInView(s.x, s.width)) s.draw(); }); 
    ai.structures.forEach(s => { if (isInView(s.x, s.width)) s.draw(); }); 
    player.units.forEach(u=>{ if (isInView(u.x, u.width)) u.draw(); });
    ai.units.forEach(u=>{ if (isInView(u.x, u.width)) u.draw(); });
    projectiles.forEach(p=>{ if (isInView(p.x || 0, 10)) p.draw(); });
    rocks.forEach(r => { if (isInView(r.x, r.size)) r.draw(); });
    rockFragments.forEach(rf => { if (isInView(rf.x, rf.size)) rf.draw(); });
    falcons.forEach(f => { if (isInView(f.x, f.width)) f.draw(); });
    
    drawPlacementStations(); 

    smokeParticles.forEach(p => { if (isInView(p.x, p.size)) p.draw(); });
    textPopUps.forEach(p => { if (isInView(p.x, 50)) p.draw(); });

    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();
        if (particles[i].life <= 0) particles.splice(i, 1);
    }

    for (let i = bloodParticles.length - 1; i >= 0; i--) {
        bloodParticles[i].update();
        bloodParticles[i].draw();
        if (bloodParticles[i].life <= 0) bloodParticles.splice(i, 1);
    }
    
    if (skyStyle.ambientAlpha > 0) {
        ctx.fillStyle = `rgba(0, 0, 50, ${skyStyle.ambientAlpha * 0.3})`;
        ctx.fillRect(0, 0, worldWidth, canvas.height);
    }

    ctx.restore();
    
    // schedule next frame at the end
    requestAnimationFrame(gameLoop);
}

function endGame(msg){
    isGameOver=true;
    endMessage.textContent=msg;
    messageBox.style.display='flex';
    if (msg === 'You Win!') {
        ai.difficulty += 0.1;
    }
}

retryBtn.addEventListener('click',()=>{
    player.hp = INITIAL_HP;
    player.maxHp = INITIAL_HP;
    ai.hp = INITIAL_HP;
    ai.maxHp = INITIAL_HP;
    player.gold = INITIAL_GOLD;
    ai.gold = INITIAL_GOLD;
    player.age = INITIAL_AGE;
    ai.age = INITIAL_AGE;
    player.exp = INITIAL_EXP;
    ai.exp = INITIAL_EXP;
    player.units = [];
    ai.units = [];
    player.structures = []; 
    ai.structures = []; 
    player.craftingLevels = {};
    for (const key in craftingSettings) {
        craftingSettings[key].purchased = false;
    }
    ai.craftingLevels = {};
    projectiles = [];
    rocks = [];
    rockFragments = [];
    falcons = [];
    textPopUps = []; 
    particles = [];
    bloodParticles = [];
    smokeParticles = [];
    cameraX = 0;
    isGameOver = false;
    messageBox.style.display = 'none';
    player.hasGun = false;
    player.hasPoisonBlower = false;
    player.lastBaseAttackTime = 0;
    player.lastPoisonBlowerAttackTime = 0;
    player.lastRockslideTime = 0;
    player.rockslideEndTime = 0;
    player.lastRockWaveTime = 0;
    ai.hasGun = false;
    ai.hasPoisonBlower = false;
    ai.lastBaseAttackTime = 0;
    ai.lastPoisonBlowerAttackTime = 0;
    ai.mode = 'passive';
    ai.lastModeChange = 0;
    ai.lastRockslideTime = 0;
    ai.rockslideEndTime = 0;
    ai.lastRockWaveTime = 0;
    currentMenuState = 'main';
    player.specialUnitUnlocked = false;
    player.chosenSpecialUnit = null;
    ai.specialUnitUnlocked = false;
    ai.chosenSpecialUnit = null;
    Object.keys(ai.strategy.playerUnitProduction).forEach(key => {
        ai.strategy.playerUnitProduction[key] = 0;
    });
    ai.incomeMultiplier = 1;
    playerIsPressuringAi = false;
    aiIsPressuringPlayer = false;
    lastPlayerPressureTime = Date.now();
    lastAiPressureTime = Date.now();
    lastAiEmergencyDefenseTime = 0;
    lastAiStalemateActionTime = 0;
    lastAiOffensiveInvestmentTime = 0;
    aiShouldHoldSpawns = false;
    resizeCanvas(); 
    setupUI();
    lastTime = performance.now();
    initStars(); // Reinitialize stars
    if (!gameLoopStarted) {
        gameLoopStarted = true;
        requestAnimationFrame(gameLoop);
    }
});

deleteDefenseBtn.addEventListener('click', () => {
    if (isPaused) return;
    isSellModeActive = !isSellModeActive;
    if (isSellModeActive) {
        deleteDefenseBtn.textContent = 'Cancel';
    } else {
        deleteDefenseBtn.textContent = 'Sell Defense';
    }
});

canvas.addEventListener('click', (e) => {
    if (isPaused) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left + cameraX;
    const clickY = e.clientY - rect.top;

    if (isPlacingStructure) {
        for (const station of placementStations) {
            if (clickX > station.x && clickX < station.x + station.width && clickY > station.y && clickY < station.y + station.height) {
                placeStructure(station.x, station.y);
                return;
            }
        }
        return;
    }

    for (const structure of player.structures) {
        if (clickX > structure.craftButton.x && clickX < structure.craftButton.x + structure.craftButton.width &&
            clickY > structure.craftButton.y && clickY < structure.craftButton.y + structure.craftButton.height) {
            openCraftingUI(structure);
            return;
        }
    }

    if (!isSellModeActive) return;

    if (player.hasGun) {
        const box = getDefenderBoundingBox('player', 'gun');
        if (clickX > box.x && clickX < box.x + box.width && clickY > box.y && clickY < box.y + box.height) {
            player.gold += defenseSettings['gun'].cost / 2;
            player.hasGun = false;
            isSellModeActive = false;
            deleteDefenseBtn.textContent = 'Sell Defense';
            updateUI();
            return;
        }
    }
    if (player.hasPoisonBlower) {
       const box = getDefenderBoundingBox('player', 'poison-blower');
       if (clickX > box.x && clickX < box.x + box.width && clickY > box.y && clickY < box.y + box.height) {
           player.gold += defenseSettings['poison-blower'].cost / 2;
           player.hasPoisonBlower = false;
           isSellModeActive = false;
           deleteDefenseBtn.textContent = 'Sell Defense';
           updateUI();
           return;
       }
    }
});

mainUnitMenuBtn.addEventListener('click', () => { if (isPaused) return; toggleMenu('units'); });
mainDefenseMenuBtn.addEventListener('click', () => { if (isPaused) return; toggleMenu('defenses'); });
mainStructuresMenuBtn.addEventListener('click', () => { if (isPaused) return; toggleMenu('structures'); }); 
backToMainMenuBtn.addEventListener('click', () => { if (isPaused) return; toggleMenu('main'); });
backToMainMenuFromDefenseBtn.addEventListener('click', () => { if (isPaused) return; toggleMenu('main'); });
backToMainMenuFromStructuresBtn.addEventListener('click', () => { if (isPaused) return; toggleMenu('main'); }); 
cancelPlacementBtn.addEventListener('click', () => { 
    isPlacingStructure = false;
    structureToPlace = null;
    placementStations = [];
    cancelPlacementBtn.style.display = 'none';
    detailedStructuresButtonsContainer.style.display = 'flex';
    backToMainMenuFromStructuresBtn.style.display = 'flex';
    toggleMenu('structures');
});
ageUpBtn.addEventListener('click', () => { if (isPaused) return; ageUp(); });
rockslideBtn.addEventListener('click', () => { if (isPaused) return; activateRockslide('player'); });
panLeftBtn.addEventListener('mousedown', () => { panLeftBtnDown = true; });
panLeftBtn.addEventListener('mouseup', () => panLeftBtnDown = false);
panLeftBtn.addEventListener('mouseleave', () => panLeftBtnDown = false);
panRightBtn.addEventListener('mousedown', () => { panRightBtnDown = true; });
panRightBtn.addEventListener('mouseup', () => panRightBtnDown = false);
panRightBtn.addEventListener('mouseleave', () => panRightBtnDown = false);
canvas.addEventListener('mousemove', (e) => {
    mouseX = e.clientX - canvas.getBoundingClientRect().left;
});

pauseBtn.addEventListener('click', () => {
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? 'Unpause' : 'Pause';
});

speed1xBtn.addEventListener('click', () => {
    gameSpeed = 1;
    speed1xBtn.disabled = true;
    speed2xBtn.disabled = false;
    speed3xBtn.disabled = false;
});

speed2xBtn.addEventListener('click', () => {
    gameSpeed = 2;
    speed1xBtn.disabled = false;
    speed2xBtn.disabled = true;
    speed3xBtn.disabled = false;
});

speed3xBtn.addEventListener('click', () => {
    gameSpeed = 3;
    speed1xBtn.disabled = false;
    speed2xBtn.disabled = false;
    speed3xBtn.disabled = true;
});

musicBtn.addEventListener('click', () => {
    if (Tone.Transport.state !== 'started') {
        Tone.start();
        Tone.Transport.start();
        musicBtn.textContent = 'Stop Music';
    } else {
        Tone.Transport.stop();
        musicBtn.textContent = 'Play Music';
    }
});

troopInfoBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent event from bubbling up
    isAlmanacOpen = !isAlmanacOpen;
    almanacDiv.style.display = isAlmanacOpen ? 'flex' : 'none';
    if (isAlmanacOpen) {
        // Set player as default view and update UI
        almanacTeamView = 'player';
        almanacPlayerBtn.classList.add('active-player');
        almanacEnemyBtn.classList.remove('active-enemy');
        populateAlmanac();
        almanacLoop();
    }
});

almanacCloseBtn.addEventListener('click', () => {
    isAlmanacOpen = false;
    almanacDiv.style.display = 'none';
    isPaused = false;
    pauseBtn.textContent = 'Pause';
    almanacArrow.style.display = 'none';
});

almanacPlayerBtn.addEventListener('click', () => {
    if (almanacTeamView !== 'player') {
        setAlmanacTeamView('player');
        populateAlmanac();
    }
});

almanacEnemyBtn.addEventListener('click', () => {
    if (almanacTeamView !== 'enemy') {
        setAlmanacTeamView('enemy');
        populateAlmanac();
    }
});

function setAlmanacTeamView(team) {
    almanacTeamView = team;
    almanacPlayerBtn.classList.toggle('active-player', team === 'player');
    almanacEnemyBtn.classList.toggle('active-enemy', team === 'enemy');
    almanacPlayerBtn.classList.toggle('active-enemy', false);
    almanacEnemyBtn.classList.toggle('active-player', false);
}

function getCraftingBonusesForUnit(unitName) {
    const bonuses = { hp: 0, damage: 0, attackSpeed: 0, damageReduction: 0 };
    if (!player.craftingLevels || !player.craftingLevels[unitName] || !craftingSettings[unitName]) {
        return bonuses;
    }

    const equippedItems = player.craftingLevels[unitName];
    for (const slot in equippedItems) {
        const itemName = equippedItems[slot];
        if (!itemName) continue;
        const itemList = craftingSettings[unitName][slot];
        if (!itemList) continue;
        const item = itemList.find(i => i.name === itemName);
        if (!item || !item.effect) continue;
        const effect = item.effect;
        if (effect.hp) bonuses.hp += effect.hp;
        if (effect.damage) bonuses.damage += effect.damage;
        if (effect.attackSpeed) bonuses.attackSpeed += effect.attackSpeed;
        if (effect.damageReduction) bonuses.damageReduction += effect.damageReduction;
    }

    return bonuses;
}

function applyPlayerCraftingToPreviewUnit(unit) {
    if (!unit) return { hp: 0, damage: 0, attackSpeed: 0, damageReduction: 0 };
    const unitName = unit.name;
    const equippedItems = player.craftingLevels?.[unitName];
    if (equippedItems) {
        for (const slot in equippedItems) {
            const itemName = equippedItems[slot];
            if (itemName) {
                unit.equipped[slot] = itemName;
            }
        }
        unit.applyCraftingUpgrades();
    }
    return getCraftingBonusesForUnit(unitName);
}

almanacArrow.addEventListener('click', () => {
    if (almanacSelectedUnitName === 'Stone Guard') {
        almanacStoneGuardState = almanacStoneGuardState === 'shielded' ? 'disarmed' : 'shielded';
        const unitConfig = ageSettings[2].units.find(u => u.name === 'Stone Guard');
        
        if (almanacStoneGuardState === 'shielded') {
            almanacPreviewUnit = new Unit(unitConfig, almanacTeamView);
            if (almanacTeamView === 'player') {
                applyPlayerCraftingToPreviewUnit(almanacPreviewUnit);
            }

            almanacInfo.innerHTML = `
                <h3>${unitConfig.name} (${unitConfig.cost} Gold)</h3>
                <p>Health: ${unitConfig.hp}</p>
                <p>Shield Health: ${unitConfig.shieldHp}</p>
                <p>Damage: ${unitConfig.damage}</p>
            `;
        } else {
            almanacPreviewUnit = new Unit(unitConfig, almanacTeamView);
            almanacPreviewUnit.shieldBroken = true;
            if (almanacTeamView === 'player') {
                applyPlayerCraftingToPreviewUnit(almanacPreviewUnit);
            }

            almanacInfo.innerHTML = `
                <h3>Disarmed Stone Guard</h3>
                <p>Health: ${unitConfig.hp}</p>
                <p>Damage: ${unitConfig.maceDamage}</p>
                <p>Cost: ${unitConfig.cost} Gold</p>
            `;
        }
        almanacPreviewUnit.x = almanacCanvas.width / 2 - almanacPreviewUnit.width / 2;
        almanacPreviewUnit.y = almanacCanvas.height - groundHeight - almanacPreviewUnit.height;
    } else if (almanacSelectedUnitName === 'Falcon Caster') {
        almanacCasterState = almanacCasterState === 'caster' ? 'falcon' : 'caster';
        const unitConfig = ageSettings[2].specialUnits.find(u => u.name === 'Falcon Caster');
        if (almanacCasterState === 'caster') {
            almanacPreviewUnit = new Unit(unitConfig, almanacTeamView);
            if (almanacTeamView === 'player') {
                applyPlayerCraftingToPreviewUnit(almanacPreviewUnit);
            }

            almanacInfo.innerHTML = `
                <h3>${unitConfig.name} (${unitConfig.cost} Gold)</h3>
                <p>Health: ${unitConfig.hp}</p>
                <p>Damage: ${unitConfig.damage}</p>
            `;
        } else { // falcon state
            almanacPreviewUnit = new Falcon(0, 0, almanacTeamView, {}); // Dummy caster
            almanacInfo.innerHTML = `
                <h3>Falcon</h3>
                <p>Health: 75</p>
                <p>Damage: 30</p>
            `;
        }
        if (almanacPreviewUnit instanceof Unit) {
            almanacPreviewUnit.x = almanacCanvas.width / 2 - almanacPreviewUnit.width / 2;
            almanacPreviewUnit.y = almanacCanvas.height - groundHeight - almanacPreviewUnit.height;
        } else { // Falcon
            almanacPreviewUnit.x = almanacCanvas.width / 2;
            almanacPreviewUnit.y = almanacCanvas.height / 2;
        }
    }
});

function populateAlmanac() {
    if (!almanacUnitList) return;
    almanacUnitList.innerHTML = '';
    almanacArrow.style.display = 'none';
    almanacInfo.innerHTML = '';
    almanacPreviewUnit = null;
    const source = almanacTeamView === 'player' ? player : ai;
    for (const age in ageSettings) {
        const baseUnits = [...ageSettings[age].units];
        const specialUnits = [...(ageSettings[age].specialUnits || [])];
        const units = [...baseUnits, ...specialUnits];
        units.forEach(unitConfig => {
            const btn = document.createElement('button');
            btn.className = 'almanac-unit-btn';
            btn.textContent = unitConfig.name;
            btn.onclick = (e) => {
                e.stopPropagation(); // Prevent event from bubbling up
                almanacSelectedUnitName = unitConfig.name;
                almanacArrow.style.display = (unitConfig.name === 'Stone Guard' || unitConfig.name === 'Falcon Caster') ? 'block' : 'none';
                almanacStoneGuardState = 'shielded';
                almanacCasterState = 'caster';
                almanacPreviewUnit = new Unit(unitConfig, almanacTeamView, true); // true indicates this is a preview unit
                let craftingBonuses = { hp: 0, damage: 0, attackSpeed: 0, damageReduction: 0 };
                if (almanacTeamView === 'player') {
                    craftingBonuses = applyPlayerCraftingToPreviewUnit(almanacPreviewUnit);
                }
                almanacPreviewUnit.x = almanacCanvas.width / 2 - almanacPreviewUnit.width / 2;
                almanacPreviewUnit.y = almanacCanvas.height - groundHeight - almanacPreviewUnit.height;
                let infoHTML = `
                    <h3>${unitConfig.name} (${unitConfig.cost} Gold, ${unitConfig.expValue} Exp)</h3>
                `;

                // Display health with bonus
                infoHTML += `<p>Health: ${unitConfig.hp}`;
                if (craftingBonuses.hp > 0) {
                    infoHTML += ` <span style="color: #4CAF50; font-weight: bold;">+${craftingBonuses.hp}</span>`;
                }
                infoHTML += `</p>`;

                if (unitConfig.shieldHp) {
                    infoHTML += `<p>Shield Health: ${unitConfig.shieldHp}</p>`;
                }

                // Display damage with bonus
                infoHTML += `<p>Damage: ${unitConfig.damage}`;
                if (craftingBonuses.damage > 0) {
                    infoHTML += ` <span style="color: #4CAF50; font-weight: bold;">+${craftingBonuses.damage}</span>`;
                }
                infoHTML += `</p>`;

                if (unitConfig.maceDamage) {
                    infoHTML += `<p>Mace Damage: ${unitConfig.maceDamage}</p>`;
                }

                // Show attack speed bonus if any
                if (craftingBonuses.attackSpeed > 0) {
                    infoHTML += `<p>Attack Speed: <span style="color: #4CAF50; font-weight: bold;">+${Math.round(craftingBonuses.attackSpeed * 100)}%</span></p>`;
                }

                // Show damage reduction bonus if any
                if (craftingBonuses.damageReduction > 0) {
                    infoHTML += `<p>Damage Reduction: <span style="color: #4CAF50; font-weight: bold;">+${Math.round(craftingBonuses.damageReduction * 100)}%</span></p>`;
                }
                almanacInfo.innerHTML = infoHTML;
            };
            almanacUnitList.appendChild(btn);
        });
    }
}

function almanacLoop() {
    if (!isAlmanacOpen) return;
    almanacCtx.clearRect(0, 0, almanacCanvas.width, almanacCanvas.height);
    if (almanacPreviewUnit) {
        if (almanacPreviewUnit instanceof Unit) {
            almanacPreviewUnit.walkCycle = (almanacPreviewUnit.walkCycle + 0.05 * almanacPreviewUnit.speed) % (Math.PI * 2);
            almanacPreviewUnit.draw(true, almanacCtx);
        } else if (almanacPreviewUnit instanceof Falcon) {
            almanacPreviewUnit.flapCycle = (almanacPreviewUnit.flapCycle + 0.05) % 1;
            almanacPreviewUnit.draw(true, almanacCtx);
        }
    }
    requestAnimationFrame(almanacLoop);
}


function initMusic() {
    const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
            type: "fatsawtooth",
            count: 3,
            spread: 30
        },
        envelope: {
            attack: 0.01,
            decay: 0.1,
            sustain: 0.5,
            release: 0.4,
            attackCurve: "exponential"
        },
    }).toDestination();

    const melody = [
        "C4", "E4", "G4", "C5",
        "G4", "E4", "C4", null,
        "D4", "F4", "A4", "D5",
        "A4", "F4", "D4", null,
        "E4", "G4", "B4", "E5",
        "B4", "G4", "E4", null,
        "F4", "A4", "C5", "F5",
        "C5", "A4", "F4", null
    ];

    let index = 0;

    Tone.Transport.scheduleRepeat(time => {
        let note = melody[index % melody.length];
        if (note) {
            synth.triggerAttackRelease(note, "8n", time);
        }
        index++;
    }, "8n");

    Tone.Transport.bpm.value = 120;
}

function initStars() {
    stars = [];
    const numStars = 150; // Number of stars to create
    for (let i = 0; i < numStars; i++) {
        const x = Math.random() * worldWidth;
        const y = Math.random() * (canvas.height - groundHeight - 200); // Keep stars above ground
        stars.push(new Star(x, y));
    }
}

function specialUnitChoiceLoop() {
    if (specialUnitChoiceOverlay.style.display === 'none') return;

    choiceCtx1.clearRect(0, 0, choiceCanvas1.width, choiceCanvas1.height);
    if (choicePreviewUnit1) {
        choicePreviewUnit1.walkCycle = (choicePreviewUnit1.walkCycle + 0.05 * choicePreviewUnit1.speed) % (Math.PI * 2);
        choicePreviewUnit1.draw(true, choiceCtx1);
    }

    choiceCtx2.clearRect(0, 0, choiceCanvas2.width, choiceCanvas2.height);
    if (choicePreviewUnit2) {
        choicePreviewUnit2.walkCycle = (choicePreviewUnit2.walkCycle + 0.05 * choicePreviewUnit2.speed) % (Math.PI * 2);
        choicePreviewUnit2.draw(true, choiceCtx2);
    }

    requestAnimationFrame(specialUnitChoiceLoop);
}

// --- Crafting UI Functions ---
function openCraftingUI(structure) {
    activeCraftingTable = structure;
    isPaused = true;
    craftingUIState = 'unit-selection';
    populateCraftingUI();
    craftingOverlay.style.display = 'flex';
    requestAnimationFrame(craftingLoop);
}

function closeCraftingUI() {
    craftingOverlay.style.display = 'none';
    isPaused = false;
    activeCraftingTable = null;
    craftingPreviews = {};
}

function purchaseCraftingUpgrade(itemName, unitName, category) {
    const item = craftingSettings[unitName][category].find(i => i.name === itemName);
    if (player.craftingLevels[unitName]?.[category] === itemName) {
        console.log("Item already equipped");
        return;
    }

    const currentItemName = player.craftingLevels[unitName]?.[category];
    if (currentItemName) {
        const currentItem = craftingSettings[unitName][category].find(i => i.name === currentItemName);
        if (currentItem && currentItem.goldCost >= item.goldCost) {
            console.log("Cannot downgrade crafting item");
            return;
        }
    }

    if (player.gold >= item.goldCost && player.exp >= item.expCost) {
        player.gold -= item.goldCost;
        player.exp -= item.expCost;
        if (!player.craftingLevels[unitName]) {
            player.craftingLevels[unitName] = {};
        }
        player.craftingLevels[unitName][category] = itemName;

        player.units.forEach(unit => {
            if (unit.name === unitName) {
                unit.applyCraftingUpgrades();
            }
        });
        
        populateCraftingUI();
        updateUI();
    } else {
        console.log("Not enough resources");
    }
}


function populateCraftingUI() {
    craftingCardsContainer.innerHTML = '';
    craftingPreviews = {};

    if (craftingUIState === 'unit-selection') {
        const axemanCard = createUnitSelectionCard('Axeman');
        const blowgunnerCard = createUnitSelectionCard('Blowgunner');
        craftingCardsContainer.appendChild(axemanCard);
        craftingCardsContainer.appendChild(blowgunnerCard);
    } else if (craftingUIState === 'category-selection') {
        // Always show all three categories
        const categories = ['head', 'chest', 'weapon'];
        categories.forEach(category => {
            if (craftingSettings[selectedUnitForCrafting][category]) {
                const categoryCard = createCategorySelectionCard(selectedUnitForCrafting, category);
                craftingCardsContainer.appendChild(categoryCard);
            }
        });
    } else if (craftingUIState === 'upgrade-selection') {
        const items = craftingSettings[selectedUnitForCrafting][selectedCategoryForCrafting];
        items.forEach(item => {
            const card = createCraftingCard(item, selectedUnitForCrafting, selectedCategoryForCrafting);
            craftingCardsContainer.appendChild(card);
        });
        
        // Back button is already in the HTML, no need to add another one
    }
}

function createUnitSelectionCard(unitName) {
    const card = document.createElement('div');
    card.className = 'choice-card';
    card.onclick = () => {
        selectedUnitForCrafting = unitName;
        craftingUIState = 'category-selection';
        populateCraftingUI();
    };

    const canvas = document.createElement('canvas');
    // Ensure visible canvas for unit preview
    canvas.width = 180;
    canvas.height = 140;
    const unitConfig = ageSettings[2].units.find(u => u.name === unitName);
    const previewUnit = new Unit(unitConfig, 'player');
    
    // Apply player's crafting levels to the preview unit
    if (player.craftingLevels && player.craftingLevels[unitName]) {
        for (const slot in player.craftingLevels[unitName]) {
            const itemName = player.craftingLevels[unitName][slot];
            const item = craftingSettings[unitName]?.[slot]?.find(i => i.name === itemName);
            if (item) {
                previewUnit.equipped[slot] = itemName;
            }
        }
        // Re-apply crafting upgrades to update stats
        previewUnit.applyCraftingUpgrades();
    }
    
    card.appendChild(canvas);
    const info = document.createElement('div');
    info.innerHTML = `<h3>${unitName} Upgrades</h3>`;
    card.appendChild(info);

    const previewCtx = canvas.getContext('2d');
    previewUnit.x = canvas.width / 2 - previewUnit.width / 2;
    previewUnit.y = canvas.height - groundHeight - previewUnit.height;
    previewUnit.draw(true, previewCtx);

    return card;
}

function drawBlowgunnerHeadPreview(ctx, itemName) {
    ctx.save();

    const isFeatherHeadband = itemName === 'Feather Headband';

    if (!isFeatherHeadband) {
        // Hair backdrop
        ctx.fillStyle = '#3B2A1A';
        ctx.beginPath();
        ctx.arc(0, -8, 22, Math.PI, 0);
        ctx.fill();
    }

    // Head base\r
    const skinColor = '#E6C49A';
    ctx.fillStyle = skinColor;
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#1F1F1F';
    ctx.beginPath();
    ctx.arc(-6, -3, 2.5, 0, Math.PI * 2);
    ctx.arc(6, -3, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Mouth (hidden when wearing Feather Headband)
    if (itemName !== 'Feather Headband') {
        ctx.strokeStyle = '#A0522D';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-5, 7);
        ctx.lineTo(5, 7);
        ctx.stroke();
    }

    switch (itemName) {
        case 'Feather Headband': {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(-22, -8, 44, 8);

            // Gray accent lines across the band
            ctx.strokeStyle = '#A9A9A9';
            ctx.lineWidth = 2;
            for (let x = -18; x <= 18; x += 8) {
                ctx.beginPath();
                ctx.moveTo(x, -8);
                ctx.lineTo(x, 0);
                ctx.stroke();
            }

            // Feather on the left side
            ctx.save();
            ctx.translate(-16, -8);
            ctx.rotate(-Math.PI / 6);

            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-12, -10);
            ctx.lineTo(-4, -44);
            ctx.lineTo(8, -12);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = '#B0B0B0';
            ctx.lineWidth = 1.5;
            for (let i = 1; i <= 6; i++) {
                const y = -8 - i * 6;
                ctx.beginPath();
                ctx.moveTo(-8, y);
                ctx.lineTo(4, y - 2);
                ctx.stroke();
            }

            // Feather spine
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-2, -44);
            ctx.stroke();

            ctx.restore();
            break;
        }
        case 'Leather Hood': {
            ctx.fillStyle = '#5C4033';
            ctx.beginPath();
            ctx.moveTo(-23, -16);
            ctx.quadraticCurveTo(-24, -32, 0, -40);
            ctx.quadraticCurveTo(24, -32, 23, -16);
            ctx.lineTo(20, 18);
            ctx.quadraticCurveTo(0, 24, -20, 18);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#3F2A1E';
            ctx.beginPath();
            ctx.moveTo(-14, 10);
            ctx.lineTo(14, 10);
            ctx.lineTo(0, 20);
            ctx.closePath();
            ctx.fill();
            break;
        }
        case 'Bone Mask': {
            const bone = '#E9E4CF';
            const shadow = '#D3CCB4';
            ctx.fillStyle = bone;
            ctx.beginPath();
            ctx.ellipse(0, -4, 20, 16, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = shadow;
            ctx.beginPath();
            ctx.moveTo(-12, 3);
            ctx.lineTo(12, 3);
            ctx.lineTo(8, 14);
            ctx.lineTo(-8, 14);
            ctx.closePath();
            ctx.fill();

            // Eye sockets
            ctx.fillStyle = '#1F1F1F';
            ctx.beginPath();
            ctx.ellipse(-7, -6, 4, 5.5, 0, 0, Math.PI * 2);
            ctx.ellipse(7, -6, 4, 5.5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Nasal opening
            ctx.fillStyle = '#8C8366';
            ctx.beginPath();
            ctx.moveTo(0, -4);
            ctx.lineTo(-3, 4);
            ctx.lineTo(3, 4);
            ctx.closePath();
            ctx.fill();

            // Bone ridges
            ctx.strokeStyle = '#C8C1A5';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -18);
            ctx.lineTo(0, 10);
            ctx.stroke();
            break;
        }
        default: {
            // Simple band as fallback
            ctx.fillStyle = '#8C4A2F';
            ctx.fillRect(-22, -8, 44, 8);
        }
    }

    ctx.restore();
}

function drawBlowgunnerChestPreview(ctx, itemName) {
    ctx.save();

    const drawSilhouette = () => {
        ctx.beginPath();
        ctx.moveTo(-18, -32);
        ctx.lineTo(18, -32);
        ctx.lineTo(24, 36);
        ctx.lineTo(-24, 36);
        ctx.closePath();
    };

    switch (itemName) {
        case 'Leather Dress': {
            const leather = '#8B5A2B';
            ctx.fillStyle = leather;
            drawSilhouette();
            ctx.fill();

            ctx.fillStyle = '#5C4033';
            ctx.fillRect(-22, 10, 44, 6);

            ctx.strokeStyle = '#D2B48C';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-10, -8);
            ctx.lineTo(0, -4);
            ctx.lineTo(10, -8);
            ctx.stroke();
            break;
        }
        case 'Leather Jerkin': {
            const leather = '#704523';
            ctx.fillStyle = leather;
            drawSilhouette();
            ctx.fill();

            ctx.fillStyle = '#3F2A1E';
            ctx.fillRect(-22, 12, 44, 5);

            ctx.strokeStyle = '#C79B63';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let y = -14; y <= 10; y += 5) {
                ctx.moveTo(-6, y);
                ctx.lineTo(6, y + 3);
            }
            ctx.stroke();
            break;
        }
        case 'Bone Plated Vest': {
            const base = '#4F3624';
            ctx.fillStyle = base;
            drawSilhouette();
            ctx.fill();

            const bone = '#EAE6D3';
            ctx.fillStyle = bone;
            for (let i = -2; i <= 2; i++) {
                ctx.beginPath();
                ctx.moveTo(i * 7 - 5, -24);
                ctx.lineTo(i * 7 + 5, -24);
                ctx.lineTo(i * 7 + 7, 12);
                ctx.lineTo(i * 7 - 7, 12);
                ctx.closePath();
                ctx.fill();
            }

            ctx.fillStyle = bone;
            ctx.beginPath();
            ctx.arc(-22, -18, 6, 0, Math.PI * 2);
            ctx.arc(22, -18, 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#5C4033';
            ctx.fillRect(-22, 12, 44, 5);
            break;
        }
        default: {
            ctx.fillStyle = '#8B5A2B';
            drawSilhouette();
            ctx.fill();
        }
    }

    ctx.restore();
}

function drawBlowgunnerWeaponPreview(ctx, itemName) {
    ctx.save();
    ctx.rotate(-Math.PI / 12);

    switch (itemName) {
        case 'Reed Blow Pipe': {
            ctx.fillStyle = '#87A96B';
            ctx.fillRect(-50, -4, 100, 8);

            ctx.fillStyle = '#C5D887';
            ctx.fillRect(-12, -5, 24, 10);
            break;
        }
        case 'Hardened Blowpipe': {
            ctx.fillStyle = '#3C3C3C';
            ctx.fillRect(-52, -4, 104, 8);

            ctx.fillStyle = '#8B4513';
            for (let i = -30; i <= 30; i += 20) {
                ctx.fillRect(i, -6, 6, 12);
            }
            break;
        }
        case 'Poisoned Darts': {
            ctx.fillStyle = '#4B3621';
            ctx.fillRect(-48, -3, 96, 6);

            ctx.fillStyle = '#2E8B57';
            for (let i = -30; i <= 30; i += 15) {
                ctx.beginPath();
                ctx.moveTo(i, -8);
                ctx.lineTo(i + 4, -18);
                ctx.lineTo(i + 8, -8);
                ctx.closePath();
                ctx.fill();
            }
            break;
        }
        default: {
            ctx.fillStyle = '#87A96B';
            ctx.fillRect(-48, -3, 96, 6);
        }
    }

    ctx.restore();
}

function createCategorySelectionCard(unitName, category) {
    const card = document.createElement('div');
    card.className = 'choice-card';
    card.onclick = () => {
        selectedCategoryForCrafting = category;
        craftingUIState = 'upgrade-selection';
        populateCraftingUI();
    };

    const canvas = document.createElement('canvas');
    // Provide a visible canvas area for category previews
    canvas.width = 160;
    canvas.height = 120;
    // If this is the Axeman head category, draw the Axeman head with the currently equipped headgear
    if (unitName === 'Axeman' && category === 'head') {
        const ctx = canvas.getContext('2d');
        const equippedHead = player.craftingLevels[unitName]?.[category] || 'Fur Hat';
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.translate(canvas.width / 2, canvas.height / 2);
        // Draw head base
        const skinColor = '#F0C29F';
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();
        // Draw the specific headgear on the head (same visuals as upgrade cards)
        switch (equippedHead) {
            case 'Fur Hat': {
                const hatBodyColor = '#5C4033';
                const hatStripeColor = '#A0522D';
                // Dome
                ctx.fillStyle = hatBodyColor;
                ctx.beginPath();
                ctx.arc(0, -6, 24, Math.PI, 0);
                ctx.fill();
                // Tail stripes
                ctx.fillStyle = hatStripeColor;
                ctx.fillRect(-30, -10, 30, 6);
                ctx.fillStyle = hatBodyColor;
                for (let i = -28; i <= -6; i += 6) ctx.fillRect(i, -10, 3, 6);
                break;
            }
            case 'Leather Cap': {
                // Smaller dome cap with front brim and stitching
                ctx.fillStyle = '#8B4513';
                ctx.beginPath();
                ctx.arc(0, -6, 20, Math.PI, 0);
                ctx.fill();
                // Brim
                ctx.fillStyle = '#7A3F1A';
                ctx.fillRect(-10, -6, 20, 4);
                // Stitches
                ctx.strokeStyle = '#A4703A';
                ctx.lineWidth = 2;
                for (let i = -10; i <= 10; i += 10) {
                    ctx.beginPath();
                    ctx.moveTo(i, -10);
                    ctx.lineTo(i, -6);
                    ctx.stroke();
                }
                break;
            }
            case 'Bone Helmet': {
                // Deer skull style mask (preview) - WITH HORNS
                const bone = '#E9E4CF';
                const shadow = '#D8D2B8';
                // Upper skull dome
                ctx.fillStyle = bone;
                ctx.beginPath();
                ctx.ellipse(0, -10, 22, 16, 0, Math.PI, 0);
                ctx.fill();
                // Lower mask/jaw
                ctx.beginPath();
                ctx.moveTo(-18, -10);
                ctx.lineTo(18, -10);
                ctx.lineTo(14, 0);
                ctx.lineTo(-14, 0);
                ctx.closePath();
                ctx.fill();
                // Shading strip
                ctx.fillStyle = shadow;
                ctx.fillRect(-16, -7, 32, 3);
                // Eye sockets
                ctx.fillStyle = 'black';
                ctx.beginPath();
                ctx.arc(-8, -14, 4, 0, Math.PI * 2);
                ctx.arc(8, -14, 4, 0, Math.PI * 2);
                ctx.fill();
                // Nasal opening
                ctx.beginPath();
                ctx.moveTo(0, -10);
                ctx.lineTo(-3, -4);
                ctx.lineTo(3, -4);
                ctx.closePath();
                ctx.fillStyle = '#8C8366';
                ctx.fill();
                // Add horns - triangular shape pointing UP
                ctx.fillStyle = bone;
                // Left horn
                ctx.beginPath();
                ctx.moveTo(-18, -35);
                ctx.lineTo(-23, -25);
                ctx.lineTo(-13, -25);
                ctx.closePath();
                ctx.fill();
                // Right horn
                ctx.beginPath();
                ctx.moveTo(18, -35);
                ctx.lineTo(23, -25);
                ctx.lineTo(13, -25);
                ctx.closePath();
                ctx.fill();
                break;
            }
        }
        ctx.restore();
    }
    // If this is the Blowgunner head category, draw the Blowgunner head with the currently equipped headpiece
    else if (unitName === 'Blowgunner' && category === 'head') {
        const ctx = canvas.getContext('2d');
        const equippedHead = player.craftingLevels[unitName]?.[category] || 'Feather Headband';
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.translate(canvas.width / 2, canvas.height / 2);
        drawBlowgunnerHeadPreview(ctx, equippedHead);
        ctx.restore();
    }
    // If this is the Axeman chest category, draw the Axeman torso with the currently equipped chest armor
    else if (unitName === 'Axeman' && category === 'chest') {
        const ctx = canvas.getContext('2d');
        const equippedChest = player.craftingLevels[unitName]?.[category] || 'Leather Loincloth';
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.translate(canvas.width / 2, canvas.height / 2);
        switch (equippedChest) {
            case 'Leather Loincloth': {
                const loinclothColor = '#8B4513';
                ctx.fillStyle = loinclothColor;
                // Main loincloth body
                ctx.beginPath();
                ctx.moveTo(-15, -20);
                ctx.lineTo(15, -20);
                ctx.lineTo(20, 30);
                ctx.lineTo(-20, 30);
                ctx.closePath();
                ctx.fill();
                // Waistband
                ctx.fillStyle = '#654321';
                ctx.fillRect(-25, -25, 50, 10);
                break;
            }
            case 'Primal Leather Tunic': {
                // V-neck leather tunic with lacing and belt (preview)
                const leather = '#8B5A2B';
                const darkLeather = '#5C4033';
                const stitch = '#D2B48C';
                // Torso body with slight taper
                ctx.fillStyle = leather;
                ctx.beginPath();
                ctx.moveTo(-22, -28);
                ctx.lineTo(22, -28);
                ctx.lineTo(20, 28);
                ctx.lineTo(-20, 28);
                ctx.closePath();
                ctx.fill();
                // V-neck cutout
                ctx.fillStyle = '#e7c2a6'; // approximate skin tone in preview
                ctx.beginPath();
                ctx.moveTo(-6, -28);
                ctx.lineTo(6, -28);
                ctx.lineTo(0, -20);
                ctx.closePath();
                ctx.fill();
                // Lacing
                ctx.strokeStyle = stitch;
                ctx.lineWidth = 2;
                for (let i = 0; i < 4; i++) {
                    const y = -18 + i * 4;
                    ctx.beginPath();
                    ctx.moveTo(-4, y);
                    ctx.lineTo(4, y + 1);
                    ctx.moveTo(4, y);
                    ctx.lineTo(-4, y + 1);
                    ctx.stroke();
                }
                // Belt
                ctx.fillStyle = darkLeather;
                ctx.fillRect(-22, 14, 44, 5);
                // Hem notch
                ctx.fillRect(-2, 26, 4, 2);
                // Shoulder trim
                ctx.strokeStyle = darkLeather;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-22, -28);
                ctx.lineTo(-10, -32);
                ctx.moveTo(22, -28);
                ctx.lineTo(10, -32);
                ctx.stroke();
                break;
            }
            case 'Bone Plated Armor': {
                // Rib-like bone plates with sternum and straps (preview)
                const bone = '#EAE6D3';
                const strap = '#5C4033';
                const outline = '#B9B39C';
                const leatherBase = '#8B5A2B';
                // Leather base under ribs
                ctx.fillStyle = leatherBase;
                ctx.beginPath();
                ctx.moveTo(-22, -28);
                ctx.lineTo(22, -28);
                ctx.lineTo(20, 26);
                ctx.lineTo(-20, 26);
                ctx.closePath();
                ctx.fill();
                // Sternum
                ctx.fillStyle = bone;
                ctx.beginPath();
                ctx.moveTo(-2, -28);
                ctx.lineTo(2, -28);
                ctx.lineTo(3, 22);
                ctx.lineTo(-3, 22);
                ctx.closePath();
                ctx.fill();
                // Ribs left/right
                for (let i = 0; i < 4; i++) {
                    const y = -24 + i * 8;
                    // left
                    ctx.beginPath();
                    ctx.moveTo(-3, y);
                    ctx.lineTo(-22, y + 2);
                    ctx.lineTo(-22, y + 5);
                    ctx.lineTo(-3, y + 3);
                    ctx.closePath();
                    ctx.fillStyle = bone;
                    ctx.fill();
                    // right
                    ctx.beginPath();
                    ctx.moveTo(3, y);
                    ctx.lineTo(22, y + 2);
                    ctx.lineTo(22, y + 5);
                    ctx.lineTo(3, y + 3);
                    ctx.closePath();
                    ctx.fillStyle = bone;
                    ctx.fill();
                }
                // Shoulder bone caps
                ctx.beginPath();
                ctx.arc(-24, -28, 8, 0, Math.PI * 2);
                ctx.arc(24, -28, 8, 0, Math.PI * 2);
                ctx.fillStyle = bone;
                ctx.fill();
                // Leather straps
                ctx.fillStyle = strap;
                ctx.fillRect(-24, -6, 48, 4);
                ctx.fillRect(-24, 6, 48, 4);
                // Outline accent
                ctx.strokeStyle = outline;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-22, -6);
                ctx.lineTo(22, -6);
                ctx.stroke();
                break;
            }
        }
        ctx.restore();
    }
    else if (unitName === 'Blowgunner' && category === 'chest') {
        const ctx = canvas.getContext('2d');
        const equippedChest = player.craftingLevels[unitName]?.[category] || 'Leather Dress';
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.translate(canvas.width / 2, canvas.height / 2);
        drawBlowgunnerChestPreview(ctx, equippedChest);
        ctx.restore();
    }
    // If this is the Axeman weapon category, draw the currently equipped weapon
    else if (unitName === 'Axeman' && category === 'weapon') {
        const ctx = canvas.getContext('2d');
        const equippedWeapon = player.craftingLevels[unitName]?.[category] || 'Simple Stone Axe';
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.translate(canvas.width / 2, canvas.height / 2);
        switch (equippedWeapon) {
            case 'Simple Stone Axe': {
                const axeHandleColor = '#A0522D';
                const axeHeadColor = '#C0C0C0';
                ctx.fillStyle = axeHandleColor;
                ctx.fillRect(-2.5, -25, 5, 50);
                ctx.fillStyle = axeHeadColor;
                ctx.beginPath();
                ctx.moveTo(2.5, -32);
                ctx.lineTo(12, -36);
                ctx.lineTo(12, -12);
                ctx.lineTo(2.5, -8);
                ctx.closePath();
                ctx.fill();
                break;
            }
            case 'Obsidian Axe': {
                const axeHandleColor = '#A0522D';
                const axeHeadColor = '#343434';
                ctx.fillStyle = axeHandleColor;
                ctx.fillRect(-2.5, -25, 5, 50);
                ctx.fillStyle = axeHeadColor;
                ctx.beginPath();
                ctx.moveTo(2.5, -32);
                ctx.lineTo(17, -38);
                ctx.lineTo(17, -12);
                ctx.lineTo(2.5, -8);
                ctx.closePath();
                ctx.fill();
                break;
            }
            case 'Jagged Bone Axe': {
                const axeHandleColor = '#654321';
                const axeHeadColor = '#F5F5DC';
                ctx.fillStyle = axeHandleColor;
                ctx.fillRect(-2.5, -25, 5, 50);
                ctx.fillStyle = axeHeadColor;
                ctx.beginPath();
                ctx.moveTo(2.5, -30);
                ctx.lineTo(10, -35);
                ctx.lineTo(15, -32);
                ctx.lineTo(17, -25);
                ctx.lineTo(15, -18);
                ctx.lineTo(10, -15);
                ctx.lineTo(2.5, -18);
                ctx.closePath();
                ctx.fill();
                break;
            }
        }
        ctx.restore();
    }
    else if (unitName === 'Blowgunner' && category === 'weapon') {
        const ctx = canvas.getContext('2d');
        const equippedWeapon = player.craftingLevels[unitName]?.[category] || 'Reed Blow Pipe';
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.translate(canvas.width / 2, canvas.height / 2);
        drawBlowgunnerWeaponPreview(ctx, equippedWeapon);
        ctx.restore();
    }
    card.appendChild(canvas);
    const info = document.createElement('div');
    info.innerHTML = `<h3>${category.charAt(0).toUpperCase() + category.slice(1)} Upgrades</h3>`;
    card.appendChild(info);

    return card;
}

function createCraftingCard(itemConfig, unitName, category) {
    const card = document.createElement('div');
    card.className = 'choice-card';
    
    const canvas = document.createElement('canvas');
    canvas.id = `craft-canvas-${itemConfig.name.replace(/\s+/g, '-')}`;
    // Ensure visible canvas size for item previews
    canvas.width = 160;
    canvas.height = 120;
    card.appendChild(canvas);
    
    const info = document.createElement('div');
    const isEquipped = player.craftingLevels[unitName]?.[category] === itemConfig.name;

    let infoHTML = `<h3>${itemConfig.name}</h3>`;
    if (isEquipped) {
        infoHTML += `<p>EQUIPPED</p>`;
    }
    infoHTML += `<p>Effect: ${itemConfig.description}</p>`;
    if (itemConfig.goldCost > 0) {
        infoHTML += `<p>Cost: ${itemConfig.goldCost}G, ${itemConfig.expCost}Exp</p>`;
    }
    info.innerHTML = infoHTML;
    card.appendChild(info);

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'crafting-button-container';
    
    const craftBtn = document.createElement('button');
    craftBtn.className = 'unit-btn';
    craftBtn.style.backgroundColor = '#d2b48c';
    craftBtn.style.color = '#5d4037';
    craftBtn.style.border = '2px solid #8b4513';
    craftBtn.textContent = isEquipped ? 'Equipped' : 'Craft';
    if (!isEquipped) {
        craftBtn.disabled = player.gold < itemConfig.goldCost || player.exp < itemConfig.expCost;
        craftBtn.onclick = (e) => {
            e.stopPropagation();
            purchaseCraftingUpgrade(itemConfig.name, unitName, category);
        };
    } else {
        craftBtn.disabled = true;
    }
    buttonContainer.appendChild(craftBtn);
    card.appendChild(buttonContainer);

    craftingPreviews[canvas.id] = {
        ctx: canvas.getContext('2d'),
        itemName: itemConfig.name,
        unitName: unitName,
        category: category
    };

    return card;
}

function drawCraftingItems() {
    for (const key in craftingPreviews) {
        const preview = craftingPreviews[key];
        const ctx = preview.ctx;
        const canvas = ctx.canvas;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        // Center the origin point for easier drawing
        ctx.translate(canvas.width / 2, canvas.height / 2);

        // If this is a head item for Axeman, draw Axeman head wearing it
        if (preview.unitName === 'Axeman' && preview.category === 'head') {
            const skinColor = '#F0C29F';
            // Draw head circle
            ctx.fillStyle = skinColor;
            ctx.beginPath();
            ctx.arc(0, 0, 22, 0, Math.PI * 2);
            ctx.fill();
            // Draw the specific headgear on the head
            switch (preview.itemName) {
                case 'Fur Hat': {
                    const hatBodyColor = '#5C4033';
                    const hatStripeColor = '#A0522D';
                    // Dome
                    ctx.fillStyle = hatBodyColor;
                    ctx.beginPath();
                    ctx.arc(0, -6, 24, Math.PI, 0);
                    ctx.fill();
                    // Tail stripes
                    ctx.fillStyle = hatStripeColor;
                    ctx.fillRect(-30, -10, 30, 6);
                    ctx.fillStyle = hatBodyColor;
                    for (let i = -28; i <= -6; i += 6) ctx.fillRect(i, -10, 3, 6);
                    break;
                }
                case 'Leather Cap': {
                    // Smaller dome cap with front brim and stitching
                    ctx.fillStyle = '#8B4513';
                    ctx.beginPath();
                    ctx.arc(0, -6, 20, Math.PI, 0);
                    ctx.fill();
                    // Brim
                    ctx.fillStyle = '#7A3F1A';
                    ctx.fillRect(-10, -6, 20, 4);
                    // Stitches
                    ctx.strokeStyle = '#A4703A';
                    ctx.lineWidth = 2;
                    for (let i = -10; i <= 10; i += 10) {
                        ctx.beginPath();
                        ctx.moveTo(i, -10);
                        ctx.lineTo(i, -6);
                        ctx.stroke();
                    }
                    break;
                }
                case 'Bone Helmet': {
                    // Deer skull style mask (preview) - WITH HORNS
                    const bone = '#E9E4CF';
                    const shadow = '#D8D2B8';
                    // Upper skull dome
                    ctx.fillStyle = bone;
                    ctx.beginPath();
                    ctx.ellipse(0, -10, 22, 16, 0, Math.PI, 0);
                    ctx.fill();
                    // Lower mask/jaw
                    ctx.beginPath();
                    ctx.moveTo(-18, -10);
                    ctx.lineTo(18, -10);
                    ctx.lineTo(14, 0);
                    ctx.lineTo(-14, 0);
                    ctx.closePath();
                    ctx.fill();
                    // Shading strip
                    ctx.fillStyle = shadow;
                    ctx.fillRect(-16, -7, 32, 3);
                    // Eye sockets
                    ctx.fillStyle = 'black';
                    ctx.beginPath();
                    ctx.arc(-8, -14, 4, 0, Math.PI * 2);
                    ctx.arc(8, -14, 4, 0, Math.PI * 2);
                    ctx.fill();
                    // Nasal opening
                    ctx.beginPath();
                    ctx.moveTo(0, -10);
                    ctx.lineTo(-3, -4);
                    ctx.lineTo(3, -4);
                    ctx.closePath();
                    ctx.fillStyle = '#8C8366';
                    ctx.fill();
                    // Add horns - triangular shape pointing UP
                    ctx.fillStyle = bone;
                    // Left horn
                    ctx.beginPath();
                    ctx.moveTo(-18, -35);
                    ctx.lineTo(-23, -25);
                    ctx.lineTo(-13, -25);
                    ctx.closePath();
                    ctx.fill();
                    // Right horn
                    ctx.beginPath();
                    ctx.moveTo(18, -35);
                    ctx.lineTo(23, -25);
                    ctx.lineTo(13, -25);
                    ctx.closePath();
                    ctx.fill();
                    break;
                }
            }

            ctx.restore();
            continue;
        }

        if (preview.unitName === 'Blowgunner' && preview.category === 'head') {
            drawBlowgunnerHeadPreview(ctx, preview.itemName);
            ctx.restore();
            continue;
        }

        // Use a switch to draw the correct item based on its name
        switch (preview.itemName) {
            case 'Simple Stone Axe':
                {
                    const axeHandleColor = '#A0522D';
                    const axeHeadColor = '#C0C0C0';
                    ctx.fillStyle = axeHandleColor;
                    ctx.fillRect(-2.5, -25, 5, 50);
                    ctx.fillStyle = axeHeadColor;
                    ctx.beginPath();
                    ctx.moveTo(2.5, -30);
                    ctx.lineTo(15, -35);
                    ctx.lineTo(15, -15);
                    ctx.lineTo(2.5, -10);
                    ctx.closePath();
                    ctx.fill();
                    break;
                }
            case 'Obsidian Axe':
                {
                    const axeHandleColor = '#A0522D';
                    const axeHeadColor = '#343434';
                    ctx.fillStyle = axeHandleColor;
                    ctx.fillRect(-2.5, -25, 5, 50);
                    ctx.fillStyle = axeHeadColor;
                    ctx.beginPath();
                    ctx.moveTo(2.5, -32);
                    ctx.lineTo(17, -38);
                    ctx.lineTo(17, -12);
                    ctx.lineTo(2.5, -8);
                    ctx.closePath();
                    ctx.fill();
                    break;
                }
            case 'Jagged Bone Axe':
                {
                    const axeHandleColor = '#654321';
                    const axeHeadColor = '#F5F5DC';
                    ctx.fillStyle = axeHandleColor;
                    ctx.fillRect(-2.5, -25, 5, 50);
                    ctx.fillStyle = axeHeadColor;
                    ctx.beginPath();
                    ctx.moveTo(2.5, -30);
                    ctx.lineTo(10, -35);
                    ctx.lineTo(15, -32);
                    ctx.lineTo(17, -25);
                    ctx.lineTo(15, -18);
                    ctx.lineTo(10, -15);
                    ctx.lineTo(2.5, -18);
                    ctx.closePath();
                    ctx.fill();
                    break;
                }
            case 'Leather Loincloth':
                {
                    const loinclothColor = '#8B4513';
                    ctx.fillStyle = loinclothColor;
                    // Main loincloth body
                    ctx.beginPath();
                    ctx.moveTo(-15, -20);
                    ctx.lineTo(15, -20);
                    ctx.lineTo(20, 30);
                    ctx.lineTo(-20, 30);
                    ctx.closePath();
                    ctx.fill();
                    // Waistband
                    ctx.fillStyle = '#654321';
                    ctx.fillRect(-25, -25, 50, 10);
                    break;
                }
            case 'Primal Leather Tunic':
                {
                    // V-neck leather tunic with lacing and belt (preview)
                    const leather = '#8B5A2B';
                    const darkLeather = '#5C4033';
                    const stitch = '#D2B48C';
                    // Torso body with slight taper
                    ctx.fillStyle = leather;
                    ctx.beginPath();
                    ctx.moveTo(-22, -28);
                    ctx.lineTo(22, -28);
                    ctx.lineTo(20, 28);
                    ctx.lineTo(-20, 28);
                    ctx.closePath();
                    ctx.fill();
                    // V-neck cutout
                    ctx.fillStyle = '#e7c2a6'; // approximate skin tone in preview
                    ctx.beginPath();
                    ctx.moveTo(-6, -28);
                    ctx.lineTo(6, -28);
                    ctx.lineTo(0, -20);
                    ctx.closePath();
                    ctx.fill();
                    // Lacing
                    ctx.strokeStyle = stitch;
                    ctx.lineWidth = 2;
                    for (let i = 0; i < 4; i++) {
                        const y = -18 + i * 4;
                        ctx.beginPath();
                        ctx.moveTo(-4, y);
                        ctx.lineTo(4, y + 1);
                        ctx.moveTo(4, y);
                        ctx.lineTo(-4, y + 1);
                        ctx.stroke();
                    }
                    // Belt
                    ctx.fillStyle = darkLeather;
                    ctx.fillRect(-22, 14, 44, 5);
                    // Hem notch
                    ctx.fillRect(-2, 26, 4, 2);
                    // Shoulder trim
                    ctx.strokeStyle = darkLeather;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(-22, -28);
                    ctx.lineTo(-10, -32);
                    ctx.moveTo(22, -28);
                    ctx.lineTo(10, -32);
                    ctx.stroke();
                    break;
                }
            case 'Bone Plated Armor':
                {
                    // Rib-like bone plates with sternum and straps (preview)
                    const bone = '#EAE6D3';
                    const strap = '#5C4033';
                    const outline = '#B9B39C';
                    const leatherBase = '#8B5A2B';
                    // Leather base under ribs
                    ctx.fillStyle = leatherBase;
                    ctx.beginPath();
                    ctx.moveTo(-22, -28);
                    ctx.lineTo(22, -28);
                    ctx.lineTo(20, 26);
                    ctx.lineTo(-20, 26);
                    ctx.closePath();
                    ctx.fill();
                    // Sternum
                    ctx.fillStyle = bone;
                    ctx.beginPath();
                    ctx.moveTo(-2, -28);
                    ctx.lineTo(2, -28);
                    ctx.lineTo(3, 22);
                    ctx.lineTo(-3, 22);
                    ctx.closePath();
                    ctx.fill();
                    // Ribs left/right
                    for (let i = 0; i < 4; i++) {
                        const y = -24 + i * 8;
                        // left
                        ctx.beginPath();
                        ctx.moveTo(-3, y);
                        ctx.lineTo(-22, y + 2);
                        ctx.lineTo(-22, y + 5);
                        ctx.lineTo(-3, y + 3);
                        ctx.closePath();
                        ctx.fillStyle = bone;
                        ctx.fill();
                        // right
                        ctx.beginPath();
                        ctx.moveTo(3, y);
                        ctx.lineTo(22, y + 2);
                        ctx.lineTo(22, y + 5);
                        ctx.lineTo(3, y + 3);
                        ctx.closePath();
                        ctx.fillStyle = bone;
                        ctx.fill();
                    }
                    // Shoulder bone caps
                    ctx.beginPath();
                    ctx.arc(-24, -28, 8, 0, Math.PI * 2);
                    ctx.arc(24, -28, 8, 0, Math.PI * 2);
                    ctx.fillStyle = bone;
                    ctx.fill();
                    // Leather straps
                    ctx.fillStyle = strap;
                    ctx.fillRect(-24, -6, 48, 4);
                    ctx.fillRect(-24, 6, 48, 4);
                    // Outline accent
                    ctx.strokeStyle = outline;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(-22, -6);
                    ctx.lineTo(22, -6);
                    ctx.stroke();
                    break;
                }
            case 'Fur Hat':
                {
                    // Draw the main hat body
                    ctx.fillStyle = '#8B4513';
                    ctx.beginPath();
                    ctx.ellipse(0, -15, 20, 10, 0, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Add fur texture
                    ctx.strokeStyle = '#A0522D';
                    ctx.lineWidth = 2;
                    for (let i = -15; i <= 15; i += 3) {
                        ctx.beginPath();
                        ctx.arc(i, -15, 10, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                    
                    // Add ear flaps
                    ctx.fillStyle = '#8B4513';
                    // Left ear flap
                    ctx.beginPath();
                    ctx.ellipse(-18, -10, 8, 12, Math.PI/4, 0, Math.PI * 2);
                    ctx.fill();
                    // Right ear flap
                    ctx.beginPath();
                    ctx.ellipse(18, -10, 8, 12, -Math.PI/4, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Add fur trim
                    ctx.strokeStyle = '#A0522D';
                    // Left trim
                    for (let i = 0; i < 5; i++) {
                        ctx.beginPath();
                        ctx.arc(-18 + i*2, -10 + i, 2, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                    // Right trim
                    for (let i = 0; i < 5; i++) {
                        ctx.beginPath();
                        ctx.arc(18 - i*2, -10 + i, 2, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                    break;
                }
            case 'Leather Cap':
                {
                    // Draw the main cap
                    ctx.fillStyle = '#8B4513';
                    ctx.beginPath();
                    // Top curve
                    ctx.ellipse(0, -15, 15, 8, 0, 0, Math.PI);
                    // Sides and bottom
                    ctx.lineTo(-15, 0);
                    ctx.lineTo(15, 0);
                    ctx.closePath();
                    ctx.fill();
                    
                    // Add stitching
                    ctx.strokeStyle = '#654321';
                    ctx.lineWidth = 1;
                    // Vertical stitching
                    for (let x = -10; x <= 10; x += 5) {
                        ctx.beginPath();
                        ctx.moveTo(x, -15);
                        ctx.lineTo(x, 0);
                        ctx.stroke();
                    }
                    // Horizontal stitching
                    for (let y = -14; y < 0; y += 3) {
                        ctx.beginPath();
                        ctx.moveTo(-15, y);
                        ctx.lineTo(15, y);
                        ctx.stroke();
                    }
                    
                    // Add a brim
                    ctx.fillStyle = '#654321';
                    ctx.fillRect(-18, 0, 36, 3);
                    
                    // Add a small feather for decoration
                    ctx.fillStyle = '#4169E1';
                    ctx.beginPath();
                    ctx.moveTo(15, -10);
                    ctx.quadraticCurveTo(25, -15, 20, -25);
                    ctx.quadraticCurveTo(15, -20, 15, -10);
                    ctx.fill();
                    break;
                }
            case 'Bone Helmet':
                {
                    // Draw the main helmet
                    ctx.fillStyle = '#F5F5DC';
                    // Top of helmet
                    ctx.beginPath();
                    ctx.ellipse(0, -20, 18, 12, 0, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Sides and front
                    ctx.beginPath();
                    ctx.moveTo(-18, -20);
                    ctx.lineTo(-15, 5);
                    ctx.lineTo(15, 5);
                    ctx.lineTo(18, -20);
                    ctx.closePath();
                    ctx.fill();
                    
                    // Add bone texture
                    ctx.strokeStyle = '#D2B48C';
                    ctx.lineWidth = 2;
                    // Vertical lines
                    for (let x = -15; x <= 15; x += 5) {
                        ctx.beginPath();
                        ctx.moveTo(x, -20);
                        ctx.lineTo(x, 5);
                        ctx.stroke();
                    }
                    // Horizontal lines
                    for (let y = -15; y <= 0; y += 5) {
                        ctx.beginPath();
                        ctx.moveTo(-15, y);
                        ctx.lineTo(15, y);
                        ctx.stroke();
                    }
                    
                    // Add nose guard
                    ctx.fillStyle = '#F5F5DC';
                    ctx.beginPath();
                    ctx.moveTo(-5, 0);
                    ctx.lineTo(5, 0);
                    ctx.lineTo(0, 15);
                    ctx.closePath();
                    ctx.fill();
                    
                    // Add some battle damage/scratches
                    ctx.strokeStyle = '#8B4513';
                    ctx.lineWidth = 1;
                    // Random scratches
                    for (let i = 0; i < 5; i++) {
                        const x1 = Math.random() * 30 - 15;
                        const y1 = Math.random() * 20 - 20;
                        const length = 5 + Math.random() * 10;
                        const angle = Math.random() * Math.PI * 2;
                        ctx.beginPath();
                        ctx.moveTo(x1, y1);
                        ctx.lineTo(x1 + Math.cos(angle) * length, y1 + Math.sin(angle) * length);
                        ctx.stroke();
                    }
                    
                    // Add horns - triangular pointing UP
                    ctx.fillStyle = '#F5F5DC';
                    // Left horn
                    ctx.beginPath();
                    ctx.moveTo(-18, -35);
                    ctx.lineTo(-23, -25);
                    ctx.lineTo(-13, -25);
                    ctx.closePath();
                    ctx.fill();
                    // Right horn
                    ctx.beginPath();
                    ctx.moveTo(18, -35);
                    ctx.lineTo(23, -25);
                    ctx.lineTo(13, -25);
                    ctx.closePath();
                    ctx.fill();
                    break;
                }
            case 'Feather Headband':
            case 'Leather Hood':
            case 'Bone Mask':
                {
                    drawBlowgunnerHeadPreview(ctx, preview.itemName);
                    break;
                }
            case 'Leather Dress':
            case 'Leather Jerkin':
            case 'Bone Plated Vest':
                {
                    drawBlowgunnerChestPreview(ctx, preview.itemName);
                    break;
                }
            case 'Reed Blow Pipe':
            case 'Hardened Blowpipe':
            case 'Poisoned Darts':
                {
                    drawBlowgunnerWeaponPreview(ctx, preview.itemName);
                    break;
                }
        }
        ctx.restore();
    }
}


function craftingLoop() {
    if (craftingOverlay.style.display === 'none') return;
    drawCraftingItems();
    requestAnimationFrame(craftingLoop);
}

craftingBackBtn.addEventListener('click', () => {
    if (craftingUIState === 'upgrade-selection') {
        craftingUIState = 'category-selection';
        populateCraftingUI();
    } else if (craftingUIState === 'category-selection') {
        craftingUIState = 'unit-selection';
        populateCraftingUI();
    } else {
        closeCraftingUI();
    }
});


function showSpecialUnitChoice() {
    if (player.exp < SPECIAL_UNIT_UNLOCK_COST) return;

    player.exp -= SPECIAL_UNIT_UNLOCK_COST;
    isPaused = true;
    pauseBtn.textContent = 'Unpause';
    specialUnitChoiceOverlay.style.display = 'flex';

    const specialUnits = ageSettings[2].specialUnits;
    const unit1Config = specialUnits[0]; // Falcon Caster
    const unit2Config = specialUnits[1]; // Earth Guardian

    choiceInfo1.innerHTML = `<h3>${unit1Config.name}</h3><p>Health: ${unit1Config.hp}</p><p>Damage: ${unit1Config.damage}</p><p>Cost: ${unit1Config.cost} Gold</p>`;
    choicePreviewUnit1 = new Unit(unit1Config, 'player', true); // true indicates this is a preview unit
    choicePreviewUnit1.x = choiceCanvas1.width / 2 - choicePreviewUnit1.width / 2;
    choicePreviewUnit1.y = choiceCanvas1.height - groundHeight - choicePreviewUnit1.height;

    choiceInfo2.innerHTML = `<h3>${unit2Config.name}</h3><p>Health: ${unit2Config.hp}</p><p>Damage: ${unit2Config.damage}</p><p>Cost: ${unit2Config.cost} Gold</p>`;
    choicePreviewUnit2 = new Unit(unit2Config, 'player', true); // true indicates this is a preview unit
    choicePreviewUnit2.x = choiceCanvas2.width / 2 - choicePreviewUnit2.width / 2;
    choicePreviewUnit2.y = choiceCanvas2.height - groundHeight - choicePreviewUnit2.height;

    choiceCard1.classList.add('slide-in-left');
    choiceCard2.classList.add('slide-in-right');
    
    confirmSpecialUnitBtn.disabled = true;
    specialUnitChoiceLoop();
}

function init() {
    resizeCanvas();
    setupUI();
    initMusic();
    initStars();
    speed1xBtn.disabled = true;
    speed3xBtn.disabled = false;

    player.craftingLevels = {
        'Axeman': {
            head: 'Fur Hat',
            chest: 'Leather Loincloth',
            weapon: 'Simple Stone Axe'
        },
        'Blowgunner': {
            head: 'Feather Headband',
            chest: 'Leather Dress',
            weapon: 'Reed Blow Pipe'
        }
    };

    // Add back button event listener for specialist choice overlay
    document.getElementById('back-special-unit').addEventListener('click', () => {
        // Return the exp cost since they're backing out
        player.exp += SPECIAL_UNIT_UNLOCK_COST;
        
        // Hide the overlay and reset the UI
        specialUnitChoiceOverlay.style.display = 'none';
        choiceCard1.classList.remove('slide-in-left', 'selected');
        choiceCard2.classList.remove('slide-in-right', 'selected');
        
        // Reset selection
        specialUnitSelection = null;
        confirmSpecialUnitBtn.disabled = true;
        
        // Resume the game
        isPaused = false;
        pauseBtn.textContent = 'Pause';
        updateUI();
    });

    choiceCard1.addEventListener('click', () => {
        specialUnitSelection = ageSettings[2].specialUnits[0].name;
        choiceCard1.classList.add('selected');
        choiceCard2.classList.remove('selected');
        confirmSpecialUnitBtn.disabled = false;
    });

    choiceCard2.addEventListener('click', () => {
        specialUnitSelection = ageSettings[2].specialUnits[1].name;
        choiceCard2.classList.add('selected');
        choiceCard1.classList.remove('selected');
        confirmSpecialUnitBtn.disabled = false;
    });

    confirmSpecialUnitBtn.addEventListener('click', () => {
        if (!specialUnitSelection) return;

        player.specialUnitUnlocked = true;
        player.chosenSpecialUnit = specialUnitSelection;

        const unchosenCard = specialUnitSelection === ageSettings[2].specialUnits[0].name ? choiceCard2 : choiceCard1;
        unchosenCard.classList.add('slide-out-up');

        setTimeout(() => {
            specialUnitChoiceOverlay.style.display = 'none';
            unchosenCard.classList.remove('slide-out-up');
            choiceCard1.classList.remove('slide-in-left', 'selected');
            choiceCard2.classList.remove('slide-in-right', 'selected');
            isPaused = false;
            pauseBtn.textContent = 'Pause';
            setupUI();
            updateUI();
        }, 500);
    });

    requestAnimationFrame(gameLoop);
}

// Track cheat code keys
let cheatZ = false;
let cheat2 = false;
let isCheatActive = false;
let originalGold = 0;
let originalExp = 0;

window.addEventListener('keydown', (e) => {
    // Allow arrow key panning even when paused
    if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        panLeftKeyDown = true;
    } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        panRightKeyDown = true;
    } else if (e.key.toLowerCase() === 'z') {
        cheatZ = true;
    } else if (e.key === '2') {
        cheat2 = true;
    }
    
    // Check for cheat code (Z + 2)
    if (cheatZ && cheat2) {
        if (!isCheatActive) {
            isCheatActive = true;
            originalGold = player.gold;
            originalExp = player.exp;
            player.gold = Infinity;
            player.exp = Infinity;
            updateUI();
        }
    }
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        panLeftKeyDown = false;
    } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        panRightKeyDown = false;
    } else if (e.key.toLowerCase() === 'z') {
        cheatZ = false;
        if (isCheatActive) {
            isCheatActive = false;
            player.gold = originalGold;
            player.exp = originalExp;
            updateUI();
        }
    } else if (e.key === '2') {
        cheat2 = false;
        if (isCheatActive) {
            isCheatActive = false;
            player.gold = originalGold;
            player.exp = originalExp;
            updateUI();
        }
    }
});

init();
window.addEven
tListener('resize', resizeCanvas);


