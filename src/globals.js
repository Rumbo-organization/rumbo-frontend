import React from 'react';
import * as ReactDOM from 'react-dom/client';

// Los archivos del design project (src/*.jsx) fueron escritos para el scope
// global compartido de Babel-standalone: leen React/ReactDOM y los hooks como
// globales sueltos y publican sus componentes vía Object.assign(window, ...).
// Este shim recrea ese contrato bajo Vite/ESM. main.jsx debe importarlo primero.
Object.assign(window, {
  React,
  ReactDOM,
  // Superficie pública (landing, /terminos, /privacidad): vive en OTRO proyecto
  // de Vercel (decisión 08-jul-2026). Configurable por env para staging.
  RUMBO_PUBLIC_URL: import.meta.env.VITE_PUBLIC_SITE_URL || 'https://rumbo.app',
  useState: React.useState,
  useEffect: React.useEffect,
  useRef: React.useRef,
  useMemo: React.useMemo,
  useCallback: React.useCallback,
  useContext: React.useContext,
  useReducer: React.useReducer,
  useLayoutEffect: React.useLayoutEffect,
});
