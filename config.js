// Configuración única de las tres apps (compra, calendario y recetas).
// Cada carpeta de app tiene un config.js de una línea que lee este archivo.
// Hay cuatro valores marcados con PEGA_AQUI: están en tu config.js actual del calendario.

export const firebaseConfig = {
  apiKey: "AIzaSyDWeQwDQQKeDEtxUGiPQN-N_Ge3HzAJY0o",
  authDomain: "lista-de-la-compra-fd066.firebaseapp.com",
  projectId: "lista-de-la-compra-fd066",
  storageBucket: "lista-de-la-compra-fd066.firebasestorage.app",
  messagingSenderId: "841838013657",
  appId: "1:841838013657:web:8cadb0867555de9daf22c8"
};

// Lista de acceso: correos en minúsculas, iguales que en las reglas de Firestore.
// El primero sale en azul, el segundo en rosa; «Los dos», en verde.
// Una cuenta que no esté aquí queda fuera aunque entre con Google.
export const USUARIOS = {
  "santiagocapo@gmail.com": "Santi",
  "olimpiamadridtaverner@gmail.com": "Olimpia"
};

// Para saltar de una app a otra (botones de las cabeceras).
export const APPS = {
  compra: "https://santiagocapo.github.io/hogar/compra/",
  calendario: "https://santiagocapo.github.io/hogar/calendario/",
  recetas: "https://santiagocapo.github.io/hogar/recetas/"
};

// Clave pública de push web (Firebase → Cloud Messaging → Certificados de push web).
export const VAPID = "BIGk1NtlE61ejBync_hEArzFSHLD_ocJalWyep2iWsRsWPv5tPAycAV5Z6zK3BnH96U2P5av_tcSskNBiuYH3co";

// Opcional: Cloudflare Worker para importar recetas de webs ("" = usar intermediarios públicos).
export const PROXY_RECETAS = "";
