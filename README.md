# Casa — proyecto unificado: compra, calendario y recetas

Documento de referencia de las tres apps domésticas (compra, calendario y recetas) y de su infraestructura compartida.

---

## 1. Qué es esto

Tres apps web (PWA) de uso doméstico para dos personas (un iPhone y un Android). Misma dirección en los dos móviles, instaladas en la pantalla de inicio. Cada app es **un solo `index.html`** con interfaz, estilos y lógica dentro, sin compilación ni dependencias locales. Las tres comparten **el mismo proyecto de Firebase** y **el mismo `config.js`**. Coste total: 0 €.

| App | Dirección (desde el 18 de oct. de 2026) | Qué hace | Estado |
| --- | --- | --- | --- |
| La compra | `TU-USUARIO.github.io/hogar/compra/` | Lista compartida por once secciones, habituales con ritmo aprendido, sugerencias «Quizá os falte…», histórico por semanas | v1.3, cerrada, en uso desde sept. 2026 |
| Calendario | `TU-USUARIO.github.io/hogar/calendario/` | Agenda, semana, mes, fechas señaladas, menú semanal, citas repetidas, avisos push, calendarios externos de solo lectura | En uso desde sept. 2026 |
| Recetas | `TU-USUARIO.github.io/hogar/recetas/` | Recetario estilo Crouton: biblioteca, escalado por raciones, modo cocina con temporizadores, importación desde web, texto y foto | En uso desde oct. 2026; 195 recetas importadas de Crouton |

- Las recetas sustituyen a Crouton (11,99 €/año).
- Las tres viven juntas en un único repositorio, **`hogar`** (sección 14). Las direcciones antiguas (`/compras/`, `/calendario/`, `/recetas/`) siguen existiendo hasta que se retiren los repositorios viejos.

---

## 2. Cómo trabajar en este proyecto

**Respuestas**
- Todo en castellano: documentos, textos de la interfaz, comentarios del código y explicaciones.
- Explicar en lenguaje llano, sin tecnicismos, cómo se ha garantizado la ligereza visual, la facilidad de uso y el rendimiento de cada cambio. Explicar primero los efectos y después los mecanismos.
- Si algo no se entiende, el usuario lo dice («¿A qué te refieres?», «Explícalo mejor»).
- Al comparar productos o servicios, dar el precio sin seguros.
- Mantener el stack y las librerías ya elegidos; no cambiar de tecnología de forma arbitraria.
- Auditoría continua: si un diseño anterior se ha vuelto denso, lento o difícil de usar, refactorizarlo por iniciativa propia e informar de la mejora.

**Entrega de archivos**
- **Siempre archivos completos, nunca fragmentos.** el usuario trabaja desde el editor web de GitHub, sin entorno local. Pegar solo un trozo ya le corrompió una vez el `importar.mjs` del calendario.
- **Las reglas de Firestore, siempre enteras**, nunca solo el bloque que se añade.
- Nada de terminal ni de carpetas ocultas cuando se pueda evitar. Para crear algo dentro de `.github/workflows/`, se usa «Create new file» escribiendo la ruta completa en el nombre.
- Mejor subir los archivos que pegarlos.
- Los repositorios son públicos: no escribir correos, contraseñas ni datos personales en README ni en mensajes de *commit*. El `config.js` sí lleva los correos reales (hacen falta para los nombres); la copia `firestore.rules` del repositorio lleva los de ejemplo.

**Antes de tocar un `index.html`, partir siempre de la versión publicada** (la de `hogar`), nunca de una copia guardada de otro chat, para no acabar con dos versiones del mismo archivo. Los archivos publicados se pueden leer en `raw.githubusercontent.com/santiagocapo/hogar/main/<ruta>`.

---

## 3. Infraestructura compartida

| Pieza | Servicio | Coste |
| --- | --- | --- |
| Alojamiento | GitHub Pages (repositorios públicos) | Gratis |
| Base de datos | Firebase Firestore, plan Spark, región `europe-southwest1` | Gratis |
| Inicio de sesión | Firebase Authentication (Google y correo/contraseña) | Gratis |
| Avisos push | GitHub Actions + Firebase Cloud Messaging (FCM) | Gratis |
| Intermediario de recetas (opcional) | Cloudflare Worker (`worker.js`) | Gratis |

**Cuota gratuita de Firebase** (por proyecto, no por app): unas 50.000 lecturas y 20.000 escrituras al día, 1 GB de almacenamiento. Como las tres apps comparten proyecto, **comparten también la cuota**. Con dos personas sobra de largo; la clave es no cargar históricos enteros al abrir una pantalla.

**Archivos de cada repositorio**

| Archivo | Para qué |
| --- | --- |
| `index.html` | La app entera |
| `config.js` | Configuración; se sube una vez y las actualizaciones no lo tocan |
| `sw.js` | Service worker: la app abre sin conexión |
| `manifest.webmanifest` + iconos | Instalación en la pantalla de inicio |
| `firestore.rules` | Copia de referencia; **las activas están en la consola de Firebase** |

