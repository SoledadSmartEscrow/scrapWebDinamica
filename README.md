# Web Scraping   :eyes:

El objetivo este script de Node.js es buscar información de una empresa en Bing, descargar su sitio web como PDF y extraer datos como dirección, teléfonos, <br>
 correo electrónico y títulos importantes que son almacenados en un archivo JSON. <br>



## Requisitos  :floppy_disk:

Para ejecutar este script, se utilizan las siguientes dependencias: <br>

- `puppeteer`: Para la automatización del navegador. <br>
- `node-fetch`: Para realizar solicitudes HTTP a la API de Bing. <br>
- `dotenv`: Para gestionar las variables de entorno. <br>
- `fs`: Módulo nativo de Node.js para operaciones de sistema de archivos. <br>

## Instrucciones   :minidisc:

1. En el archivo `.env` en el directorio raíz del proyecto se agrego una clave de suscripción de Bing <br>

2. En el script debera cargarse el nombre de la empresa a buscar en **const socialDenomination = {NombreEmpresa}** <br>

