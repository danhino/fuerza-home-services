/**
 * Fuerza Home Services — Service Catalog
 *
 * Fully typed catalog of all services offered across all trade categories.
 * Each service defines its question flow for the ServiceQuestionsScreen.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type QuestionType = 'choice' | 'photo';

export interface ChoiceQuestion {
    id: string;
    type: 'choice';
    label: string;
    hint?: string;
    options: string[];
}

export interface PhotoQuestion {
    id: string;
    type: 'photo';
    label: string;
    hint?: string;
}

export type Question = ChoiceQuestion | PhotoQuestion;

export type CategoryId =
    | 'electrical'
    | 'plumbing'
    | 'hvac'
    | 'general'
    | 'appliances'
    | 'landscaping'
    | 'house_cleaning';

export interface Category {
    id: CategoryId;
    name: string;
    icon: string;
}

export interface Service {
    id: string;
    name: string;
    icon: string;
    category: CategoryId;
    hint: string;
    questions: Question[];
}

// ─── Categories ──────────────────────────────────────────────────────────────

export const CATEGORIES: Category[] = [
    { id: 'electrical', name: 'Electrical', icon: '⚡' },
    { id: 'plumbing',   name: 'Plumbing',   icon: '🔧' },
    { id: 'hvac',       name: 'HVAC',        icon: '❄️' },
    { id: 'general',    name: 'General',     icon: '🏠' },
    { id: 'appliances', name: 'Appliances',  icon: '🫙' },
    { id: 'landscaping',name: 'Landscaping', icon: '🌿' },
    { id: 'house_cleaning', name: 'House Cleaning', icon: '🧹' },
];

// ─── Service Catalog ─────────────────────────────────────────────────────────

export const SERVICES: Service[] = [
    // ── ELECTRICAL ────────────────────────────────────────────────────────────
    {
        id: 'replace_outlet',
        name: 'Replace Outlet',
        icon: '🔌',
        category: 'electrical',
        hint: 'Repair or upgrade electrical outlets',
        questions: [
            {
                id: 'count',
                type: 'choice',
                label: 'How many outlets?',
                options: ['1 outlet', '2–3 outlets', '4–5 outlets', '6+'],
            },
            {
                id: 'outlet_type',
                type: 'choice',
                label: 'Outlet type?',
                options: ['Standard 15A', 'GFCI (kitchen/bath)', 'USB combo', 'Not sure'],
            },
            {
                id: 'issue',
                type: 'choice',
                label: "What's the issue?",
                options: ['Not working', 'Damaged / broken', 'Upgrade existing', 'New install'],
            },
            {
                id: 'photo',
                type: 'photo',
                label: 'Photo of the outlet(s)',
                hint: 'Helps tech come prepared',
            },
        ],
    },
    {
        id: 'ceiling_fan',
        name: 'Install Ceiling Fan',
        icon: '💨',
        category: 'electrical',
        hint: 'Install or replace ceiling fans',
        questions: [
            {
                id: 'fan_size',
                type: 'choice',
                label: 'Fan size?',
                options: ['Standard (< 52")', 'Large (52–72")', 'XL (> 72")', 'Not sure'],
            },
            {
                id: 'room',
                type: 'choice',
                label: 'Room?',
                options: ['Bedroom', 'Living room', 'Kitchen', 'Outdoor / patio'],
            },
            {
                id: 'floor',
                type: 'choice',
                label: 'Floor level?',
                options: ['Ground floor', 'Second floor', 'Third floor+'],
            },
            {
                id: 'wiring',
                type: 'choice',
                label: 'Existing ceiling box?',
                options: ['Yes — fan box there', 'Light fixture there now', 'No box at all', 'Not sure'],
            },
            {
                id: 'photo',
                type: 'photo',
                label: 'Photo of the ceiling location',
                hint: 'Show any existing fixture',
            },
        ],
    },
    {
        id: 'ev_charger',
        name: 'Install EV Charger',
        icon: '⚡',
        category: 'electrical',
        hint: 'Level 1 or Level 2 EV charger installation',
        questions: [
            {
                id: 'brand',
                type: 'choice',
                label: 'Charger brand?',
                options: ['Tesla Wall Connector', 'ChargePoint', 'Enel X JuiceBox', 'I already have it'],
            },
            {
                id: 'level',
                type: 'choice',
                label: 'Charger level?',
                options: ['Level 2 – 240V (recommended)', 'Level 1 – 120V (basic)', 'Not sure'],
            },
            {
                id: 'location',
                type: 'choice',
                label: 'Install location?',
                options: ['Garage (inside)', 'Exterior wall', 'Carport', 'Driveway'],
            },
            {
                id: 'panel_photo',
                type: 'photo',
                label: 'Photo of your electrical panel',
                hint: 'Required for panel capacity check',
            },
            {
                id: 'charger_photo',
                type: 'photo',
                label: 'Photo of charger (if you have it)',
                hint: 'Optional — skip if not yet purchased',
            },
        ],
    },

    // ── PLUMBING ──────────────────────────────────────────────────────────────
    {
        id: 'sink_leak',
        name: 'Leak Under Sink',
        icon: '💧',
        category: 'plumbing',
        hint: 'Fix leaking pipes under any sink',
        questions: [
            {
                id: 'which_sink',
                type: 'choice',
                label: 'Which sink?',
                options: ['Kitchen', 'Bathroom', 'Laundry room', 'Bar / utility'],
            },
            {
                id: 'severity',
                type: 'choice',
                label: 'How bad is the leak?',
                options: ['Slow drip', 'Steady drip', 'Spraying / gushing', 'Not sure'],
            },
            {
                id: 'urgency',
                type: 'choice',
                label: 'How urgent?',
                options: ['Emergency — water everywhere', 'Need it today', 'This week is fine'],
            },
            {
                id: 'photo',
                type: 'photo',
                label: 'Photo under the sink',
                hint: 'Show the pipes and leak area',
            },
        ],
    },
    {
        id: 'clog',
        name: 'Clogged Drain',
        icon: '🚿',
        category: 'plumbing',
        hint: 'Clear blocked or slow drains',
        questions: [
            {
                id: 'which_drain',
                type: 'choice',
                label: 'Which drain?',
                options: ['Kitchen sink', 'Bathroom sink', 'Shower / tub', 'Toilet', 'Floor drain'],
            },
            {
                id: 'severity',
                type: 'choice',
                label: 'How bad?',
                options: ['Draining slowly', 'Completely blocked', 'Backing up', 'Overflow risk'],
            },
            {
                id: 'tried',
                type: 'choice',
                label: 'Already tried anything?',
                options: ['Plunger', 'Chemical drain cleaner', 'Nothing yet', 'Multiple things'],
            },
        ],
    },

    // ── HVAC ──────────────────────────────────────────────────────────────────
    {
        id: 'ac_repair',
        name: 'AC Not Cooling',
        icon: '❄️',
        category: 'hvac',
        hint: 'Diagnose and repair AC issues',
        questions: [
            {
                id: 'symptom',
                type: 'choice',
                label: "What's happening?",
                options: ['Blowing warm air', 'Not turning on', 'Strange noise', 'Leaking water'],
            },
            {
                id: 'age',
                type: 'choice',
                label: 'Unit age (approx)?',
                options: ['Less than 5 years', '5–10 years', '10–15 years', '15+ years'],
            },
            {
                id: 'system_type',
                type: 'choice',
                label: 'System type?',
                options: ['Central AC', 'Mini-split', 'Window unit', 'Not sure'],
            },
            {
                id: 'photo',
                type: 'photo',
                label: 'Photo of your outdoor unit',
                hint: 'Include model label if visible',
            },
        ],
    },

    // ── GENERAL ───────────────────────────────────────────────────────────────
    {
        id: 'paint_room',
        name: 'Paint a Room',
        icon: '🎨',
        category: 'general',
        hint: 'Professional interior painting',
        questions: [
            {
                id: 'room_type',
                type: 'choice',
                label: 'Room type?',
                options: ['Bedroom', 'Living room', 'Kitchen', 'Bathroom', 'Full floor'],
            },
            {
                id: 'sqft',
                type: 'choice',
                label: 'Approximate size?',
                options: [
                    'Small (< 150 sq ft)',
                    'Medium (150–300 sq ft)',
                    'Large (300–500 sq ft)',
                    'Open floor plan 500+',
                ],
            },
            {
                id: 'coats',
                type: 'choice',
                label: 'Number of coats?',
                options: ['1 coat touch-up', '2 coats (standard)', 'Primer + 2 coats', 'Not sure'],
            },
            {
                id: 'photo',
                type: 'photo',
                label: 'Photo of the room',
                hint: 'Show current condition of walls',
            },
        ],
    },

    // ── APPLIANCES ────────────────────────────────────────────────────────────
    {
        id: 'washer_repair',
        name: 'Washer Repair',
        icon: '🫧',
        category: 'appliances',
        hint: 'Diagnose and repair washing machine issues',
        questions: [
            {
                id: 'brand',
                type: 'choice',
                label: 'Brand?',
                options: ['Samsung', 'LG', 'Whirlpool', 'GE', 'Other'],
            },
            {
                id: 'issue',
                type: 'choice',
                label: "What's wrong?",
                options: ["Won't start", 'Not draining', 'Leaking water', 'Loud noise', 'Other'],
            },
            {
                id: 'age',
                type: 'choice',
                label: 'Appliance age?',
                options: ['< 3 years', '3–7 years', '7–12 years', '12+ years'],
            },
            {
                id: 'photo',
                type: 'photo',
                label: 'Photo of the appliance',
                hint: 'Include model info if visible',
            },
        ],
    },

    // ── LANDSCAPING ───────────────────────────────────────────────────────────
    {
        id: 'lawn_mowing',
        name: 'Lawn Mowing',
        icon: '🌿',
        category: 'landscaping',
        hint: 'Professional lawn mowing and yard care',
        questions: [
            {
                id: 'lawn_size',
                type: 'choice',
                label: 'Lawn size?',
                options: [
                    'Small (< 2,000 sq ft)',
                    'Medium (2–5k sq ft)',
                    'Large (5–10k sq ft)',
                    'XL (10k+ sq ft)',
                ],
            },
            {
                id: 'condition',
                type: 'choice',
                label: 'Current condition?',
                options: ['Well maintained', 'Needs trimming', 'Overgrown (6"+)', 'First cut in a while'],
            },
            {
                id: 'extras',
                type: 'choice',
                label: 'Add-ons needed?',
                options: ['Just mowing', 'Mow + edge', 'Mow + edge + blow', 'Full yard cleanup'],
            },
        ],
    },

    // ── HOUSE CLEANING ────────────────────────────────────────────────────────
    {
        id: 'standard_cleaning',
        name: 'Standard Cleaning',
        icon: '🏠',
        category: 'house_cleaning',
        hint: 'Regular home cleaning service',
        questions: [
            {
                id: 'home_size',
                type: 'choice',
                label: 'Home size?',
                options: [
                    'Studio / 1BR (< 700 sq ft)',
                    '2BR (700–1,100 sq ft)',
                    '3BR (1,100–1,800 sq ft)',
                    '4BR+ (1,800+ sq ft)',
                ],
            },
            {
                id: 'cleaning_type',
                type: 'choice',
                label: 'Type of clean?',
                options: [
                    'Standard clean',
                    'Deep clean',
                    'Move-in / Move-out',
                    'Post-construction',
                ],
            },
            {
                id: 'frequency',
                type: 'choice',
                label: 'How often?',
                options: [
                    'One-time',
                    'Weekly',
                    'Bi-weekly',
                    'Monthly',
                ],
            },
            {
                id: 'extras',
                type: 'choice',
                label: 'Add-ons?',
                options: [
                    'No extras',
                    'Inside fridge',
                    'Inside oven',
                    'Interior windows',
                    'Laundry (wash + fold)',
                ],
            },
        ],
    },
    {
        id: 'deep_cleaning',
        name: 'Deep Cleaning',
        icon: '✨',
        category: 'house_cleaning',
        hint: 'Thorough top-to-bottom cleaning',
        questions: [
            {
                id: 'home_size',
                type: 'choice',
                label: 'Home size?',
                options: [
                    'Studio / 1BR (< 700 sq ft)',
                    '2BR (700–1,100 sq ft)',
                    '3BR (1,100–1,800 sq ft)',
                    '4BR+ (1,800+ sq ft)',
                ],
            },
            {
                id: 'last_cleaned',
                type: 'choice',
                label: 'Last professionally cleaned?',
                options: [
                    'Within 3 months',
                    '3–6 months ago',
                    '6–12 months ago',
                    'Over a year / never',
                ],
            },
            {
                id: 'photo',
                type: 'photo',
                label: 'Photo of the main area',
                hint: 'Helps us estimate scope accurately',
            },
        ],
    },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Get all services for a given category */
export function getServicesByCategory(categoryId: CategoryId): Service[] {
    return SERVICES.filter((s) => s.category === categoryId);
}

/** Look up a single service by id */
export function getServiceById(id: string): Service | undefined {
    return SERVICES.find((s) => s.id === id);
}

/** Count services per category (used by CategorySelectScreen) */
export function getServiceCountByCategory(): Record<CategoryId, number> {
    const counts = {} as Record<CategoryId, number>;
    for (const cat of CATEGORIES) {
        counts[cat.id] = getServicesByCategory(cat.id).length;
    }
    return counts;
}