**Qué se descartó y por qué (no volver sobre ello)**
- **Neocities**: su plan gratuito bloquea con CSP las conexiones a servicios externos como Firebase; solo se levanta pagando.
- **Plan Blaze de Firebase**: exige tarjeta. Por eso no hay Firebase Storage (las fotos de recetas van dentro de Firestore, reducidas) ni Cloud Functions (los avisos van con GitHub Actions). *Corrección respecto a un documento antiguo: FCM en sí es gratuito; lo que exige Blaze son las Cloud Functions.*

**Seguridad**
- La `apiKey` de Firebase **no es un secreto**: es pública por diseño. GitHub la marca como «Publicly leaked secret» / «Google API Key»; se cierra como **False positive** y no se rota nada.
- Lo que protege los datos son las **reglas de Firestore** y los **dominios autorizados** de Authentication.
- Restringir la clave en Google Cloud (Credenciales) por sitio web es opcional y no hace falta. Si algún día se activa, deben constar `TU-USUARIO.github.io/*` y `*.firebaseapp.com/*`; con un dominio propio habría que añadirlo.
- El aviso de baja de Firebase Studio (cierre el 22 de marzo de 2027) **no afecta**: solo cierra ese entorno de desarrollo, no Firestore ni Authentication.

**Mismo origen**: las cuatro apps viven bajo `TU-USUARIO.github.io`, así que para el navegador son **el mismo origen**. Consecuencias:
- Comparten `localStorage`, cookies e IndexedDB; lo que las separa es la ruta (ámbito del *service worker*). Las claves de `localStorage` **deben llevar prefijo por app** (`cal.ocultos`, `cal.avisoToken`, `compra.…`, `rec.…`). Es un riesgo que existe ya hoy, no solo al hacer la mudanza.
- La sesión de Firebase Authentication se guarda por origen: iniciar sesión en una app suele valer para las demás, y cerrar sesión en una puede cerrarla en todas.

**Límites conocidos**
- El inicio de sesión con Google puede fallar en el iPhone dentro de la app instalada (Apple bloquea la ventana emergente). Alternativa: correo y contraseña; la sesión queda guardada.
- Los avisos de GitHub Actions pueden retrasarse varios minutos.
- GitHub pausa las tareas programadas de repositorios públicos tras 60 días sin actividad; la tarea incluye un paso que intenta evitarlo.
- Los registros de Actions son públicos en un repositorio público: los scripts solo escriben recuentos, nunca títulos, nombres ni correos.

---

## 4. `config.js` (uno solo, en la raíz de `hogar`)

Desde la mudanza hay **un único `config.js`**, en la raíz de `hogar`. Cada carpeta de app (`compra/`, `calendario/`, `recetas/`) tiene su propio `config.js` de **una sola línea** que lo lee:

```javascript
export * from "../config.js";
```

Así ninguna app necesita cambios en su `index.html`, que sigue haciendo `import("./config.js")`. El archivo único lleva todos los nombres que alguna app importa (los tres antiguos eran casi idénticos; solo el del calendario tenía `VAPID`, y ninguno tenía `PROXY_RECETAS`):

```javascript
export const firebaseConfig = {
  apiKey: "…", authDomain: "TU-PROYECTO-FIREBASE.firebaseapp.com", projectId: "TU-PROYECTO-FIREBASE",
  storageBucket: "TU-PROYECTO-FIREBASE.firebasestorage.app", messagingSenderId: "…", appId: "…"
};

// Lista de acceso: correos en minúsculas, iguales que en las reglas de Firestore.
// El primero sale en azul, el segundo en rosa; «Los dos», en verde.
// Una cuenta que no esté aquí queda fuera aunque entre con Google.
export const USUARIOS = {
  "persona-a@ejemplo.com": "Persona A",
  "persona-b@ejemplo.com": "Persona B"
};

// Para saltar de una app a otra (botones de las cabeceras).
export const APPS = {
  compra: "https://TU-USUARIO.github.io/hogar/compra/",
  calendario: "https://TU-USUARIO.github.io/hogar/calendario/",
  recetas: "https://TU-USUARIO.github.io/hogar/recetas/"
};

// Clave pública de push web (Firebase → Cloud Messaging → Certificados de push web).
export const VAPID = "…";

// Opcional: Cloudflare Worker para importar recetas de webs ("" = usar intermediarios públicos).
export const PROXY_RECETAS = "";
```

Notas:
- Si falta un `export` que alguna app importa, esa app no abre (aparece la pantalla de «falta config.js»). Por eso el archivo único es siempre el conjunto de todos los nombres.
- La `apiKey`, los correos y `VAPID` reales están en el archivo publicado; en este documento van abreviados.
- **Botones entre apps:** las tres cabeceras construyen sus botones con `APPS`. Antes de la mudanza, la compra no tenía ninguno y el calendario solo tenía el de la compra; el 18 de octubre se añadieron (compra → calendario y recetas; calendario → recetas).

---

## 5. Las once secciones de la compra

El identificador es lo que se guarda en `category` y en `ingredientes[].categoria`. **Los identificadores no deben cambiar nunca** y son los mismos en las tres apps. El **orden** es el del recorrido del súper y se cambia reordenando la lista `CATS` de la app de la compra; manda en la lista, los habituales, el histórico y los desplegables.

