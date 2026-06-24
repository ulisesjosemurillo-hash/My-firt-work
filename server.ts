import express from "express";
import path from "path";
import dns from "dns";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

// Initialize the Google GenAI SDK on the server with User-Agent set to "aistudio-build"
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

app.post("/api/gemini/bridge", async (req, res) => {
  try {
    const { action, payload } = req.body;
    let model = "gemini-3.5-flash";
    let sdkConfig: any = {};
    
    if (payload.systemInstruction) {
      sdkConfig.systemInstruction = payload.systemInstruction.parts[0].text;
    }
    if (payload.tools && payload.tools.length > 0 && payload.tools[0].googleSearch !== undefined) {
      // Just map if they used google_search or googleSearch in REST
      sdkConfig.tools = [{ googleSearch: {} }];
    }
    if (payload.tools && payload.tools.length > 0 && payload.tools[0].google_search !== undefined) {
      sdkConfig.tools = [{ googleSearch: {} }];
    }
    if (payload.responseSchema) {
      // Very basic type mapping
      const typeMapping: any = {
         "ARRAY": Type.ARRAY,
         "OBJECT": Type.OBJECT,
         "STRING": Type.STRING,
         "NUMBER": Type.NUMBER,
         "BOOLEAN": Type.BOOLEAN
      };
      
      const mapSchema = (sch: any): any => {
         if (!sch) return sch;
         const resSch: any = { ...sch };
         if (typeof sch.type === 'string' && typeMapping[sch.type]) resSch.type = typeMapping[sch.type];
         if (sch.items) resSch.items = mapSchema(sch.items);
         if (sch.properties) {
            resSch.properties = {};
            for (const key in sch.properties) {
               resSch.properties[key] = mapSchema(sch.properties[key]);
            }
         }
         return resSch;
      };
      sdkConfig.responseSchema = mapSchema(payload.responseSchema);
    }
    if (payload.responseMimeType) {
      sdkConfig.responseMimeType = payload.responseMimeType;
    }

    if (action === "proposal") {
      model = "gemini-3.1-pro-preview";
      sdkConfig.thinkingConfig = { thinkingLevel: "HIGH" };
    } else if (action === "ocr") {
      model = "gemini-3.1-pro-preview";
    } else if (action === "transcription" || action === "audio-review") {
      model = "gemini-3.5-flash";
    }

    const contents = payload.contents;

    const result = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: sdkConfig
    });

    res.json({
      candidates: [
        {
          content: { parts: [{ text: result.text }] },
          groundingMetadata: (result.candidates?.[0] as any)?.groundingMetadata || undefined
        }
      ]
    });
  } catch (error: any) {
    console.error("Error in gemini bridge:", error);
    res.status(500).json({ error: error.message || "Failed gemini call" });
  }
});

// 1. API Endpoint: Audit Acta according to Honduran Criminal & Procedural Codes
app.post("/api/gemini/audit-acta", async (req, res) => {
  try {
    const { actaText } = req.body;
    if (!actaText) {
      return res.status(400).json({ error: "No acta text provided" });
    }

    const payload = {
      model: "gemini-3.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Audita la siguiente acta de resolución judicial del Juzgado de Letras Penal de Honduras. 
Encuentra errores en cómputos de plazos, tipos de penas dictadas (según la gravedad del delito), medidas cautelares autorizadas o artículos legales mal citados (especialmente respecto al Código Penal de Honduras Dec 130-2017, la Constitución de Honduras y el Código Procesal Penal).

Adicionalmente, valida que no haya plazos programados en días inhábiles recurrentes.
Devuelve un JSON array de objetos con este formato exacto:
[
  {
    "texto_erroneo": "extracto exacto e idéntico del texto con error en el acta para poder ubicarlo y resaltarlo",
    "sugerencia": "texto corregido sugerido",
    "explicacion": "Base legal y análisis de por qué es incorrecto",
    "color": "rojo" (error crítico o violación legal) o "amarillo" (advertencia procesal o plazo ajustado)
  }
]

Si no encuentras ningún conflicto o el acta cumple con todas las leyes vigentes y plazos de Honduras, devuelve un array vacío [].

ACTA A AUDITAR:
${actaText}`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              texto_erroneo: { type: Type.STRING },
              sugerencia: { type: Type.STRING },
              explicacion: { type: Type.STRING },
              color: { type: Type.STRING },
            },
            required: ["texto_erroneo", "sugerencia", "explicacion", "color"],
          },
        },
        systemInstruction: "Eres un Auditor Informático Jurídico Senior para los juzgados de la República de Honduras. Tu finalidad es evitar nulidades procesales y violaciones a los plazos legales constitucionales.",
      },
    };

    const result = await ai.models.generateContent(payload);
    res.json(JSON.parse(result.text || "[]"));
  } catch (error: any) {
    console.error("Error auditing acta:", error);
    res.status(500).json({ error: error.message || "Failed to audit document" });
  }
});

// 2. API Endpoint: RAG Knowledge Base and Search Grounding
app.post("/api/gemini/rag-laws", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "No search query provided" });
    }

    const payload = {
      model: "gemini-3.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Busca jurisprudencia, doctrina, artículos de leyes hondureñas, tratados internacionales (como la Convención Americana sobre Derechos Humanos) aplicables a este caso o consulta penal:
"${query}"

Sintetiza la doctrina penal de Honduras con referencias formales a artículos específicos del Código Procesal Penal, Código Penal de Honduras (Dec 130-2017) o Tratados aplicables.`,
            },
          ],
        },
      ],
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "Eres el Consultor Penal Digital y RAG de la Corte Suprema de Justicia de Honduras. Tu deber es dar respuestas de alta precisión jurídica respaldadas por resultados de búsqueda web reales o doctrina autorizada del derecho penal hondureño. Al emitir resoluciones o sugerir jurisprudencia de la Corte Suprema de Justicia de Honduras, debes proveer un resumen del caso, los nombres involucrados, los números de expediente, y el acceso directo (el enlace HTTP/URL directo) que obtengas de tu búsqueda devuelta. De manera que el usuario pueda hacer click en el enlace http devuelto para ingresar y revisar el documento original, proporciona ese http y el nombre.",
      },
    };

    const result = await ai.models.generateContent(payload);
    
    // Extract grounding chunks
    const chunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const attributions = (result.candidates?.[0]?.groundingMetadata as any)?.groundingAttributions || [];

    res.json({
      text: result.text,
      links: attributions.map((attr: any) => ({
        url: attr.web?.uri || "",
        title: attr.web?.title || "Fuente de Jurisprudencia",
      })).filter((item: any) => item.url),
    });
  } catch (error: any) {
    console.error("Error querying RAG database:", error);
    res.status(500).json({ error: error.message || "Failed to query RAG database" });
  }
});

