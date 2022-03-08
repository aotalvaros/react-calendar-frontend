/* eslint-disable no-restricted-globals */

// This service worker can be customized!
// See https://developers.google.com/web/tools/workbox/modules
// for the list of available Workbox modules, or add any other
// code you'd like.
// You can also remove this file if you'd prefer not to use a
// service worker, and the Workbox build step will be skipped.

import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';

clientsClaim();

// Precache all of the assets generated by your build process.
// Their URLs are injected into the manifest variable below.
// This variable must be present somewhere in your service worker file,
// even if you decide not to use precaching. See https://cra.link/PWA
precacheAndRoute(self.__WB_MANIFEST);

// Set up App Shell-style routing, so that all navigation requests
// are fulfilled with your index.html shell. Learn more at
// https://developers.google.com/web/fundamentals/architecture/app-shell
const fileExtensionRegexp = new RegExp('/[^/?]+\\.[^/]+$');
registerRoute(
  // Return false to exempt requests from being fulfilled by index.html.
  ({ request, url }) => {
    // If this isn't a navigation, skip.
    if (request.mode !== 'navigate') {
      return false;
    } // If this is a URL that starts with /_, skip.

    if (url.pathname.startsWith('/_')) {
      return false;
    } // If this looks like a URL for a resource, because it contains // a file extension, skip.

    if (url.pathname.match(fileExtensionRegexp)) {
      return false;
    } // Return true to signal that we want to use the handler.

    return true;
  },
  createHandlerBoundToURL(process.env.PUBLIC_URL + '/index.html')
);

// An example runtime caching route for requests that aren't handled by the
// precache, in this case same-origin .png requests like those from in public/
registerRoute(
  // Add in any other file extensions or routing criteria as needed.
  ({ url }) => url.origin === self.location.origin && url.pathname.endsWith('.png'), // Customize this strategy as needed, e.g., by changing to CacheFirst.
  new StaleWhileRevalidate({
    cacheName: 'images',
    plugins: [
      // Ensure that once this runtime cache reaches a maximum size the
      // least-recently used images are removed.
      new ExpirationPlugin({ maxEntries: 50 }),
    ],
  })
);

// This allows the web app to trigger skipWaiting via
// registration.waiting.postMessage({type: 'SKIP_WAITING'})
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Any other custom service worker logic can go here.




//PWA manual:

/*self = hace referencia al service-worker,  addEventListener = para agregar un evento y se haga cuando se haga la instalacion,
  luego se dispara una funcion.*/
self.addEventListener('install', async( evento ) => {
  //console.log("instalar "); // solo se muestra una vez cuando ya se halla creado y el serviceWorker y detecta que es el mismo 

  //Es un espacio de disco duro para poder grabar informacion en el cache
  const cache = await caches.open('cache-1');

  //se quiere grabar
  await cache.addAll([
    //se guarda estilos del bootstrap
    "https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css",
    "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.12.0-2/css/all.min.css",
    "/favicon.ico"
  ])
});

const apiOffLineFallbacks = [
  'http://localhost:4000/api/auth/renew',
  'http://localhost:4000/api/events'
]
//ciclo de vida para las estrategias del cache
self.addEventListener('fetch', (evento) => {

  //console.log(evento.request.url); // muestra las solicitudes que pasa por el serviceWorker
  
  if( !apiOffLineFallbacks.includes(evento.request.url) ) return;
  
  //console.log(evento.request.url);
  //console.log('VOY A MANEJAR EL RENEW');

  /*se va manejar el request, ir al backend y que me responda la informacion, 
    se puede trabajar con axios, pero recomendado con fetch para no sobre cargar el service-worker */
  const respuesta = fetch(evento.request)
    .then(response =>{

      if ( !response){
        return caches.match(evento.request);
      }
      //guardar en cache la respuesta
      caches.open('cache-dynamic').then(cache => {
          cache.put(evento.request, response) // cuando alguien mas vuelva hacer el request, el cache ya sabe cual requeste es
        })
  
      return response.clone(); // Es muy importante realizar la clonacion, para responderle al navegador un respuesta intacta
    })
    .catch( error =>{
      console.log('offline response');
      return caches.match(evento.request); // si todo falla regreseme la respuesta anterior 
    })

    evento.respondWith( respuesta ); //el evento va responder con la respuesta que responda el fetch
    
})