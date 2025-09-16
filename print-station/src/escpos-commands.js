/**
 * ESC/POS Commands per stampante termica Qian QOP-T80UL-RI-02
 * Comandi standardizzati per il controllo della stampante
 * Versione ES modules per React App
 */

// Comandi di inizializzazione e controllo
export const CONTROL = {
    INIT: [0x1B, 0x40],                    // ESC @ - Inizializza stampante
    RESET: [0x1B, 0x40],                   // ESC @ - Reset
    LINE_FEED: [0x0A],                     // LF - Nuova linea
    FORM_FEED: [0x0C],                     // FF - Nuova pagina
    CARRIAGE_RETURN: [0x0D],               // CR - Ritorno carrello
    HORIZONTAL_TAB: [0x09],                // HT - Tab orizzontale
    BELL: [0x07],                          // BEL - Suono
};

// Comandi per il taglio della carta
export const CUT = {
    FULL: [0x1D, 0x56, 0x00],             // GS V 0 - Taglio completo
    PARTIAL: [0x1D, 0x56, 0x01],          // GS V 1 - Taglio parziale
    FULL_WITH_FEED: [0x1D, 0x56, 0x41, 0x03], // GS V A 3 - Taglio con feed
    PARTIAL_WITH_FEED: [0x1D, 0x56, 0x42, 0x03], // GS V B 3 - Taglio parziale con feed
};

// Comandi per l'allineamento del testo
export const ALIGN = {
    LEFT: [0x1B, 0x61, 0x00],             // ESC a 0 - Allineamento a sinistra
    CENTER: [0x1B, 0x61, 0x01],           // ESC a 1 - Allineamento al centro
    RIGHT: [0x1B, 0x61, 0x02],            // ESC a 2 - Allineamento a destra
};

// Comandi per lo stile del testo
export const TEXT_STYLE = {
    NORMAL: [0x1B, 0x21, 0x00],           // ESC ! 0 - Testo normale
    BOLD_ON: [0x1B, 0x45, 0x01],          // ESC E 1 - Grassetto ON
    BOLD_OFF: [0x1B, 0x45, 0x00],         // ESC E 0 - Grassetto OFF
    UNDERLINE_ON: [0x1B, 0x2D, 0x01],     // ESC - 1 - Sottolineato ON
    UNDERLINE_OFF: [0x1B, 0x2D, 0x00],    // ESC - 0 - Sottolineato OFF
    ITALIC_ON: [0x1B, 0x34],              // ESC 4 - Corsivo ON
    ITALIC_OFF: [0x1B, 0x35],             // ESC 5 - Corsivo OFF
    DOUBLE_HEIGHT: [0x1B, 0x21, 0x10],    // ESC ! 16 - Altezza doppia
    DOUBLE_WIDTH: [0x1B, 0x21, 0x20],     // ESC ! 32 - Larghezza doppia
    DOUBLE_SIZE: [0x1B, 0x21, 0x30],      // ESC ! 48 - Dimensione doppia
};

// Comandi per il carattere
export const FONT = {
    FONT_A: [0x1B, 0x4D, 0x00],           // ESC M 0 - Font A (12x24)
    FONT_B: [0x1B, 0x4D, 0x01],           // ESC M 1 - Font B (9x17)
    FONT_C: [0x1B, 0x4D, 0x02],           // ESC M 2 - Font C (se supportato)
};

// Comandi per l'avanzamento carta
export const FEED = {
    ONE_LINE: [0x0A],                      // LF - Una linea
    TWO_LINES: [0x0A, 0x0A],              // LF LF - Due linee
    THREE_LINES: [0x0A, 0x0A, 0x0A],      // LF LF LF - Tre linee
    FOUR_LINES: [0x0A, 0x0A, 0x0A, 0x0A], // Quattro linee
    CUSTOM: (lines) => Array(lines).fill(0x0A), // N linee personalizzate
};

// Comandi per il cassetto
export const DRAWER = {
    OPEN_PIN_2: [0x1B, 0x70, 0x00, 0x19, 0xFA], // ESC p 0 - Apri cassetto pin 2
    OPEN_PIN_5: [0x1B, 0x70, 0x01, 0x19, 0xFA], // ESC p 1 - Apri cassetto pin 5
};

// Comandi per codici a barre (se supportati)
export const BARCODE = {
    HEIGHT: [0x1D, 0x68],                  // GS h - Altezza codice a barre
    WIDTH: [0x1D, 0x77],                   // GS w - Larghezza codice a barre
    POSITION: [0x1D, 0x48],                // GS H - Posizione testo
    FONT: [0x1D, 0x66],                    // GS f - Font del testo
    PRINT: [0x1D, 0x6B],                   // GS k - Stampa codice a barre
};

