const tests = [
    '[{"name": "piz",',
    '[{"name": "piz"},',
    '[{"name": "piz"}, {',
    '[{"name": "piz"}, {"name"',
    '[{"name": "piz"}, {"name":'
];

for (const textResponse of tests) {
    let cleanText = textResponse.replace(/[\n\r]+/g, ' ');
    let repaired = cleanText.replace(/,[^,]*$/, '');
    
    const closingOptions = [']', '}]', ']}', ']}]}', '}', '}}'];
    let success = false;
    
    for (const closing of closingOptions) {
        try {
            JSON.parse(repaired + closing);
            success = true;
            console.log(`Success for '${textResponse}' with closing '${closing}' -> ${repaired + closing}`);
            break;
        } catch(e) {}
    }
    if (!success) {
        repaired = repaired.replace(/,[^,]*$/, '');
        for (const closing of closingOptions) {
            try {
                JSON.parse(repaired + closing);
                success = true;
                console.log(`Aggressive Success for '${textResponse}' with closing '${closing}' -> ${repaired + closing}`);
                break;
            } catch(e) {}
        }
    }
    if (!success) console.log(`Failed for '${textResponse}'`);
}
