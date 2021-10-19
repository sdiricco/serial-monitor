/**
 * Main React application file
 */

 import React from 'react';
 import ReactDOM from 'react-dom';
 import './index.css';
 import App from './gui/App';
 
 ReactDOM.render(
   <React.StrictMode>
     <App />
   </React.StrictMode>,
   document.getElementById('root')
 );