// Comandi per QR Code (se supportati)
export const QR = {
    MODEL: [0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41], // Modello QR
    SIZE: [0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43],  // Dimensione
    ERROR_CORRECTION: [0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45], // Correzione errori
    STORE_DATA: [0x1D, 0x28, 0x6B],                     // Memorizza dati
    PRINT: [0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51], // Stampa QR
};

// Comandi per tabelle e colonne
export const TABLE = {
    SET_TAB: [0x1B, 0x44],                 // ESC D - Imposta tab
    CLEAR_TAB: [0x1B, 0x44, 0x00],         // ESC D 0 - Cancella tab
    TAB: [0x09],                           // HT - Vai a tab
};

// Comandi per immagini (se supportati)
export const IMAGE = {
    SELECT_BIT_IMAGE: [0x1B, 0x2A],        // ESC * - Seleziona modalità immagine
    DEFINE_NV_BIT_IMAGE: [0x1C, 0x71],     // FS q - Definisci immagine NV
    PRINT_NV_BIT_IMAGE: [0x1C, 0x70],      // FS p - Stampa immagine NV
};

// Caratteri speciali per layout
export const CHARS = {
    HORIZONTAL_LINE: '━',
    LIGHT_HORIZONTAL: '─',
    DOUBLE_LINE: '═',
    TOP_LEFT: '┌',
    TOP_RIGHT: '┐',
    BOTTOM_LEFT: '└',
    BOTTOM_RIGHT: '┘',
    VERTICAL: '│',
    CROSS: '┼',
    BULLET: '•',
    ARROW_RIGHT: '→',
    EURO: '€',
    DEGREE: '°',
};

// Funzioni helper per creare comandi complessi (browser-compatible)
export const HELPERS = {
    /**
     * Converte testo in array di byte (compatibile browser)
     */
    textToBytes: (text) => {
        // Verifica se siamo in ambiente Node.js o browser
        if (typeof Buffer !== 'undefined') {
            // Node.js environment
            return Array.from(Buffer.from(text, 'utf8'));
        } else {
            // Browser environment - usa TextEncoder
            const encoder = new TextEncoder();
            return Array.from(encoder.encode(text));
        }
    },

    /**
     * Crea comando per testo con stile specifico
     */
    styledText: (text, style = 'NORMAL') => {
        const commands = [];
        if (TEXT_STYLE[style]) {
            commands.push(...TEXT_STYLE[style]);
        }
        commands.push(...HELPERS.textToBytes(text));
        commands.push(...TEXT_STYLE.NORMAL); // Reset allo stile normale
        return commands;
    },

    /**
     * Crea comando per testo allineato
     */
    alignedText: (text, alignment = 'LEFT') => {
        const commands = [];
        if (ALIGN[alignment]) {
            commands.push(...ALIGN[alignment]);
        }
        commands.push(...HELPERS.textToBytes(text));
        commands.push(...ALIGN.LEFT); // Reset all'allineamento a sinistra
        return commands;
    },

    /**
     * Crea una linea di separazione
     */
    separator: (char = '=', length = 48) => {
        return [
            ...HELPERS.textToBytes(char.repeat(length) + '\n')
        ];
    },

    /**
     * Formatta una linea con prezzo allineato a destra
     */
    priceLine: (description, price, lineWidth = 48) => {
        const priceStr = price.toString();
        const maxDescLength = lineWidth - priceStr.length - 1;
        const desc = description.length > maxDescLength ?
            description.substring(0, maxDescLength - 3) + '...' :
            description;
        const spaces = ' '.repeat(lineWidth - desc.length - priceStr.length);
        return HELPERS.textToBytes(desc + spaces + priceStr + '\n');
    },

    /**
     * Centra il testo in una linea di larghezza specifica
     */
    centerText: (text, lineWidth = 48) => {
        const padding = Math.max(0, Math.floor((lineWidth - text.length) / 2));
        return HELPERS.textToBytes(' '.repeat(padding) + text + '\n');
    },

    /**
     * Crea header formattato
     */
    header: (title, subtitle = '') => {
        const commands = [];
        commands.push(...ALIGN.CENTER);
        commands.push(...TEXT_STYLE.DOUBLE_SIZE);
        commands.push(...HELPERS.textToBytes(title + '\n'));
        commands.push(...TEXT_STYLE.NORMAL);
        if (subtitle) {
            commands.push(...HELPERS.textToBytes(subtitle + '\n'));
        }
        commands.push(...ALIGN.LEFT);
        return commands;
    },

    /**
     * Crea footer con taglio carta
     */
    footer: (message = '', feedLines = 3) => {
        const commands = [];
        if (message) {
            commands.push(...ALIGN.CENTER);
            commands.push(...HELPERS.textToBytes(message + '\n'));
            commands.push(...ALIGN.LEFT);
        }
        commands.push(...FEED.CUSTOM(feedLines));
        commands.push(...FEED.THREE_LINES);
        commands.push(...CUT.FULL);
        return commands;
    }
};