const fallbackRegex = /(?:(\d{1,2})\s+(?:de|del|DE|DEL)\s+([a-zA-ZáéíóúÁÉÍÓÚ]+)[\s,]+(?:del año|de|del|DEL AÑO|DE|DEL)\s+(\d{4})|(\d{4})-(\d{2})-(\d{2})).*?(?:a las|hora|a hora|a)\s+(\d{1,2}[:.]\d{2}(?:\s*(?:AM|PM|a\.m\.|p\.m\.|am|pm|hrs|horas|h))?)/gi;

const text = "bla bla bla 15 de JUNIO de 2026 a las 10:00 AM bla bla";
let match;
let lastMatch = null;
while ((match = fallbackRegex.exec(text)) !== null) {
    lastMatch = match;
}
console.log(lastMatch);
