/**
 * Fuerza Home Services — Pricing Engine
 *
 * Rules-based pricing for the service request flow.
 * Each service has a base [min, max] range; selected answers add to that range.
 * Returns { min, max } rounded to the nearest dollar.
 */

export interface PriceRange {
    min: number;
    max: number;
}

export interface PriceBreakdown {
    label: string;
    min: number;
    max: number;
}

export interface EstimateResult {
    min: number;
    max: number;
    breakdown: PriceBreakdown[];
}

// ─── Internal types ───────────────────────────────────────────────────────────

/** Maps an answer string to a [min, max] adder */
type AnswerAdder = Record<string, [number, number]>;

/** Per-question pricing rules: questionId → answer → [min, max] to add */
type QuestionRules = Record<string, AnswerAdder>;

interface ServicePricing {
    base: [number, number];
    /** question id → answer value → [min adder, max adder] */
    rules: QuestionRules;
}

// ─── Pricing matrix ───────────────────────────────────────────────────────────

const PRICING: Record<string, ServicePricing> = {
    replace_outlet: {
        base: [85, 140],
        rules: {
            count: {
                '2–3 outlets':  [30, 50],
                '4–5 outlets':  [70, 110],
                '6+':           [140, 220],
            },
            outlet_type: {
                'GFCI (kitchen/bath)': [20, 35],
                'USB combo':           [25, 40],
            },
        },
    },

    ceiling_fan: {
        base: [150, 280],
        rules: {
            fan_size: {
                'Large (52–72")': [40, 70],
                'XL (> 72")':     [90, 140],
            },
            floor: {
                'Second floor': [30, 50],
                'Third floor+': [70, 110],
            },
            wiring: {
                'No box at all': [60, 100],
            },
        },
    },

    ev_charger: {
        base: [800, 1400],
        rules: {
            level: {
                'Level 2 – 240V (recommended)': [200, 400],
            },
            location: {
                'Exterior wall': [50, 100],
                'Carport':       [80, 150],
                'Driveway':      [150, 250],
            },
        },
    },

    sink_leak: {
        base: [120, 220],
        rules: {
            severity: {
                'Steady drip':          [20, 40],
                'Spraying / gushing':   [60, 120],
            },
            urgency: {
                'Emergency — water everywhere': [80, 150],
                'Need it today':                [40, 80],
            },
        },
    },

    clog: {
        base: [90, 180],
        rules: {
            severity: {
                'Completely blocked': [20, 40],
                'Backing up':         [40, 70],
                'Overflow risk':      [60, 100],
            },
        },
    },

    ac_repair: {
        base: [150, 350],
        rules: {
            symptom: {
                'Not turning on': [50, 100],
                'Strange noise':  [30, 70],
                'Leaking water':  [40, 90],
            },
            age: {
                '10–15 years': [50, 100],
                '15+ years':   [100, 200],
            },
        },
    },

    paint_room: {
        base: [200, 450],
        rules: {
            sqft: {
                'Medium (150–300 sq ft)':  [100, 180],
                'Large (300–500 sq ft)':   [200, 320],
                'Open floor plan 500+':    [350, 550],
            },
            coats: {
                'Primer + 2 coats': [80, 150],
            },
        },
    },

    washer_repair: {
        base: [120, 250],
        rules: {
            age: {
                '7–12 years': [30, 60],
                '12+ years':  [60, 120],
            },
            issue: {
                'Not draining':   [30, 60],
                'Leaking water':  [40, 80],
            },
        },
    },

    lawn_mowing: {
        base: [45, 90],
        rules: {
            lawn_size: {
                'Medium (2–5k sq ft)':  [20, 35],
                'Large (5–10k sq ft)':  [40, 70],
                'XL (10k+ sq ft)':      [70, 130],
            },
            condition: {
                'Overgrown (6"+)':         [30, 60],
                'First cut in a while':    [40, 80],
            },
            extras: {
                'Mow + edge':           [15, 25],
                'Mow + edge + blow':    [25, 40],
                'Full yard cleanup':    [50, 90],
            },
        },
    },

    standard_cleaning: {
        base: [80, 150],
        rules: {
            home_size: {
                '2BR (700–1,100 sq ft)':    [30, 50],
                '3BR (1,100–1,800 sq ft)':  [60, 100],
                '4BR+ (1,800+ sq ft)':      [100, 160],
            },
            cleaning_type: {
                'Deep clean':              [40, 80],
                'Move-in / Move-out':      [60, 120],
                'Post-construction':       [80, 150],
            },
            extras: {
                'Inside fridge':           [15, 25],
                'Inside oven':             [15, 25],
                'Interior windows':        [20, 35],
                'Laundry (wash + fold)':   [25, 40],
            },
        },
    },

    deep_cleaning: {
        base: [150, 280],
        rules: {
            home_size: {
                '2BR (700–1,100 sq ft)':   [50, 80],
                '3BR (1,100–1,800 sq ft)': [90, 140],
                '4BR+ (1,800+ sq ft)':     [140, 220],
            },
            last_cleaned: {
                '6–12 months ago':        [30, 60],
                'Over a year / never':    [60, 120],
            },
        },
    },
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Calculate a price estimate for a given service and set of answers.
 *
 * @param serviceId - The service id from servicesCatalog (e.g. 'replace_outlet')
 * @param answers   - Map of questionId → selected answer string
 * @returns         - { min, max } rounded to nearest dollar, plus a breakdown
 */
export function calculateEstimate(
    serviceId: string,
    answers: Record<string, string>
): EstimateResult {
    const pricing = PRICING[serviceId];

    // Fallback for unlisted services
    if (!pricing) {
        return { min: 95, max: 300, breakdown: [{ label: 'Base rate', min: 95, max: 300 }] };
    }

    const breakdown: PriceBreakdown[] = [
        { label: 'Base rate', min: pricing.base[0], max: pricing.base[1] },
    ];

    let totalMin = pricing.base[0];
    let totalMax = pricing.base[1];

    for (const [questionId, answer] of Object.entries(answers)) {
        const questionRules = pricing.rules[questionId];
        if (!questionRules) continue;

        const adder = questionRules[answer];
        if (!adder) continue;

        const [addMin, addMax] = adder;
        totalMin += addMin;
        totalMax += addMax;

        breakdown.push({
            label: answer,
            min: addMin,
            max: addMax,
        });
    }

    return {
        min: Math.round(totalMin),
        max: Math.round(totalMax),
        breakdown,
    };
}
