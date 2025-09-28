// Script to add geographical regions and coordinates to study locations

const fs = require('fs');

// Singapore geographical regions mapping
const locationRegions = {
    // Central
    "National Archives of Singapore": { region: "Central", coordinates: { lat: 1.2966, lng: 103.8557 } },
    "Lee Kong Chian Reference Library": { region: "Central", coordinates: { lat: 1.2967, lng: 103.8540 } },
    "Central Public Library": { region: "Central", coordinates: { lat: 1.2967, lng: 103.8540 } },
    "SMU Li Ka Shing Library": { region: "Central", coordinates: { lat: 1.2966, lng: 103.8496 } },
    "SMU Kwa Geok Choo Law Library": { region: "Central", coordinates: { lat: 1.2945, lng: 103.8489 } },

    // North
    "Woodlands Regional Library": { region: "North", coordinates: { lat: 1.4361, lng: 103.7864 } },
    "Ang Mo Kio Public Library": { region: "North", coordinates: { lat: 1.3691, lng: 103.8454 } },
    "Sengkang Public Library": { region: "North", coordinates: { lat: 1.3915, lng: 103.8947 } },
    "Punggol Regional Library": { region: "North-East", coordinates: { lat: 1.4058, lng: 103.9014 } },
    "Woodlands CC Study Corner": { region: "North", coordinates: { lat: 1.4361, lng: 103.7864 } },
    "Ang Mo Kio CC Study Room": { region: "North", coordinates: { lat: 1.3691, lng: 103.8454 } },

    // East
    "Tampines Regional Library": { region: "East", coordinates: { lat: 1.3521, lng: 103.9448 } },
    "Bedok Public Library": { region: "East", coordinates: { lat: 1.3236, lng: 103.9273 } },
    "Bedok CC Quiet Study Area": { region: "East", coordinates: { lat: 1.3236, lng: 103.9273 } },
    "Tampines West CC Study Corner": { region: "East", coordinates: { lat: 1.3521, lng: 103.9448 } },

    // West
    "Jurong Regional Library": { region: "West", coordinates: { lat: 1.3329, lng: 103.7436 } },
    "Jurong East CC Study Space": { region: "West", coordinates: { lat: 1.3329, lng: 103.7436 } },
    "Clementi CC Study Hall": { region: "West", coordinates: { lat: 1.3162, lng: 103.7649 } },
    "NTU Art, Design & Media Library": { region: "West", coordinates: { lat: 1.3483, lng: 103.6831 } },

    // Central-North
    "Bishan Public Library": { region: "Central", coordinates: { lat: 1.3516, lng: 103.8493 } },
    "Toa Payoh Public Library": { region: "Central", coordinates: { lat: 1.3343, lng: 103.8563 } },
    "Bishan CC Learning Hub": { region: "Central", coordinates: { lat: 1.3516, lng: 103.8493 } },
    "Toa Payoh CC Learning Space": { region: "Central", coordinates: { lat: 1.3343, lng: 103.8563 } },

    // Universities (scattered)
    "NUS Central Library": { region: "West", coordinates: { lat: 1.2966, lng: 103.7764 } },
    "SUTD Library": { region: "East", coordinates: { lat: 1.3404, lng: 103.9635 } },
    "SIT Library @ Punggol": { region: "North-East", coordinates: { lat: 1.4058, lng: 103.9014 } },
    "LASALLE College Library": { region: "Central", coordinates: { lat: 1.3016, lng: 103.8554 } }
};

// Read the current data.js file
let dataContent = fs.readFileSync('/Users/user/uiuxgbawebsite/data.js', 'utf8');

// Process each location and add region and coordinates
Object.keys(locationRegions).forEach(locationName => {
    const { region, coordinates } = locationRegions[locationName];

    // Find the location in the file and add region and coordinates
    const namePattern = new RegExp(`(name: "${locationName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}")`, 'g');
    const facilityPattern = new RegExp(`(facilities: \\[.*?\\])`, 'g');

    // Add region and coordinates after facilities
    dataContent = dataContent.replace(
        new RegExp(`(name: "${locationName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[\\s\\S]*?facilities: \\[[^\\]]*\\])`, 'g'),
        (match) => {
            if (match.includes('region:') || match.includes('coordinates:')) {
                return match; // Already has region/coordinates
            }
            return match + `,\n        region: "${region}",\n        coordinates: { lat: ${coordinates.lat}, lng: ${coordinates.lng} }`;
        }
    );
});

// Write the updated content
fs.writeFileSync('/Users/user/uiuxgbawebsite/data.js', dataContent);

console.log('Successfully added geographical data to study locations');