/**
 * Michigan Citation Validator
 * Based on: Michigan Appellate Opinions Manual
 * https://www.courts.michigan.gov/siteassets/publications/manuals/msc/miappopmanual.pdf
 *
 * MANDATORY for all Michigan state court pleadings and opinions
 */
/*
 * Copyright 2025 Cognisint LLC
 * Licensed under the Apache License, Version 2.0
 * See LICENSE.md for full license text
 */
// Michigan citation format types
export var MichiganCitationFormat;
(function (MichiganCitationFormat) {
    MichiganCitationFormat["TRADITIONAL"] = "traditional";
    MichiganCitationFormat["PUBLIC_DOMAIN"] = "public_domain";
    MichiganCitationFormat["STATUTORY"] = "statutory";
    MichiganCitationFormat["COURT_RULE"] = "court_rule";
    MichiganCitationFormat["FEDERAL"] = "federal";
})(MichiganCitationFormat || (MichiganCitationFormat = {}));
// Michigan reporter abbreviations (NO PERIODS per manual)
export const MICHIGAN_REPORTERS = {
    // Michigan state reporters
    'Mich': { name: 'Michigan Reports', court: 'Supreme Court' },
    'Mich App': { name: 'Michigan Appeals Reports', court: 'Court of Appeals' },
    // Regional reporters (Michigan format - no periods)
    'NW': { name: 'North Western Reporter', series: '1st' },
    'NW 2d': { name: 'North Western Reporter', series: '2nd' },
    'NW 3d': { name: 'North Western Reporter', series: '3rd' },
    // Federal reporters (Michigan format - no periods)
    'US': { name: 'United States Reports', court: 'US Supreme Court' },
    'S Ct': { name: 'Supreme Court Reporter', court: 'US Supreme Court' },
    'F': { name: 'Federal Reporter', series: '1st' },
    'F 2d': { name: 'Federal Reporter', series: '2nd' },
    'F 3d': { name: 'Federal Reporter', series: '3rd' },
    'F 4th': { name: 'Federal Reporter', series: '4th' },
    'F Supp': { name: 'Federal Supplement', series: '1st' },
    'F Supp 2d': { name: 'Federal Supplement', series: '2nd' },
    'F Supp 3d': { name: 'Federal Supplement', series: '3rd' },
};
// Michigan court abbreviations (NO PERIODS)
export const MICHIGAN_COURTS = {
    'MI': 'Michigan Supreme Court',
    'MI App': 'Michigan Court of Appeals',
    'Mich Ct App': 'Michigan Court of Appeals',
    'ED Mich': 'Eastern District of Michigan',
    'WD Mich': 'Western District of Michigan',
    'CA 6': 'US Court of Appeals, Sixth Circuit',
};
// Michigan statutory abbreviations (NO PERIODS)
export const MICHIGAN_STATUTORY = {
    'MCL': 'Michigan Compiled Laws',
    'MCR': 'Michigan Court Rules',
    'MSA': 'Michigan Statutes Annotated',
    'MCLA': 'Michigan Compiled Laws Annotated',
};
export class MichiganCitationValidator {
    /**
     * Validate a citation against Michigan rules
     */
    validate(citation) {
        const trimmed = citation.trim();
        // Try traditional case citation
        const traditional = this.parseTraditional(trimmed);
        if (traditional.isValid)
            return traditional;
        // Try public domain citation
        const publicDomain = this.parsePublicDomain(trimmed);
        if (publicDomain.isValid)
            return publicDomain;
        // Try statutory citation
        const statutory = this.parseStatutory(trimmed);
        if (statutory.isValid)
            return statutory;
        // Try court rule citation
        const courtRule = this.parseCourtRule(trimmed);
        if (courtRule.isValid)
            return courtRule;
        // Invalid citation
        return {
            raw: trimmed,
            format: MichiganCitationFormat.TRADITIONAL,
            isValid: false,
            errors: ['Citation does not match any Michigan format'],
            warnings: [],
        };
    }
    /**
     * Parse traditional case citation
     * Format: Case Name, Volume Reporter Page, Pinpoint (Court Year)
     * Example: People v Smith, 500 Mich 123, 125 (2020)
     */
    parseTraditional(citation) {
        const errors = [];
        // Pattern: Case Name, Volume Reporter Page, Pinpoint (Court Year)
        const pattern = /^(.+?),\s*(\d+)\s+([A-Za-z][A-Za-z0-9\s]*?)\s+(\d+)(?:,\s*(\d+))?\s*(?:\(([^)]*?)\s*(\d{4})\))?/;
        const match = citation.match(pattern);
        if (!match) {
            return {
                raw: citation,
                format: MichiganCitationFormat.TRADITIONAL,
                isValid: false,
                errors: ['Does not match traditional Michigan citation format'],
                warnings: [],
            };
        }
        const caseName = match[1].trim();
        const volume = match[2];
        const reporter = match[3].trim();
        const page = match[4];
        const pinpoint = match[5];
        const court = match[6]?.trim();
        const year = match[7];
        // Validate reporter (no periods allowed)
        if (reporter.includes('.')) {
            errors.push(`Reporter "${reporter}" contains periods - Michigan disfavors periods in abbreviations`);
        }
        if (!MICHIGAN_REPORTERS[reporter]) {
            errors.push(`Unknown reporter "${reporter}" - should be one of: ${Object.keys(MICHIGAN_REPORTERS).join(', ')}`);
        }
        // Validate court abbreviation (if present)
        if (court && court.includes('.')) {
            errors.push(`Court abbreviation "${court}" contains periods - use ${court.replace(/\./g, '')}`);
        }
        return {
            raw: citation,
            format: MichiganCitationFormat.TRADITIONAL,
            caseName,
            volume,
            reporter,
            page,
            pinpoint,
            court,
            year,
            isValid: errors.length === 0,
            errors,
            warnings: [],
        };
    }
    /**
     * Parse public domain citation
     * Format: Case Name, Year State Court Sequence ¶ Paragraph
     * Example: People v Smith, 2020 MI 45, ¶ 12
     */
    parsePublicDomain(citation) {
        const errors = [];
        // Pattern: Case Name, Year MI/MI App Sequence, ¶ Paragraph
        const pattern = /^(.+?),\s*(\d{4})\s+(MI(?:\s+App)?)\s+(\d+)(?:,?\s*¶\s*(\d+))?/;
        const match = citation.match(pattern);
        if (!match) {
            return {
                raw: citation,
                format: MichiganCitationFormat.PUBLIC_DOMAIN,
                isValid: false,
                errors: ['Does not match Michigan public domain citation format'],
                warnings: [],
            };
        }
        const caseName = match[1].trim();
        const year = match[2];
        const court = match[3].trim();
        const sequence = match[4];
        const paragraph = match[5];
        return {
            raw: citation,
            format: MichiganCitationFormat.PUBLIC_DOMAIN,
            caseName,
            year,
            court,
            volume: sequence,
            paragraph,
            isValid: errors.length === 0,
            errors,
            warnings: [],
        };
    }
    /**
     * Parse statutory citation
     * Format: MCL Section.Subsection
     * Example: MCL 600.2922
     */
    parseStatutory(citation) {
        const errors = [];
        // Pattern: MCL/MSA/MCLA digits.digits
        const pattern = /^(MCL|MSA|MCLA)\s+(\d+\.\d+(?:\([a-z0-9]+\))?)$/;
        const match = citation.match(pattern);
        if (!match) {
            return {
                raw: citation,
                format: MichiganCitationFormat.STATUTORY,
                isValid: false,
                errors: ['Does not match Michigan statutory citation format'],
                warnings: [],
            };
        }
        const statute = match[1];
        const section = match[2];
        // Check for periods in statute abbreviation
        if (statute.includes('.')) {
            errors.push(`Statute abbreviation "${statute}" contains periods - Michigan disfavors periods`);
        }
        return {
            raw: citation,
            format: MichiganCitationFormat.STATUTORY,
            statute,
            section,
            isValid: errors.length === 0,
            errors,
            warnings: [],
        };
    }
    /**
     * Parse court rule citation
     * Format: MCR Section.Subsection
     * Example: MCR 2.116(C)(10)
     */
    parseCourtRule(citation) {
        const errors = [];
        // Pattern: MCR digits.digits(optional subsections)
        const pattern = /^(MCR)\s+(\d+\.\d+(?:\([A-Z0-9]+\)(?:\(\d+\))?)?)$/;
        const match = citation.match(pattern);
        if (!match) {
            return {
                raw: citation,
                format: MichiganCitationFormat.COURT_RULE,
                isValid: false,
                errors: ['Does not match Michigan court rule citation format'],
                warnings: [],
            };
        }
        const statute = match[1];
        const section = match[2];
        // Check for periods in MCR abbreviation
        if (statute.includes('.')) {
            errors.push(`Court rule abbreviation "${statute}" contains periods - should be MCR`);
        }
        return {
            raw: citation,
            format: MichiganCitationFormat.COURT_RULE,
            statute,
            section,
            isValid: errors.length === 0,
            errors,
            warnings: [],
        };
    }
    /**
     * Check if citation has common Michigan errors
     */
    checkCommonErrors(citation) {
        const errors = [];
        // Check for periods in common abbreviations
        const periodsInAbbreviations = [
            { wrong: 'N.W.', correct: 'NW' },
            { wrong: 'N.W.2d', correct: 'NW 2d' },
            { wrong: 'Mich.', correct: 'Mich' },
            { wrong: 'Mich.App.', correct: 'Mich App' },
            { wrong: 'M.C.L.', correct: 'MCL' },
            { wrong: 'M.C.R.', correct: 'MCR' },
            { wrong: 'U.S.', correct: 'US' },
            { wrong: 'F.Supp.', correct: 'F Supp' },
        ];
        for (const { wrong, correct } of periodsInAbbreviations) {
            if (citation.includes(wrong)) {
                errors.push(`Michigan disfavors periods: use "${correct}" instead of "${wrong}"`);
            }
        }
        // Check for parallel citations (no longer required)
        const hasMultipleReporters = (citation.match(/\d+\s+[A-Z][a-z]+/g) || []).length > 1;
        if (hasMultipleReporters) {
            errors.push('Parallel citations are no longer required in Michigan');
        }
        return errors;
    }
    /**
     * Format a citation to Michigan standards
     */
    format(components) {
        if (components.format === MichiganCitationFormat.PUBLIC_DOMAIN) {
            let result = `${components.caseName}, ${components.year} ${components.court} ${components.volume}`;
            if (components.paragraph) {
                result += `, ¶ ${components.paragraph}`;
            }
            return result;
        }
        if (components.format === MichiganCitationFormat.STATUTORY) {
            return `${components.statute} ${components.section}`;
        }
        if (components.format === MichiganCitationFormat.COURT_RULE) {
            return `${components.statute} ${components.section}`;
        }
        // Traditional format
        let result = `${components.caseName}, ${components.volume} ${components.reporter} ${components.page}`;
        if (components.pinpoint) {
            result += `, ${components.pinpoint}`;
        }
        if (components.court && components.year) {
            result += ` (${components.court} ${components.year})`;
        }
        else if (components.year) {
            result += ` (${components.year})`;
        }
        return result;
    }
}
export const michiganCitationValidator = new MichiganCitationValidator();