| Orden | Identificador | Nombre |
| --- | --- | --- |
| 1 | `cuidado` | Cuidado personal y salud |
| 2 | `lacteos` | Lácteos y huevos |
| 3 | `fruta` | Frutas y verduras |
| 4 | `panaderia` | Panadería, repostería y cereales |
| 5 | `pescaderia` | Pescadería |
| 6 | `carniceria` | Carnicería |
| 7 | `pasta` | Pasta, arroz y legumbres |
| 8 | `conservas` | Conservas y latas |
| 9 | `aceites` | Aceites, salsas y condimentos |
| 10 | `hogar` | Artículos para el hogar |
| 11 | `bebidas` | Vino, cerveza y licores |

Orden confirmado (17 de octubre de 2026).

---

## 6. Modelo de datos (Firestore)

Un solo proyecto, todas las colecciones cuelgan de la raíz. Son **13**: `items`, `compras`, `eventos`, `fechas`, `platos`, `menu`, `dispositivos`, `ajustes`, `externos`, `sistema`, `recetas`, `miniaturas`, `fotos`. (Un documento antiguo decía «nueve» y otro omitía `ajustes` y `sistema`.)

### La compra

**`items`** — un documento por producto, esté en la lista o solo en habituales.
`name`, `category` (identificador), `qty`, `note`, `onList` (pendiente de comprar), `recurring` (habitual; los puntuales se borran al comprarlos), `freq` (`semanal`/`quincenal`/`mensual`/`null`), `lastBought`, `buys` (últimas 8 fechas de compra en milisegundos), `addedBy`, `addedByName`, `addedAt`.

**`compras`** — histórico: un documento por producto marcado como comprado.
`itemId`, `name`, `category`, `qty`, `recurring`, `boughtAt`, `boughtBy`, `boughtByName`. El histórico empezó en la versión 1.1; lo anterior no consta. Al borrar un registro se descuenta del ritmo aprendido.

**Ritmo aprendido**: con tres compras o más se usa la **mediana** de los intervalos (una semana atípica no descuadra); con menos, la frecuencia indicada a mano. Un habitual se sugiere en «Quizá os falte…» cuando han pasado *ritmo − 1* días.

### Calendario

**`eventos`** — `titulo`, `para` (`ambos` o un correo), `fecha` (`AAAA-MM-DD`), `hora`/`horaFin` (`HH:MM`, nulas si es de día completo), `fechaFin`, `lugar`, `notas`, `repite` (`no`/`semana`/`mes`/`anio`), `repiteHasta`, `excepciones` (días anulados de la serie), `serie` (en una cita sacada de una serie, el id de la original), `aviso`, `creadoPor`, `creadoEn`, `editadoPor`, `editadoEn`.

**`fechas`** — cumpleaños y fechas señaladas: `tipo` (`cumple`/`aniversario`/`otra`), `nombre`, `dia`, `mes`, `anio` (opcional), `notas`, `creadoPor`.

**`platos`** — platos del menú: `nombre`, `ingredientes` (lista de `{nombre, categoria}` con los identificadores de la sección 5), `notas`, `ultimoUso`, `recetaId` (cuando el plato viene de una receta).
> `ultimoUso` es **cuándo se puso en el menú, no cuándo se cocinó**. Las veces cocinadas de verdad viven en `recetas`.

**`menu`** — un documento por día, id `AAAA-MM-DD`, con `comida` y `cena`, cada uno una lista de `{id, nombre}` del plato.

**`dispositivos`** — uno por móvil u ordenador con avisos activados: `token`, `usuario`, `dispositivo`, `actualizado`.

**`ajustes`** — documento `colores` con el color elegido de cada calendario.

**`externos`** — un documento por calendario importado: `nombre`, `persona`, `publico`, `soloPara`, `hash`, `actualizado`, `comprobado` y la lista `eventos` con claves cortas `t` (título), `f` (fecha), `h`/`hf` (horas), `ff` (último día), `l` (lugar), `n` (notas). **Solo lo escribe la tarea de GitHub**; desde la app es de solo lectura. Un documento de Firestore admite como máximo 1 MiB: si un calendario crece mucho, conviene recortar la ventana de fechas que se importa.

**`sistema/avisos`** — hora de la última revisión de avisos. Lo escribe la tarea de GitHub.

### Recetas

**`recetas`** — solo texto, para que abrir la app no descargue ninguna foto: `titulo`, `raciones`, `prep` y `coccion` (minutos), `ingredientes` y `pasos` (listas de líneas; las que empiezan por `#` son apartados), `etiquetas`, `notas`, `fuente`, `fuenteNombre`, `favorita`, `vecesCocinada`, `ultimaVez`, `tieneFoto`, `tieneMini`, `fotoUrl` (foto externa que no se pudo copiar), `croutonId`, `creadoPor`, `creadoPorNombre`, `creadoEn`, `editadoPor`, `editadoEn`.

**`miniaturas`** y **`fotos`** — un documento por receta, con el mismo id y el campo `data` (base64). Miniatura: 420 px de lado máximo, se pide cuando su tarjeta va a asomar. Foto grande: 1200 px, solo al abrir la receta.

**Enlaces profundos**: abrir una receta con `…/recetas/#r=IDENTIFICADOR`; en modo paso a paso, `…/recetas/#cocinar=IDENTIFICADOR`.

