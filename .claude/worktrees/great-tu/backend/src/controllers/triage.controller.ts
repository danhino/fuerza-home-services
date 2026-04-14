import { Request, Response } from 'express';

// ── Types ────────────────────────────────────────────────────────────────
interface TriageInput {
    trade: string;
    issueTag?: string;
    description?: string;
    photoUrls?: string[];
    videoUrl?: string;
    preferredLanguage?: string;
}

interface LikelyIssue {
    name: string;
    confidence: number;
}

interface TriageOutput {
    likelyIssues: LikelyIssue[];
    severity: 'URGENT_SAMEDAY' | 'SCHEDULED';
    timeEstimateLowMins: number;
    timeEstimateHighMins: number;
    priceLow: number;
    priceHigh: number;
}

// ── Deterministic Rules ──────────────────────────────────────────────────
// Each rule maps trade+issueTag to known estimates.
// When no tag matches, fall back to trade-level defaults.

interface IssueRule {
    name: string;
    severity: 'URGENT_SAMEDAY' | 'SCHEDULED';
    timeLow: number;
    timeHigh: number;
    priceLow: number;
    priceHigh: number;
}

const ISSUE_RULES: Record<string, Record<string, IssueRule>> = {
    PLUMBER: {
        leakUnderSink: { name: 'Leak under sink', severity: 'URGENT_SAMEDAY', timeLow: 30, timeHigh: 90, priceLow: 120, priceHigh: 350 },
        replaceToilet: { name: 'Toilet replacement', severity: 'SCHEDULED', timeLow: 60, timeHigh: 180, priceLow: 250, priceHigh: 600 },
        showerLever: { name: 'Shower lever repair', severity: 'SCHEDULED', timeLow: 30, timeHigh: 60, priceLow: 100, priceHigh: 250 },
        cloggedSink: { name: 'Clogged sink', severity: 'URGENT_SAMEDAY', timeLow: 20, timeHigh: 60, priceLow: 100, priceHigh: 300 },
        waterHeater: { name: 'Water heater issue', severity: 'URGENT_SAMEDAY', timeLow: 60, timeHigh: 240, priceLow: 200, priceHigh: 800 },
        runningToilet: { name: 'Running toilet', severity: 'SCHEDULED', timeLow: 20, timeHigh: 60, priceLow: 80, priceHigh: 200 },
        lowPressure: { name: 'Low water pressure', severity: 'SCHEDULED', timeLow: 30, timeHigh: 120, priceLow: 100, priceHigh: 400 },
    },
    ELECTRICIAN: {
        replaceOutlet: { name: 'Outlet replacement', severity: 'SCHEDULED', timeLow: 15, timeHigh: 45, priceLow: 75, priceHigh: 200 },
        ceilingFan: { name: 'Ceiling fan installation', severity: 'SCHEDULED', timeLow: 60, timeHigh: 120, priceLow: 150, priceHigh: 350 },
        evCharger: { name: 'EV charger installation', severity: 'SCHEDULED', timeLow: 120, timeHigh: 300, priceLow: 500, priceHigh: 1500 },
        breaker: { name: 'Circuit breaker replacement', severity: 'URGENT_SAMEDAY', timeLow: 30, timeHigh: 90, priceLow: 150, priceHigh: 400 },
        lightSwitch: { name: 'Light switch repair', severity: 'SCHEDULED', timeLow: 15, timeHigh: 45, priceLow: 60, priceHigh: 175 },
        gfci: { name: 'GFCI outlet tripping', severity: 'URGENT_SAMEDAY', timeLow: 20, timeHigh: 60, priceLow: 100, priceHigh: 275 },
        lightFixture: { name: 'Light fixture installation', severity: 'SCHEDULED', timeLow: 30, timeHigh: 90, priceLow: 100, priceHigh: 300 },
    },
    POOL: {
        pumpDiagnosis: { name: 'Pump diagnosis', severity: 'SCHEDULED', timeLow: 30, timeHigh: 60, priceLow: 100, priceHigh: 250 },
        cleaning: { name: 'Full pool cleaning', severity: 'SCHEDULED', timeLow: 60, timeHigh: 120, priceLow: 100, priceHigh: 250 },
        filterCleaning: { name: 'Filter cleaning/replacement', severity: 'SCHEDULED', timeLow: 30, timeHigh: 60, priceLow: 75, priceHigh: 200 },
        pumpStopped: { name: 'Pump stopped working', severity: 'URGENT_SAMEDAY', timeLow: 60, timeHigh: 180, priceLow: 200, priceHigh: 600 },
        stains: { name: 'Pool stain treatment', severity: 'SCHEDULED', timeLow: 60, timeHigh: 120, priceLow: 150, priceHigh: 400 },
        algae: { name: 'Algae treatment', severity: 'SCHEDULED', timeLow: 30, timeHigh: 90, priceLow: 100, priceHigh: 300 },
        cloudyWater: { name: 'Cloudy water treatment', severity: 'SCHEDULED', timeLow: 30, timeHigh: 60, priceLow: 75, priceHigh: 200 },
        lights: { name: 'Pool light repair', severity: 'SCHEDULED', timeLow: 30, timeHigh: 90, priceLow: 100, priceHigh: 350 },
    },
    CLEANING: {
        s: { name: 'Small house (1-2 rooms)', severity: 'SCHEDULED', timeLow: 60, timeHigh: 90, priceLow: 80, priceHigh: 150 },
        m: { name: 'Medium house (3-4 rooms)', severity: 'SCHEDULED', timeLow: 90, timeHigh: 150, priceLow: 120, priceHigh: 250 },
        l: { name: 'Large house (5-6 rooms)', severity: 'SCHEDULED', timeLow: 150, timeHigh: 240, priceLow: 200, priceHigh: 400 },
        xl: { name: 'XL house (7+ rooms)', severity: 'SCHEDULED', timeLow: 240, timeHigh: 360, priceLow: 350, priceHigh: 600 },
    },
};