// 3. API Endpoint: Document & Image OCR Analyst (Case extraction)
app.post("/api/gemini/ocr-analyze", async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "No image provided" });
    }

    const imagePart = {
      inlineData: {
        mimeType: mimeType || "image/jpeg",
        data: imageBase64,
      },
    };

    const textPart = {
      text: `Extrae toda la información con relevancia procesal de este documento judicial o de identidad (DNI, boleta de citación, requerimiento, etc.). 
Entrega un JSON plano con estos campos que puedan rellenar nuestro formulario de "Datos del Proceso" en Honduras:
- expediente (Número de expediente judicial, ej: 0501-2024-00123)
- delito (Calificación legal inicial del hecho)
- victima (Nombre del ofendido o víctima, ej: LA SALUD PÚBLICA, etc.)
- imputado (Nombre completo de la persona procesada)
- identidad_imputado (Número de DNI si es un DNI o ficha, en formato de 13 dígitos con guiones)
- juez (Nombre completo del instructor o juez, si aparece)
- secretario (Nombre del secretario asignado, si aparece)

Devuelve este JSON de forma rigurosa. Si algún campo no se puede divisar o leer, déjalo vacío ("").`,
    };

    const payload = {
      model: "gemini-3.1-pro-preview",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            expediente: { type: Type.STRING },
            delito: { type: Type.STRING },
            victima: { type: Type.STRING },
            imputado: { type: Type.STRING },
            identidad_imputado: { type: Type.STRING },
            juez: { type: Type.STRING },
            secretario: { type: Type.STRING },
          },
        },
        systemInstruction: "Eres un especialista del Departamento de Archivos del Poder Judicial de Honduras, experto en digitalizar y catalogar documentos judiciales rápido y con precisión quirúrgica.",
      },
    };

    const result = await ai.models.generateContent(payload);
    res.json(JSON.parse(result.text || "{}"));
  } catch (error: any) {
    console.error("Error analyzing image OCR:", error);
    res.status(500).json({ error: error.message || "Failed to analyze document" });
  }
});

