const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: '/usr/bin/google-chrome-stable', // Reemplaza esto con la ruta que devolvió el comando "which" anteriormente
    });

    const page = await browser.newPage();
    await page.goto('https://www.elmundo.es/');
    await page.pdf({path: 'elMundo.pdf'});

    await browser.close();
})();

