import puppeteer from "puppeteer";
import path from "path";
import fetch from "node-fetch";
import dotenv from "dotenv";

import fs from "fs";


// Carga la apiKey de Bing desde el archivo .env 
dotenv.config();

const searchAndScrape = async () => {
    const browser = await puppeteer.launch({
        headless: "new",
        executablePath: '/usr/bin/google-chrome-stable', // Ruta al ejecutable
    });

    const page = await browser.newPage();
    const socialDenomination = 'neumaticos bejar';//aca va el nombre de la empresa que queremos buscar en Bing
    const cleanedSocialDenomination = socialDenomination.replace(/\s+/g, '_'); // Reemplaza espacios por guiones bajos porque sino no lo guarda en JSON

    // Realizar una búsqueda en Bing para encontrar el sitio web oficial de la empresa
    const bingApiEndpoint = 'https://api.bing.microsoft.com/v7.0/search';
    // Usa process.env para acceder a la variable de entorno de la clave de suscripción
    const bingSubscriptionKey = process.env.BING_SUBSCRIPTION_KEY

    // API de Bing
    const bingRequestUrl = `${bingApiEndpoint}?q=Sitio+web+${socialDenomination}`;
    const bingRequestHeaders = {
        'Ocp-Apim-Subscription-Key': bingSubscriptionKey,
    };

    try {
        // Realizar la solicitud a la API de Bing
        const bingResponse = await fetch(bingRequestUrl, {
            headers: bingRequestHeaders,
        });

        if (!bingResponse.ok) {
            throw new Error('Error en la solicitud a la API de Bing');
        }

        const bingData = await bingResponse.json();

        // Obtener la URL del primer resultado de búsqueda de Bing
        const url = bingData.webPages.value[0].url;

        // Dir donde se ejecuta el script y ruta completa para guardar los pdf y los datos importantes en JSON obtenidos con el nombre de busqueda de empresa
        const currentWorkingDirectory = process.cwd();
        const pdfFilename = `${socialDenomination}.pdf`;
        const pdfPath = path.join(currentWorkingDirectory, 'public', 'pdfWebs', pdfFilename);

        const jsonFilename = `${cleanedSocialDenomination}.json`;
        const dataPath = path.join(currentWorkingDirectory, 'public', 'dataWebs', cleanedSocialDenomination);
        const jsonPath = path.join(dataPath, jsonFilename);


        //---------------------------------------------------------- va a la web encontrada-----------------------------------------------------//
        await page.goto(url);
        // si la web tiene carga infinita/dinamica scrollea hasta el final
        await page.evaluate(async () => {
            await new Promise((resolve) => {
                let totalHeight = 0;
                const scrollInterval = setInterval(() => {
                    const distance = 100;
                    window.scrollBy(0, distance);
                    totalHeight += distance;

                    if (totalHeight >= document.body.scrollHeight) {
                        clearInterval(scrollInterval);
                        resolve();
                    }
                }, 200);
            });
        });
        // Agregar una espera de 5 segundos antes de tomar el PDF
        await new Promise(r => setTimeout(r, 5000))
        //----------------------------------------------------- Obtiene en pdf la página ------------------------------------------------------------//
        await page.pdf({ path: pdfPath });


        //--------------------------------------------------- Obtener el contenido HTML de la página------------------------------------------------//
        const htmlContent = await page.content();

        // Realizar búsquedas en el contenido HTML (teléfono, dirección, correo electrónico)
        const phoneRegex = /(tel[eé]fono\s?:?\s?)?\(?\+34\)?\s?\d{3}\s?\d{2}\s?\d{2}\s?\d{2}/gi;
        const phoneMatches = htmlContent.match(phoneRegex);

        const addressRegex = /(Calle|Avenida|Av\.|Blvd\.|Plaza|Carrer|Paseo|P\.|Via)\s?[A-Za-z0-9\s\-áéíóúÁÉÍÓÚñÑ]+/gi;
        const addressMatches = htmlContent.match(addressRegex);

        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        const emailMatches = htmlContent.match(emailRegex);

        // Filtrar las palabras excluidas y tomar solo las tres primeras entradas
        const excludedWords = ["inicio", "contactenos", "quienes somos", "nosotros"];
        const filteredHeadings = await page.evaluate((excludedWords) => {
            const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
            const filteredEntries = headings
                .filter(heading => !excludedWords.some(word => heading.textContent.toLowerCase().includes(word.toLowerCase())))
                .map(heading => heading.textContent);
            return filteredEntries.slice(0, 3);
        }, excludedWords);

        // Tomar los primeros tres párrafos
        const paragraphs = await page.evaluate(() => {
            const paragraphElements = Array.from(document.querySelectorAll('p'));
            return paragraphElements.slice(0, 3).map(p => p.textContent);
        });

        // Verificar si los datos están vacíos y establecer un mensaje en su lugar si es necesario
        const direccion = addressMatches ? addressMatches[0] : "No se encontró la dirección.";
        const telefonos = phoneMatches ? phoneMatches : "No se encontraron teléfonos.";
        const email = emailMatches ? emailMatches[0] : "No se encontró el correo electrónico.";

        // Guardar los resultados en archivos JSON
        fs.writeFileSync(dataPath, JSON.stringify({ direccion, telefonos, email, titulos: filteredHeadings, parrafos: paragraphs }, null, 2));



        await browser.close();
    } catch (error) {
        console.error('Error:', error);
        await browser.close();
    }
};

searchAndScrape();