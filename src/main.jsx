// Orden de carga = orden de los <script> en el Rumbo.html original.
// Cada módulo publica sus símbolos en window (ver globals.js); app.jsx monta la app.
import './globals.js';
import './styles.css';
import './data.jsx';
import './icons.jsx';
import './components.jsx';
import './palette.jsx';
import './screen-inicio.jsx';
import './screen-polizas.jsx';
import './screen-detail.jsx';
import './screen-contactos.jsx';
import './screen-contacto.jsx';
import './screen-vencimientos.jsx';
import './screen-calendario.jsx';
import './screen-siniestros.jsx';
import './screen-crossselling.jsx';
import './screen-prospectos.jsx';
import './screen-cotizaciones.jsx';
import './screen-productores.jsx';
import './screen-actividad.jsx';
import './screen-configuracion.jsx';
import './screen-cotizador.jsx';
import './forms.jsx';
import './extras.jsx';
import './claim-drawer.jsx';
import './tweaks-panel.jsx';
import './auth-client.js';
import './api-client.js';
import './screen-login.jsx';
import './app.jsx';

// Vercel Web Analytics — inject() es el método agnóstico de framework (esta SPA
// usa React vía globals de window, sin router). Requiere habilitar Analytics en
// el proyecto Vercel del frontend para que /_vercel/insights/script.js exista.
import { inject } from '@vercel/analytics';
inject();
