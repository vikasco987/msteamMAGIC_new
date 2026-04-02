async function listModels() {
    const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyCXro2IyzxnET3LFbdWobBR5MLyM41q3wI"
    );
    const data = await response.json();
    data.models.forEach(m => console.log(m.name));
}

listModels();