// Trade-level fallbacks when no issueTag is provided
const TRADE_DEFAULTS: Record<string, IssueRule> = {
    PLUMBER: { name: 'General plumbing', severity: 'SCHEDULED', timeLow: 30, timeHigh: 180, priceLow: 100, priceHigh: 500 },
    ELECTRICIAN: { name: 'General electrical', severity: 'SCHEDULED', timeLow: 30, timeHigh: 180, priceLow: 100, priceHigh: 500 },
    POOL: { name: 'General pool work', severity: 'SCHEDULED', timeLow: 30, timeHigh: 120, priceLow: 100, priceHigh: 400 },
    CLEANING: { name: 'General cleaning', severity: 'SCHEDULED', timeLow: 60, timeHigh: 180, priceLow: 100, priceHigh: 350 },
};

// Urgent keywords in descriptions that bump severity
const URGENT_KEYWORDS = [
    'emergency', 'flood', 'flooding', 'spark', 'sparking', 'smoke', 'fire',
    'no power', 'no water', 'burst', 'sewage', 'gas leak', 'shock',
    'urgente', 'emergencia', 'inundación', 'chispa', 'humo', 'incendio',
    'sin agua', 'sin luz', 'fuga de gas',
];

function detectUrgentFromDescription(description?: string): boolean {
    if (!description) return false;
    const lower = description.toLowerCase();
    return URGENT_KEYWORDS.some((kw) => lower.includes(kw));
}

// ── Controller ───────────────────────────────────────────────────────────

export const triage = async (req: Request, res: Response) => {
    try {
        const { trade, issueTag, description, photoUrls, videoUrl, preferredLanguage } = req.body as TriageInput;

        if (!trade) {
            return res.status(400).json({ error: 'trade is required' });
        }

        // 1. Look up rule by trade + issueTag, or fall back to trade default
        const tradeRules = ISSUE_RULES[trade.toUpperCase()];
        let rule: IssueRule | undefined;

        if (tradeRules && issueTag) {
            rule = tradeRules[issueTag];
        }

        if (!rule) {
            rule = TRADE_DEFAULTS[trade.toUpperCase()] || TRADE_DEFAULTS.PLUMBER;
        }

        // 2. Build likely issues list
        const likelyIssues: LikelyIssue[] = [{ name: rule.name, confidence: 0.85 }];

        // If we matched a specific tag and there are related issues in the same trade, add lower-confidence ones
        if (tradeRules && issueTag && tradeRules[issueTag]) {
            const allTags = Object.keys(tradeRules);
            for (const tag of allTags) {
                if (tag !== issueTag) {
                    likelyIssues.push({ name: tradeRules[tag].name, confidence: 0.15 });
                    if (likelyIssues.length >= 3) break; // Cap at 3 suggestions
                }
            }
        }

        // 3. Determine severity — upgrade to URGENT_SAMEDAY if description has urgent keywords
        let severity = rule.severity;
        if (detectUrgentFromDescription(description)) {
            severity = 'URGENT_SAMEDAY';
        }

        // 4. If video or multiple photos are attached, slightly widen the time estimate
        //    (more media = potentially more complex issue)
        let timeBonus = 0;
        if (videoUrl) timeBonus += 15;
        if (photoUrls && photoUrls.length > 3) timeBonus += 10;

        const result: TriageOutput = {
            likelyIssues,
            severity,
            timeEstimateLowMins: rule.timeLow,
            timeEstimateHighMins: rule.timeHigh + timeBonus,
            priceLow: rule.priceLow,
            priceHigh: rule.priceHigh,
        };

        return res.json(result);
    } catch (error) {
        console.error('Triage error:', error);
        return res.status(500).json({ error: 'Triage failed' });
    }
};
