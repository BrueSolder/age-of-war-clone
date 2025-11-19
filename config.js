// Game Configuration Constants
export const groundHeight = 50;
export const baseWidth = 100;
export const baseHeight = 105;
export const spawnCooldown = 2000;
export const DAY_DURATION = 120000;

// Game Constants
export const INITIAL_HP = 1000;
export const INITIAL_GOLD = 180;
export const INITIAL_AGE = 1;
export const INITIAL_EXP = 0;
export const SPECIAL_UNIT_UNLOCK_COST = 500;

// Performance settings
export const UI_UPDATE_INTERVAL = 80; // ms, throttle DOM updates

// Age Settings
export const ageSettings = {
    1: {
        name: "Pre-Stone Age",
        units: [
            { name: 'Clubman', cost: 15, hp: 50, damage: 10, range: 10, speed: 1, expValue: 40, goldValue: 20, type: 'melee', counters: 'ranged' },
            { name: 'Slinger', cost: 25, hp: 30, damage: 15, range: 100, speed: 0.8, expValue: 60, goldValue: 32, type: 'ranged', counters: 'melee' },
            { name: 'Log Rammer', cost: 80, hp: 200, damage: 13, range: 30, speed: 0.5, expValue: 150, goldValue: 110, type: 'melee', counters: 'ranged', knockbackForce: 30, stunDuration: 300 }
        ],
        ageUpCost: 650
    },
    2: {
        name: "Stone Age",
        units: [
            { name: 'Axeman', cost: 60, hp: 120, damage: 25, range: 10, speed: 1.1, expValue: 80, goldValue: 60, type: 'melee', counters: 'ranged' },
            { name: 'Blowgunner', cost: 75, hp: 90, damage: 30, range: 120, speed: 1, expValue: 80, goldValue: 55, type: 'ranged', counters: 'melee' },
            { name: 'Stone Guard', cost: 250, hp: 175, shieldHp: 300, damage: 20, maceDamage: 40, range: 10, speed: 0.3, expValue: 250, goldValue: 180, type: 'melee', damageReduction: { ranged: 0.5 } }
        ],
        specialUnits: [
            { name: 'Falcon Caster', cost: 150, hp: 130, damage: 15, range: 10, speed: 0.77, expValue: 100, goldValue: 80, type: 'caster' },
            { name: 'Earth Guardian', cost: 200, hp: 400, damage: 40, range: 10, speed: 0.4, expValue: 200, goldValue: 150, type: 'melee' },
        ],
        ageUpCost: 4000
    }
};

// Defense Settings
export const defenseSettings = {
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
        range: 300,
        attackCooldown: 2000,
        damage: 10,
        poisonDamage: 12,
        poisonDuration: 5000
    }
};

// Structure Settings
export const structureSettings = {
    'ancient-crafting-table': {
        name: 'Ancient Crafting Table',
        cost: 80,
        hp: 300,
        width: 60,
        height: 60
    }
};

// Crafting Settings
export const craftingSettings = {
    'Axeman': {
        'head': [
            { name: 'Leather Cap', goldCost: 150, expCost: 200, effect: { hp: 20 }, description: "+20 HP", purchased: false },
            { name: 'Bone Helmet', goldCost: 300, expCost: 400, effect: { hp: 40, damageReduction: 0.05 }, description: "+40 HP, 5% Dmg Reduction", purchased: false }
        ],
        'chest': [
            { name: 'Primal Leather Tunic', goldCost: 250, expCost: 400, effect: { hp: 75 }, description: "+75 HP", purchased: false },
            { name: 'Bone Plated Armor', goldCost: 600, expCost: 800, effect: { hp: 150, damageReduction: 0.1 }, description: "+150 HP, 10% Dmg Reduction", purchased: false }
        ],
        'weapon': [
            { name: 'Obsidian Axe', goldCost: 350, expCost: 500, effect: { damage: 15 }, description: "+15 Damage", purchased: false },
            { name: 'Jagged Bone Axe', goldCost: 700, expCost: 1000, effect: { damage: 30, attackSpeed: 0.15 }, description: "+30 Damage, 15% Atk Speed", purchased: false }
        ]
    },
    'Blowgunner': {
        'head': [
            { name: 'Leather Hood', goldCost: 150, expCost: 200, effect: { hp: 20 }, description: "+20 HP", purchased: false },
            { name: 'Bone Mask', goldCost: 300, expCost: 400, effect: { hp: 40, damageReduction: 0.05 }, description: "+40 HP, 5% Dmg Reduction", purchased: false }
        ],
        'chest': [
            { name: 'Leather Jerkin', goldCost: 250, expCost: 400, effect: { hp: 75 }, description: "+75 HP", purchased: false },
            { name: 'Bone Plated Vest', goldCost: 600, expCost: 800, effect: { hp: 150, damageReduction: 0.1 }, description: "+150 HP, 10% Dmg Reduction", purchased: false }
        ],
        'weapon': [
            { name: 'Hardened Blowpipe', goldCost: 350, expCost: 500, effect: { damage: 15 }, description: "+15 Damage", purchased: false },
            { name: 'Poisoned Darts', goldCost: 700, expCost: 1000, effect: { damage: 30, attackSpeed: 0.15 }, description: "+30 Damage, 15% Atk Speed", purchased: false }
        ]
    }
};
