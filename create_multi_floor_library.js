// Script to replace Woodlands Regional Library with multi-floor version

const fs = require('fs');

// Read the current data.js file
let dataContent = fs.readFileSync('/Users/user/uiuxgbawebsite/data.js', 'utf8');

// Define the new multi-floor Woodlands Regional Library
const newWoodlandsLibrary = `    {
        id: 5,
        name: "Woodlands Regional Library",
        type: "Regional Library",
        address: "900 South Woodlands Drive, #01-03, Singapore 730900",
        totalSeats: 65,
        availableSeats: 52,
        crowdLevel: "low",
        facilities: ["quiet", "group", "cafe", "wifi", "aircon", "power"],
        hasFloors: true,
        image: "https://www.nlb.gov.sg/main/-/media/NLBMedia/Images/Visit-Us/Libraries/WRL/Library-Images/Woodlands-Regional-Library-Supplementary-Images-1-MakeIT.jpg",
        floors: [
            {
                floorNumber: 1,
                floorName: "Level 1 - General Collection",
                description: "Main library collection with reading areas and circulation counter",
                totalSeats: 25,
                availableSeats: 20,
                facilities: ["quiet", "wifi", "aircon", "power"],
                image: "https://www.nlb.gov.sg/main/-/media/NLBMedia/Images/Visit-Us/Libraries/WRL/Library-Images/Woodlands-Regional-Library-1.jpg",
                seats: [
                    { id: 101, type: "power", position: "corner", status: "available" },
                    { id: 102, type: "power", position: "center", status: "available" },
                    { id: 103, type: "power", position: "center", status: "available" },
                    { id: 104, type: "power", position: "wall", status: "available" },
                    { id: 105, type: "power", position: "center", status: "available" },
                    { id: 106, type: "window", position: "window", status: "available" },
                    { id: 107, type: "window", position: "window", status: "occupied" },
                    { id: 108, type: "window", position: "window", status: "available" },
                    { id: 109, type: "window", position: "window", status: "available" },
                    { id: 110, type: "window", position: "window", status: "available" },
                    { id: 111, type: "regular", position: "center", status: "available" },
                    { id: 112, type: "regular", position: "center", status: "occupied" },
                    { id: 113, type: "regular", position: "center", status: "available" },
                    { id: 114, type: "regular", position: "corner", status: "available" },
                    { id: 115, type: "regular", position: "corner", status: "available" },
                    { id: 116, type: "regular", position: "center", status: "available" },
                    { id: 117, type: "regular", position: "center", status: "available" },
                    { id: 118, type: "regular", position: "wall", status: "available" },
                    { id: 119, type: "regular", position: "center", status: "occupied" },
                    { id: 120, type: "regular", position: "center", status: "available" },
                    { id: 121, type: "regular", position: "center", status: "available" },
                    { id: 122, type: "regular", position: "corner", status: "available" },
                    { id: 123, type: "regular", position: "center", status: "available" },
                    { id: 124, type: "regular", position: "center", status: "occupied" },
                    { id: 125, type: "regular", position: "wall", status: "available" }
                ]
            },
            {
                floorNumber: 2,
                floorName: "Level 2 - MakeIT Space & Study Areas",
                description: "Maker space with 3D printing, collaborative study rooms, and individual study pods",
                totalSeats: 20,
                availableSeats: 16,
                facilities: ["group", "wifi", "aircon", "power"],
                image: "https://www.nlb.gov.sg/main/-/media/NLBMedia/Images/Visit-Us/Libraries/WRL/Library-Images/Woodlands-Regional-Library-Supplementary-Images-1-MakeIT.jpg",
                seats: [
                    { id: 201, type: "power", position: "corner", status: "available" },
                    { id: 202, type: "power", position: "center", status: "available" },
                    { id: 203, type: "power", position: "center", status: "occupied" },
                    { id: 204, type: "power", position: "wall", status: "available" },
                    { id: 205, type: "power", position: "center", status: "available" },
                    { id: 206, type: "power", position: "center", status: "available" },
                    { id: 207, type: "window", position: "window", status: "available" },
                    { id: 208, type: "window", position: "window", status: "available" },
                    { id: 209, type: "window", position: "window", status: "available" },
                    { id: 210, type: "regular", position: "center", status: "available" },
                    { id: 211, type: "regular", position: "center", status: "occupied" },
                    { id: 212, type: "regular", position: "center", status: "available" },
                    { id: 213, type: "regular", position: "corner", status: "available" },
                    { id: 214, type: "regular", position: "corner", status: "available" },
                    { id: 215, type: "regular", position: "center", status: "available" },
                    { id: 216, type: "regular", position: "center", status: "available" },
                    { id: 217, type: "regular", position: "wall", status: "occupied" },
                    { id: 218, type: "regular", position: "center", status: "available" },
                    { id: 219, type: "regular", position: "center", status: "available" },
                    { id: 220, type: "regular", position: "corner", status: "occupied" }
                ]
            },
            {
                floorNumber: 3,
                floorName: "Level 3 - Quiet Study Zone",
                description: "Silent study area with individual carrels and group study rooms",
                totalSeats: 20,
                availableSeats: 16,
                facilities: ["quiet", "wifi", "aircon", "power"],
                image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
                seats: [
                    { id: 301, type: "power", position: "corner", status: "available" },
                    { id: 302, type: "power", position: "center", status: "available" },
                    { id: 303, type: "power", position: "center", status: "available" },
                    { id: 304, type: "power", position: "wall", status: "occupied" },
                    { id: 305, type: "power", position: "center", status: "available" },
                    { id: 306, type: "power", position: "center", status: "available" },
                    { id: 307, type: "window", position: "window", status: "available" },
                    { id: 308, type: "window", position: "window", status: "available" },
                    { id: 309, type: "window", position: "window", status: "available" },
                    { id: 310, type: "window", position: "window", status: "occupied" },
                    { id: 311, type: "regular", position: "center", status: "available" },
                    { id: 312, type: "regular", position: "center", status: "available" },
                    { id: 313, type: "regular", position: "center", status: "available" },
                    { id: 314, type: "regular", position: "corner", status: "available" },
                    { id: 315, type: "regular", position: "corner", status: "available" },
                    { id: 316, type: "regular", position: "center", status: "available" },
                    { id: 317, type: "regular", position: "center", status: "occupied" },
                    { id: 318, type: "regular", position: "wall", status: "available" },
                    { id: 319, type: "regular", position: "center", status: "available" },
                    { id: 320, type: "regular", position: "corner", status: "occupied" }
                ]
            }
        ]
    }`;

// Find and replace the existing Woodlands Regional Library entry
const startPattern = /{\s*id:\s*5,\s*name:\s*"Woodlands Regional Library"/;
const endPattern = /}\s*,\s*{\s*id:\s*6,/;

// Find the start and end positions
const startMatch = dataContent.match(startPattern);
if (!startMatch) {
    console.error('Could not find Woodlands Regional Library entry');
    process.exit(1);
}

const startIndex = startMatch.index;
const remainingContent = dataContent.substring(startIndex);
const endMatch = remainingContent.match(endPattern);

if (!endMatch) {
    console.error('Could not find end of Woodlands Regional Library entry');
    process.exit(1);
}

const endIndex = startIndex + endMatch.index;

// Replace the content
const beforeLibrary = dataContent.substring(0, startIndex);
const afterLibrary = dataContent.substring(endIndex);

const newContent = beforeLibrary + newWoodlandsLibrary + ',\n    {' + afterLibrary.substring(afterLibrary.indexOf('id: 6,'));

// Write the updated content
fs.writeFileSync('/Users/user/uiuxgbawebsite/data.js', newContent);

console.log('Successfully updated Woodlands Regional Library with multi-floor structure');