# Uni Dashboard Extension

A simple Chrome new-tab extension that:

* Fetches your university’s iCal feed (provided by Brightspace) for tasks/events.
* Displays upcoming tasks in a sidebar with editable priority and done checkboxes.
* Shows a live clock and Google search bar in the main area.

---

## Captura del producto final

![Captura del producto final](.imgs/screenshot.png)

---

## Archivos necesarios

* `manifest.json`
* `dashboard.html`
* `dashboard.js`
* `style.css`
* `ical.js` (UMD bundle of \[ical.js])

Clona o descarga este repositorio estos archivos deben quedar en una SOLA carpeta NO COMPRIMIDA.



---

## Instalación y uso

0. Abre los archivos descargados de la carpeta descomprimida, en `dashboard.js` en la linea `const ICS_URL  =  <icalURL>` agrega tu URL de iCal. **(VER Cómo obtener el token en Brightspace)**
1. Abre `chrome://extensions` en Chrome.
2. Activa **Modo de desarrollador**.
3. Haz clic en **Cargar extensión descomprimida** y selecciona la carpeta con los archivos.
4. En la vista de extensiones debería aparecer **Uni To-Do Dashboard**.
5. Abre una nueva pestaña; el dashboard se mostrará automáticamente.

---

## Cómo obtener el token en Brightspace

Para suscribirte a tu calendario de Brightspace y copiar tu URL de iCal:

1. Ingresa a **Brightspace** y abre tu curso.

2. En el menú superior selecciona **Calendario**.

3. Haz clic en el icono de **Suscripciones** (o rueda dentada) para abrir el modal de suscripciones.

4. Copia la **URL** que aparece en el campo (termina en `?token=...`).
Abajo del texto:
`Copie y pegue la siguiente dirección URL en cualquier aplicación externa de calendario para suscribirse a eventos de los calendarios seleccionados.`

6. Pega esta URL en el archivo del paso 0 y guarda.

Ahora la extensión cargará únicamente tus eventos futuros desde la URL proporcionada.

---

## Licencia
```
        DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
               Version 2, December 2004
```

Copyright (C) 2004 Sam Hocevar [sam@hocevar.net](mailto:sam@hocevar.net)

Everyone is permitted to copy and distribute verbatim or modified copies of this license document, and changing it is allowed.

```
        DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
```

TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION

0. You just DO WHAT THE FUCK YOU WANT TO.
1. I am not liable for ANYTHING.
