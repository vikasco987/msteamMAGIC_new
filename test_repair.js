const textResponse = '[{"name": "item1"}, {"name": "item2"';

let parsedMenu;
let cleanText = textResponse.replace(/[\n\r]+/g, ' ');
let repaired = cleanText.replace(/,[^,]*$/, '');

const closingOptions = [
    ']',
    '}]',
    ']}']',
    ']}',
    ']}]}'
];

for (const closing of closingOptions) {
    try {
        parsedMenu = JSON.parse(repaired + closing);
        console.log("Success with:", closing);
        break;
    } catch (e) {
        console.log("Failed with:", closing);
    }
}
console.log(parsedMenu);