// 4. API Endpoint: Document Text Summary (Sistematización de Hechos)
app.post("/api/gemini/summarize-document", async (req, res) => {
  try {
    const { documentText } = req.body;
    if (!documentText) {
      return res.status(400).json({ error: "No document text provided" });
    }

    const payload = {
      model: "gemini-3.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Analiza la narración de hechos fácticos contenida en este requerimiento fiscal u orden de aprehensión y realiza un resumen sumamente estructurado que pueda ser leído en voz alta por el Secretario del Tribunal durante el inicio de la audiencia de declaración de imputado o inicial. 

Incluye de forma clara:
- Día, hora y lugar de los hechos.
- Modo de comisión (acciones concretas atribuidas).
- Pruebas iniciales reseñadas (testigos, actas policiales, decomisos).

TEXTO ORIGINAL:
${documentText.substring(0, 20000)}`,
            },
          ],
        },
      ],
      config: {
        systemInstruction: "Eres un Secretario de Tribunal de Honduras. Tienes la tarea de redactar el acta del hecho de manera formal, neutral, concisa y extremadamente precisa.",
      },
    };

    const result = await ai.models.generateContent(payload);
    res.json({ text: result.text });
  } catch (error: any) {
    console.error("Error summarizing document:", error);
    res.status(500).json({ error: error.message || "Failed to summarize text" });
  }
});

// 5. API Endpoint: Generate Proposal Part of Acta Resolution
app.post("/api/gemini/generate-proposal", async (req, res) => {
  try {
    const { userPrompt, systemPrompt } = req.body;
    if (!userPrompt) {
      return res.status(400).json({ error: "No prompts provided" });
    }

    const payload = {
      model: "gemini-3.1-pro-preview",
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }],
        },
      ],
      config: {
        systemInstruction: systemPrompt || "Eres un Juez del poder judicial de Honduras de Letras Penal.",
        thinkingConfig: { thinkingLevel: "HIGH" }
      },
    };

    const result = await ai.models.generateContent(payload);
    res.json({ text: result.text });
  } catch (error: any) {
    console.error("Error generating proposal:", error);
    res.status(500).json({ error: error.message || "Failed to generate legal proposal" });
  }
});

// 6. API Endpoint: Google Calendar Sync via OAuth
app.post("/api/calendar/sync", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Missing or invalid Authorization header." });
    }
    const token = authHeader.split(' ')[1];

    const { startDate, endDate, expediente, sala, observations, calendarId } = req.body;
    
    // Validación mínima de los datos provenientes del frontend
    if (!startDate || !endDate || !expediente) {
      return res.status(400).json({ error: "Faltan datos obligatorios para agendar (startDate, endDate, expediente)." });
    }

    // 1. Configuración de autenticación OAuth
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: token });

    const calendar = google.calendar({ version: 'v3', auth });

    // 2. Estructura del evento con el formato exacto requerido por Google Calendar
    const event: any = {
      summary: `Audiencia Expediente: ${expediente}`,
      location: sala || "Sala no asignada",
      description: `Audiencia agendada automáticamente desde Justicia Rápida HN.\n\nExpediente: ${expediente}\nSala: ${sala || "N/A"}\nObservaciones: ${observations || "Ninguna"}`,
      start: {
        dateTime: new Date(startDate).toISOString(), 
        timeZone: 'America/Tegucigalpa', // Zona horaria de Honduras
      },
      end: {
        dateTime: new Date(endDate).toISOString(),
        timeZone: 'America/Tegucigalpa',
      },
      reminders: {
        useDefault: false, // Sobrescribir los recordatorios por defecto
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
    };

    if (req.body.generateMeetLink) {
      event.conferenceData = {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      };
    }

    // 3. Petición unidireccional para insertar el evento
    // El calendarId será 'primary' para el calendario principal del usuario o el que se pase en body
    const targetCalendarId = calendarId || 'primary'; 
    
    const response = await calendar.events.insert({
      calendarId: targetCalendarId,
      conferenceDataVersion: 1,
      requestBody: event,
    });

    res.json({
      success: true,
      eventId: response.data.id,
      htmlLink: response.data.htmlLink,
      message: "Evento creado exitosamente en Google Calendar"
    });
  } catch (error: any) {
    if (error.response?.status === 401 || error.message?.includes("invalid authentication credentials")) {
      console.warn("Token de Google Calendar expirado o inválido (401).");
      return res.status(401).json({ error: "El token de inicio de sesión ha expirado o es inválido. Por favor, vuelva a iniciar sesión." });
    }
    console.error("Error sincronizando con Google Calendar:", error);
    res.status(500).json({ error: error.message || "No se pudo agendar la audiencia en Google Calendar" });
  }
});

app.post("/api/meet/create", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Missing or invalid Authorization header." });
    }
    const token = authHeader.split(' ')[1];

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: token });

    const calendar = google.calendar({ version: 'v3', auth });
    
    // Crear un evento inmediato de 30 mins solo para sacar una sala de Meet
    const now = new Date();
    const end = new Date(now.getTime() + 30 * 60 * 1000);

    const event: any = {
      summary: `Sala Virtual de Audiencia`,
      description: `Generado automáticamente a petición del usuario.`,
      start: {
        dateTime: now.toISOString(), 
        timeZone: 'America/Tegucigalpa',
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: 'America/Tegucigalpa',
      },
      conferenceData: {
        createRequest: {
          requestId: `meet-direct-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      }
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      requestBody: event,
    });

    res.json({
      success: true,
      meetLink: response.data.hangoutLink,
      eventId: response.data.id,
      htmlLink: response.data.htmlLink,
    });
  } catch (error: any) {
    if (error.response?.status === 401 || error.message?.includes("invalid authentication credentials")) {
      console.warn("Token de Meet expirado o inválido (401).");
      return res.status(401).json({ error: "El token de inicio de sesión ha expirado o es inválido. Por favor, vuelva a iniciar sesión." });
    }
    console.error("Error creating Meet link:", error);
    res.status(500).json({ error: error.message || "No se pudo generar la sala de Meet." });
  }
});

// 7. Serve static files & setup Vite in development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
