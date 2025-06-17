import fs from 'fs';
import path from 'path';

/**
 * Loads a configuration JSON file for a given industry.
 * @param {string} industry - The industry name (e.g., "real-estate").
 * @returns {object} - The parsed configuration object.
 * @throws Will throw an error if the file does not exist or JSON is invalid.
 */
export function loadConfig(industry) {
    const configPath = path.join(process.cwd(), 'config', `${industry}.json`);
    let rawData;
    try {
        rawData = fs.readFileSync(configPath, 'utf-8');
    } catch (err) {
        if (err.code === 'ENOENT') {
            throw new Error(`Configuration file not found for industry: ${industry} (${configPath})`);
        }
        throw new Error(`Error reading configuration file: ${err.message}`);
    }

    try {
        return JSON.parse(rawData);
    } catch (err) {
        throw new Error(`Invalid JSON in configuration file for industry: ${industry} (${configPath})`);
    }
}

// Manual test block (remove or comment out in production)
if (import.meta.url === process.argv[1] || import.meta.url === `file://${process.argv[1]}`) {
    try {
        const config = loadConfig('real-estate');
        console.log('Loaded config:', config);
    } catch (err) {
        console.error('Error:', err.message);
    }
}