**Regla de oro**: el calendario **no debe escribir nunca** en `recetas`, `fotos` ni `miniaturas`. Las reglas no distinguen qué app escribe, solo qué cuenta; la garantía está en el código.

---

## 7. Reglas de Firestore (completas)

Son únicas para las tres apps y se publican **enteras** desde la consola de Firebase (Firestore Database → Reglas).

> **Antes de publicar, cambia los dos correos de `esDeCasa()` por los de verdad.** Si se quedan los de ejemplo, Firestore deniega todo y las apps avisan de «sin permiso» nada más abrirse. Ya ha pasado una vez.

> **Cambio respecto a la versión anterior:** se han añadido `ajustes` y `sistema`. Sin `ajustes`, el calendario no puede guardar los colores de los calendarios (error de permisos).

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // CAMBIA ESTOS DOS CORREOS POR LOS VUESTROS ANTES DE PUBLICAR.
    // Son los mismos que hay en config.js, en minúsculas.
    function esDeCasa() {
      return request.auth != null &&
        request.auth.token.email.lower() in ['persona-a@ejemplo.com', 'persona-b@ejemplo.com'];
    }

    // --- Lista de la compra ---
    match /items/{id}   { allow read, write: if esDeCasa(); }
    match /compras/{id} { allow read, write: if esDeCasa(); }

    // --- Calendario ---
    match /eventos/{id} { allow read, write: if esDeCasa(); }
    match /fechas/{id}  { allow read, write: if esDeCasa(); }

    // Ajustes compartidos (colores de cada calendario).
    match /ajustes/{id} { allow read, write: if esDeCasa(); }

    // --- Menú semanal ---
    match /platos/{id}  { allow read, write: if esDeCasa(); }
    match /menu/{id}    { allow read, write: if esDeCasa(); }

    // --- Avisos: un documento por móvil u ordenador con los avisos activados ---
    match /dispositivos/{id} { allow read, write: if esDeCasa(); }

    // Estado de la tarea de avisos: la escribe GitHub Actions (que se salta las reglas).
    match /sistema/{id} { allow read: if esDeCasa(); allow write: if false; }

    // --- Calendarios externos (iCloud, Google...): solo los escribe la tarea de GitHub.
    // Los marcados «solo para mí» solo los puede leer su dueño.
    match /externos/{id} {
      allow read: if esDeCasa() &&
        (resource.data.publico == true || resource.data.soloPara == request.auth.token.email.lower());
      allow write: if false;
    }

    // --- Recetas: solo el texto, para que abrir la app no descargue ninguna foto ---
    match /recetas/{id} { allow read, write: if esDeCasa(); }

    // Foto pequeña de cada receta, la de las tarjetas de la biblioteca.
    match /miniaturas/{id} {
      allow read, delete: if esDeCasa();
      allow create, update: if esDeCasa() && request.resource.data.data is string
        && request.resource.data.data.size() < 300000;
    }

    // Foto grande, solo se descarga al abrir la receta.
    match /fotos/{id} {
      allow read, delete: if esDeCasa();
      allow create, update: if esDeCasa() && request.resource.data.data is string
        && request.resource.data.data.size() < 1000000;
    }
  }
}
```

Notas sobre las reglas:
- Las reglas **no filtran**: una consulta a `externos` solo funciona si la app pide por separado los públicos (`publico == true`) y los propios (`soloPara == correo`). Si algún día se lee la colección entera, dará «sin permiso». Verificado el 17 de octubre de 2026: el calendario ya lo hace así.
- `sistema` se ha puesto en solo lectura porque la tarea de GitHub usa `firebase-admin` y no pasa por las reglas. Verificado el 17 de octubre de 2026: la app del calendario no usa esta colección, así que no hace falta abrir la escritura.

---

## 8. Cómo se enlazan entre sí

Ninguna app llama a otra: todas escriben en las mismas colecciones con el mismo formato. Los botones de las cabeceras, construidos con `APPS`, solo cambian de dirección.

```
RECETAS ──ingredientes──► COMPRA (items)
   │  ▲                       ▲
   │  │ lee menu y platos     │ ingredientes marcados
   │  │ (en qué días está)    │
   └──┴──► CALENDARIO (platos, menu) ──┘
