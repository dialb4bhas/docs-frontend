import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx'
import './index.css'

import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'ap-southeast-2_lu1Q9BOpQ', // Found in Cognito User Pool settings
      userPoolClientId: 'r8cg4jtjjq4f6jgtgh6qlckt9', // Found in App Integration -> App Clients
      loginWith: {
        oauth: {
          domain: 'docs-betafactory.auth.ap-southeast-2.amazoncognito.com', 
          scopes: ['email', 'profile', 'openid', 'aws.cognito.signin.user.admin'],
          redirectSignIn: ['https://docs.betafactory.info/auth/callback', 'http://localhost:5173/auth/callback'],
          redirectSignOut: ['https://docs.betafactory.info/', 'http://localhost:5173/'], 
          responseType: 'code'
        }
      }
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)