```

- **Recetas → `items`.** «A la compra» propone los ingredientes con la cantidad según las raciones y añade solo los marcados. Si el producto ya existe, lo vuelve a poner en la lista; si no, lo crea con `recurring: false` y la nota «Para: nombre de la receta». La sección se toma del producto si existía; si no, se adivina con una lista de palabras clave.
- **Recetas → `platos` y `menu`.** «Al menú» abre los próximos 14 días y elige comida o cena (después de las 16:00 viene marcada la cena). Crea el plato con los ingredientes y su `recetaId`, o reutiliza el existente, y lo añade al día con `arrayUnion`.
- **Recetas ← `menu` y `platos`.** Escucha `menu` solo de hoy en adelante y pide de `platos` solo los que aparecen. Con eso enseña en qué días está puesta cada receta, pone una chapa en la tarjeta y ofrece el filtro «En el menú». Un plato sin `recetaId` se empareja con su receta por el nombre y, si coincide, se le escribe el `recetaId` una sola vez.
- **Calendario → `items`.** Al poner un plato en el menú pregunta si hay que comprar algo y añade los ingredientes marcados con el mismo formato. Siempre como opción: a veces no hace falta comprar nada.

Observación: **la lógica de «añadir a la compra» está escrita dos veces** (recetas y calendario) y la de adivinar secciones, una. Cualquier cambio en el formato de `items` hay que hacerlo en las dos. Es un buen candidato para la carpeta común (sección 14).

---

## 9. Calendario: avisos push y calendarios externos

- Los avisos se activan por dispositivo desde el menú de la inicial. **En iPhone solo funcionan desde el icono instalado en la pantalla de inicio**, no desde Safari.
- `avisos/enviar.mjs` abre el calendario al pulsar el aviso con `…/hogar/calendario/` (el nombre del repositorio sale de `GITHUB_REPOSITORY`; si el repositorio cambia de nombre, esa dirección cambia sola, pero la carpeta `/calendario/` está escrita en la línea 16).
- La tarea `avisos.yml` de GitHub Actions corre **cada 10 minutos**: primero importa los calendarios externos (solo a las en punto y a las y media) y después envía los avisos con `avisos/enviar.mjs`.
- Secretos del repositorio: `FIREBASE_SERVICE_ACCOUNT` (clave privada de la cuenta de servicio, JSON) y `CALENDARIOS_EXTERNOS`.
- Versiones: `actions/checkout@v5`, `actions/setup-node@v5`, Node 22 (las anteriores daban avisos de obsolescencia). Dependencias: `firebase-admin`, `ical-expander`.
- Qué avisa: citas según el aviso elegido; fechas señaladas a las 9:00 (una semana antes y el mismo día); el menú los domingos a las 19:00 si quedan comidas sin decidir.
- **El domingo 25 de octubre de 2026 cambia la hora** (se retrasa una hora). Verificado el 17 de octubre de 2026: `avisos/enviar.mjs` define `TZ = "Europe/Madrid"` y no usa la hora del servidor (`getHours`, `getUTCHours`, `getTimezoneOffset`), así que el cambio de hora no afecta a los avisos.

Formato de `CALENDARIOS_EXTERNOS` (una entrada por calendario). Es un secreto de GitHub del repositorio `hogar` (Settings → Secrets and variables → Actions):

```json
[
  { "id": "…", "nombre": "iCloud", "persona": "persona-a@ejemplo.com",
    "url": "webcal://…", "verPara": "ambos" },
  { "id": "trabajo-persona-a", "nombre": "Trabajo", "persona": "persona-a@ejemplo.com",
    "url": "https://calendar.google.com/calendar/ical/…/basic.ics", "verPara": "propio" }
]
```

- `verPara`: `ambos` lo ven los dos; `propio`, solo su dueño. En Firestore esto se traduce a `publico` / `soloPara`.
- **El `id` no debe cambiarse nunca**: si cambia, el calendario se trata como nuevo y pierde el color elegido.
- Horas sin zona en iCal: algunos calendarios publican la hora sin zona o marcada como UTC siendo local. El importador las lee como hora de pared; `horaLocal` cubre el segundo caso. Las fechas se guardan como texto en hora local de España.
- **Calendario de trabajo (Google Workspace de un centro de trabajo):** se importa como `trabajo-persona-a`, `verPara: "propio"` (solo lo ve el usuario). Salió el 18 de octubre la «Dirección secreta en formato iCal», que antes no aparecía porque el administrador limitaba compartir fuera del dominio. Nunca se busca un rodeo a esa política (autorizaciones externas, exportaciones a archivos del repositorio): el repositorio es público y hay datos del centro. Quien tenga esa dirección ve todos los detalles de la agenda: se guarda solo como secreto de GitHub.
- **`persona` debe ser el correo con el que se entra a las apps**, no el de Workspace, porque las reglas comparan `soloPara` con ese correo.
- **Cómo copiar los secretos:** el JSON de la cuenta de servicio de Firebase se abre con TextEdit en texto sin formato (debe empezar por `{`). Si se copia desde el navegador o la vista previa de Mac, llega como tabla con tabuladores y falla (`Unexpected token`). El de `CALENDARIOS_EXTERNOS` se escribe con comillas rectas (`"`), nunca curvas, y sin coma tras el último elemento.

---

## 10. Recetas: la importación de Crouton

Crouton exporta («Export all recipes») un `.zip` con un `.crumb` por receta (JSON con fotos en base64). `importar.html`, en el repositorio de recetas, lo abre en el propio navegador sin subirlo a ningún sitio, lo traduce y lo guarda en Firebase. Lee el `.zip` con `DecompressionStream`, sin librerías.

Estructura de un `.crumb`: `name`, `serves`, `duration` (preparación), `cookingDuration` (cocción), `ingredients` (`ingredient.name` y `quantity: {amount, quantityType}`), `steps` (con `isSection`), `tags`, `notes`, `neutritionalInfo` (así, con la errata de Crouton), `webLink`, `sourceName`, `images`, `sourceImage`, `uuid`, `folderIDs`, `defaultScale`.

Traducción de cantidades (es lo que hace funcionar el escalado, porque deja la línea en la forma que la app sabe releer): `GRAMS`→g, `KGS`→kg, `MILLS`→ml, `LITRES`→l, `CENTILITER`→cl, `ITEM`→número suelto, `TABLESPOON`→cucharadas, `TEASPOON`→cucharaditas, `CUP`→tazas, `PINCH`→pizcas, `PACKET`→paquetes, `BUNCH`→manojos, `OUNCE`→oz. Los decimales se escriben como fracción cuando queda mejor (0,5→½). Si el nombre ya trae la unidad («1 kilo de contramuslos»), no se duplica.

**Resultado de la importación real del 17 de octubre de 2026**: 195 recetas, 1.745 ingredientes, 1.145 pasos, 194 fotos, 12 etiquetas. Las 1.389 cantidades se releen y escalan bien (comprobado una por una). Las fotos pasaron de 145 MB a unos 26 MB (la mayor, 298 KB).

- Doce recetas llegan sin pasos porque en Crouton tampoco los tenían (se trajeron de una web y solo capturaron ingredientes); once conservan el enlace de origen y se pueden completar con el importador de webs.
- Doce cantidades son un descuido del propio Crouton («1 taza de sal», «16 manojos de azafrán»: la unidad por defecto cuando no se elige). Se copiaron tal cual, a propósito; el informe final las lista para corregirlas a mano.
- Cada receta guarda su `croutonId`: el mismo `.zip` se puede reimportar las veces que haga falta; las ya existentes se saltan solas.
- **No viaja**: las carpetas (solo exporta sus identificadores), el color de cada etiqueta y la escala por defecto cuando no es 1.
- Consecuencia a tener en cuenta: tras la importación **todas las recetas tienen `vecesCocinada` en 0 y `ultimaVez` vacía**. Las sugerencias por ritmo (sección 13) no tendrán datos reales hasta que se cocine con el modo paso a paso.

`worker.js` (Cloudflare Worker, en el repositorio de recetas) es un intermediario opcional para importar recetas desde webs, porque un navegador no deja que una web lea otra. Sin él, la app usa dos intermediarios públicos gratuitos que a veces fallan. Si se le añade la clave de Gemini, el Worker debe limitar quién puede llamarlo (al menos por origen) para que nadie gaste la cuota gratuita.

---

## 11. Criterios de diseño (para las tres apps)

Se aplican siempre, sin que haga falta pedirlos. Referencias: WCAG 2.2 AA, W3C WAI-ARIA Data Table Patterns, Material Design 3 Data Tables, Apple HIG Navigation, Nielsen Norman Group Dashboard Design, Refactoring UI, The A11y Project.

| Criterio | Cómo se aplica |
| --- | --- |
| Rendimiento con muchos datos (prioridad crítica) | Nada de carga masiva: paginación, filtrado y repintado solo de lo visible, de forma invisible. Índices construidos una vez al recibir los datos; repintado agrupado con `requestAnimationFrame`; nada de recorrer listas enteras al repintar |
| Arquitectura tipo panel | Ley de Miller: resumen en tarjetas y detalle al expandir, nunca parrilla tipo Excel; buscador global y filtros visibles arriba |
| Ligereza visual | Evitar bordes rígidos, líneas divisorias y contenedores pesados; espaciado en múltiplos de 8 px (variables CSS); interlineado mínimo 1,6 en texto descriptivo |
| Ley de Fitts | Todo lo accionable con 44 × 44 px (2,75 rem) como mínimo y bien separado; 52 px (3,25 rem) en filas de lista |
| Tablas | Solo cuando el dato sea de verdad tabular: HTML5 semántico (`thead`, `tbody`, `th`), filas de 52 px mínimo |
| Unidades | Relativas (`rem`, `em`); zoom del 200 % sin desbordes (comprobado a 195, 320, 390 y 768 px de ancho) |
| Animación | Solo `transform` y `opacity`, nunca más de 0,25 s; desactivadas con `prefers-reduced-motion` |
| Teclado | Todo operable, con `:focus-visible` de 3 px |
| Color | Estados y categorías nunca solo por color: texto explícito más icono o forma (cada calendario: color, forma —círculo, cuadrado, rombo, anillo, barra— y nombre) |

**Matiz de accesibilidad**: «sin bordes rígidos» no debe aplicarse a los campos de formulario ni a los botones sin relleno. WCAG 2.2 AA (contraste de componentes, 3:1) exige que se distingan; ahí se mantiene un borde o un fondo claramente visible.

**Estado de aplicación**: compra y calendario revisados el 17 de octubre de 2026 (zoom al 200 %, teclado, tamaño de botones, color); funcionan correctamente. Si en el futuro alguna pantalla se vuelve densa o lenta, se refactoriza por la regla de auditoría continua.

---

## 12. Lecciones aprendidas

- **Caché del iPhone.** Una app en la pantalla de inicio puede quedarse pegada a una versión antigua. Se corrigió haciendo que el *service worker* pida siempre la última versión (`cache: "no-cache"` en los archivos propios). Si una versión antigua se atasca, la única salida es quitar el icono y volver a añadirlo; eso borra lo guardado en el dispositivo y obliga a reactivar los avisos. Corregido también en **la compra** (`compra-v3`, 17 de octubre de 2026). Desde ahora solo hay que subir la versión de `CACHE` al añadir un archivo nuevo a la lista `SHELL` de `sw.js`.
- **Pegar fragmentos en el editor de GitHub corrompe archivos.** Siempre archivos enteros.
- **Si se crea una colección nueva en Firestore, hay que añadirla a las reglas** o la app dará error de permisos. (Es exactamente lo que pasaba con `ajustes` en la versión anterior de las reglas.)
- **Correos de ejemplo en las reglas** → todo denegado.
- **Horas sin zona** en calendarios iCal (ver sección 9).
- **Registros de Actions públicos**: nunca escribir títulos, nombres ni correos.
- **Tareas programadas pausadas** tras 60 días sin actividad.
- **GitHub no renombra carpetas desde la web.** Si una carpeta se sube con nombre equivocado, se vuelve a subir con el correcto y se borra la mala («Delete directory»). Con GitHub Desktop sí se puede renombrar en Finder.
- **Subir carpetas con el nombre exacto y en la raíz:** `avisos/` se subió dentro de `calendario/` por error; las rutas del flujo (`avisos/…`) dan 404 si la carpeta no está en la raíz.
- **No subir nunca la portada del repositorio común a un repositorio de app:** sustituyó a la agenda del calendario el 17 de octubre.
- **Probar siempre en ventana privada** tras subir un archivo: la ventana normal puede enseñar la versión anterior hasta ~10 minutos (caché de GitHub Pages).
- **Mismo origen entre repositorios viejos y nuevos:** al probar las apps de `hogar` no activar los avisos hasta mover el flujo, porque comparten identificador de dispositivo con las viejas.
- **Un solo carácter mal en un correo de las reglas basta para dejar a una persona sin acceso** a algunas colecciones. Se detectó con el Simulador de reglas de Firestore (Reglas → Simulador, `get` de `/menu/prueba` como esa cuenta). Comprobar siempre ambos correos tras publicar.
- **Error silenciado al borrar recetas:** `borrarReceta` enseñaba el error y lo tapaba al instante con «Receta borrada». Corregido el 18 de octubre: si falla, solo se ve el error.
- **La imagen `ubuntu-latest` pasa a Ubuntu 26 desde el 19 de octubre de 2026.** Es solo un aviso; si diera problemas, se fija `ubuntu-24.04` en `avisos.yml`.

---

## 13. Decisiones cerradas y trabajo pendiente

### Decidido, no volver a discutirlo

- El calendario es la fuente única de lo compartido; **no** hay sincronización en los dos sentidos con Google Calendar.
- Los calendarios externos se importan en un solo sentido y son de solo lectura.
- En el menú, los ingredientes se ofrecen como opción, nunca se añaden solos.
- En las citas repetidas se elige si el cambio o borrado afecta a ese día, a ese día en adelante o a toda la serie.
- Las recetas importadas se abren en el editor antes de guardarse, para repasarlas.
- Las tres apps siguen siendo apps separadas (cada una con su `index.html`, `sw.js` y manifest), pero **viven en un repositorio común, `hogar`** (decidido y hecho el 18 de octubre de 2026). No se funden en un único archivo.
- Repositorio `hogar`, **sin dominio propio por ahora** (`TU-USUARIO.github.io/hogar/…`).
- Plan Blaze y Neocities, descartados (sección 3).

### Decidido, sin hacer

1. **Botón «Ver receta»** en el calendario: en la fila de cada plato de la hoja de la comida, en la lista de platos guardados y en el editor del plato; solo cuando el plato tiene `recetaId`. Estado confirmado el 17 de octubre de 2026: sin hacer.

### Propuesto, a falta de confirmar

2. **Sugerencias de platos por ritmo.** Cada receta tiene su ritmo: `ritmo = días registrando ÷ vecesCocinada`; puntuación = `días desde ultimaVez ÷ ritmo`. Los días registrados salen de la `ultimaVez` más antigua, con mínimo de 90 días; el ritmo se limita a entre 7 y 180 días. Cuatro sugerencias con su porqué («12 veces · hace 7 semanas») y un grupo «Sin estrenar» de hasta dos recetas nunca cocinadas. Se descartan las que ya estén en el menú de la semana. Los platos sin `recetaId` no entran.
   - Ojo: con las 195 recetas importadas a 0 veces, «Sin estrenar» sería casi todo el recetario durante meses. Conviene decidir si se siembra alguna veces-cocinadas a mano (las 10–20 recetas de siempre) para que el sistema arranque con datos.
   - Ojo: «días registrando» se calcula con la `ultimaVez` más antigua, que es una fecha de *última* vez, no de primera; infravalora el periodo. Más fiable: guardar la fecha de inicio de registro (la de la primera cocción, o la de la importación).
3. **Despensa estimada y cocina de aprovechamiento.** Un producto se da por presente X días desde que se marcó comprado, según su sección: pescado 2, carne 3, pan 3, fruta y verdura 7, lácteos y huevos 12, armario 120–180. Sale de `compras`. Da una lista de «lo que caduca pronto» y un segundo criterio de orden para las sugerencias (porcentaje de ingredientes que ya se tiene). Fiable con los ingredientes de `platos` (nombres limpios), aproximado con los de `recetas` (texto libre). Cierre futuro: que el modo paso a paso descuente los ingredientes al terminar. Por rendimiento, leer solo las compras recientes (por ejemplo, últimos 30 días para perecederos) y no el histórico entero.
4. **Leer recetas de fotos y vídeos con IA.** El lector actual (Tesseract) reconoce letras pero no entiende lo que lee. Vía recomendada: Gemini con clave gratuita de aistudio.google.com, sin tarjeta, con la clave guardada como secreto en el Worker de Cloudflare, nunca en la app. Resolvería fotos de libros, capturas de redes y, pasando el enlace, vídeos de YouTube. Los vídeos de Instagram y TikTok no se pueden leer directamente.

### Más adelante

5. **Enlace .ics de solo lectura** del calendario, para ver lo compartido en iCloud y Google Calendar.
6. **Varios hogares**: abrir las apps a otras personas que entren con Google. Solo explorado; implicaría migrar datos, activar App Check y redactar un aviso de privacidad (RGPD), porque se tratarían datos de terceros.
7. **Pendientes menores de recetas**: completar a mano las 12 recetas sin pasos y las 12 cantidades por defecto de Crouton.

---

## 14. El repositorio común `hogar` (hecho el 18 de octubre de 2026)

Se juntó el código, no las apps: un repositorio con una carpeta por app, un `config.js` único y la tarea de avisos. Las tres siguen instalándose por separado y un fallo en una no rompe las otras.

```
hogar/                  → TU-USUARIO.github.io/hogar/
  index.html            ← portada con las tres apps (enlaces relativos compra/, calendario/, recetas/)
  config.js             ← el único de verdad
  firestore.rules       ← copia de referencia, con correos de EJEMPLO (los reales, solo en la consola)
  .github/workflows/avisos.yml
  avisos/               ← enviar.mjs, importar.mjs, package.json
  compra/               index.html, sw.js, manifest.webmanifest, iconos, config.js (una línea)
  calendario/           index.html, sw.js, manifest.json, iconos, config.js (una línea)
  recetas/              index.html, sw.js, manifest.webmanifest, iconos, importar.html, worker.js, config.js (una línea)
```

**Qué se hizo, por fases**
1. Preparar: crear `hogar` (público, GitHub Pages desde `main`, raíz), descargar los tres repositorios, generar una clave nueva de la cuenta de servicio de Firebase.
2. Montar: subir carpetas y `config.js` único; `enviar.mjs` con la línea 16 apuntando a `/calendario/`. Sin el flujo de avisos ni los secretos.
3. Probar en el ordenador (abrir, entrar, leer, escribir, saltos entre apps, sin conexión). Aparecieron: portada subida por error al calendario, carpeta del calendario con nombre equivocado, `avisos/` en sitio equivocado, compra sin botones de salto, calendario sin botón de recetas.
4. Cambiar: secretos `FIREBASE_SERVICE_ACCOUNT` y `CALENDARIOS_EXTERNOS` en `hogar`, flujo `avisos.yml` creado en `.github/workflows/`, ejecución de prueba en verde, reinstalación de las tres apps en los dos móviles.
5. Redirecciones y retirada de los repositorios viejos: **pendiente** (sección 15).

**Qué cambió para el usuario**
- Direcciones nuevas (sección 1). Hubo que quitar los iconos viejos, añadir los nuevos y reactivar los avisos.
- Los documentos antiguos de `dispositivos` quedan muertos; `enviar.mjs` los borra solo cuando Firebase los rechaza.
- Se pierden los ajustes guardados en el dispositivo de las apps instaladas (calendarios ocultos, sesión).


**Por qué no se fundieron en una sola app:** funcionan y están en uso; no hay funciones nuevas que lo justifiquen; un único archivo de ~250 KB sería difícil de editar con el editor web de GitHub (la maniobra que ya corrompió un archivo); y un fallo en recetas rompería la lista de la compra. **La señal para fundirlas de verdad**: que haga falta una pantalla que conteste de un vistazo «qué comemos hoy y qué falta comprar». Mientras lo que se quiera sean saltos entre apps, los botones bastan.

---

## 15. Estado

**Verificado y cerrado**
1. Reglas de Firestore publicadas (sección 7), con `ajustes` y los correos reales en la consola.
2. Versión del SDK de Firebase unificada en las tres apps.
3. `firestore.rules` del repositorio con correos de ejemplo; `config.js` lleva los reales.
4. Restricción de la clave en Google Cloud: no hace falta (opcional).
5. Orden de las secciones de la compra: el de la sección 5.
6. `APPS` correcto en `config.js`; `VAPID` conservado.
7. Cambio de hora: `enviar.mjs` usa `Europe/Madrid`, sin horas del servidor.
8. Fecha de inicio del calendario: septiembre de 2026.
9. Criterios de diseño revisados en compra y calendario: funcionan.
10. Consulta a `externos`: públicos y propios por separado.
11. Colección `sistema`: la app no la usa; solo la escribe la tarea de GitHub.
12. Service worker de la compra corregido (`compra-v3`, `no-cache`).
13. Mudanza a `hogar` hecha, con el flujo de avisos funcionando (importar y enviar en verde).
14. Borrado de recetas: funciona.
15. Botones de salto entre apps: añadidos a la compra y al calendario (archivos completos entregados el 18 de octubre).

