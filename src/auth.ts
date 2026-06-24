import { onAuthStateChanged, User, browserSessionPersistence, setPersistence, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

// Scopes for Google Calendar and Gmail
googleProvider.addScope('https://www.googleapis.com/auth/calendar.events');
googleProvider.addScope('https://www.googleapis.com/auth/gmail.send');
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');

// Enforce login for a specific email
// (Removed to allow any user to test)

const overlay = document.getElementById('login-overlay');
const loginBtn = document.getElementById('google-login-btn');
const errorMsg = document.getElementById('auth-error-msg');

let cachedAccessToken: string | null = sessionStorage.getItem('google_access_token');
if (cachedAccessToken === 'null' || cachedAccessToken === 'undefined') cachedAccessToken = null;

export const getAccessToken = async (): Promise<string | null> => {
  let token = cachedAccessToken || sessionStorage.getItem('google_access_token');
  if (token === 'null' || token === 'undefined') token = null;
  return token;
};

// Export to window for access from index.html scripts
(window as any).getAccessToken = getAccessToken;

(window as any).forceReLogin = async () => {
  cachedAccessToken = null;
  sessionStorage.removeItem('google_access_token');
  await auth.signOut();
  if (overlay) {
      overlay.style.display = 'flex';
      document.body.style.overflow = 'hidden';
  }
};

let isSigningIn = false;

// Listen to auth state
onAuthStateChanged(auth, (user) => {
    let token = cachedAccessToken || sessionStorage.getItem('google_access_token');
    if (token === 'null' || token === 'undefined') token = null;

    // If we have a user but no access token, we should force them to log in again to get the token
    if (user && token) {
        // Hide overlay on successful auth with token
        if (overlay) {
            overlay.style.display = 'none';
            document.body.style.overflow = 'auto'; // Restore scroll
        }
        
        // Cargar agenda desde Firestore al iniciar sesión
        if ((window as any).loadAgendaFromFirestore) {
            (window as any).loadAgendaFromFirestore().then((data: any) => {
                if (data && Object.keys(data).length > 0) {
                    (window as any).agendaData = data;
                    if ((window as any).saveAgendaToLocal) (window as any).saveAgendaToLocal();
                    if ((window as any).renderCalendar) (window as any).renderCalendar();
                }
            });
        }
    } else if (!isSigningIn) {
        // Show overlay if not logged in or missing token
        if (overlay) {
            overlay.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // Prevent scroll
        }
        auth.signOut(); // Ensure they click the button to get a fresh token
        sessionStorage.removeItem('google_access_token');
    }
});

// Detect iframe issue
if (window.self !== window.top) {
    if (errorMsg) {
        errorMsg.innerHTML = '<span class="text-xl" style="color: #ff4444; font-weight: bold;">⚠️ AVISO IMPORTANTE:</span><br><br>Estás viendo esto dentro de una vista previa. <b>Google bloquea el inicio de sesión aquí.</b><br><br>👉 Por favor, haz clic en la flecha <b>↗️ (Open in new tab)</b> arriba a la derecha para poder acceder.';
        errorMsg.classList.remove('hidden');
    }
}

// Setup click handler
if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
        if (isSigningIn) return;
        isSigningIn = true;
        if (errorMsg) errorMsg.classList.add('hidden');
        try {
            await setPersistence(auth, browserSessionPersistence);
            
            const result = await signInWithPopup(auth, googleProvider);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            if (credential?.accessToken) {
                cachedAccessToken = credential.accessToken;
                sessionStorage.setItem('google_access_token', credential.accessToken);
                
                // Hide overlay immediately upon successful popup
                if (overlay) {
                    overlay.style.display = 'none';
                    document.body.style.overflow = 'auto';
                }

                // Call any pending syncs
                if (typeof (window as any).retryPendingSync === 'function') {
                    (window as any).retryPendingSync();
                    (window as any).retryPendingSync = null;
                }
            }
        } catch (error: any) {
            console.warn('Sign in error:', error);
            // Hide the error message if it's just a cancelled popup request
            if (error.message === 'Iframe blocked' || error.code === 'auth/popup-blocked') {
                if (errorMsg) {
                    errorMsg.innerHTML = '⚠️ <b>Google bloqueó la ventana emergente de acceso.</b><br><br>👉 Estás dentro de una vista integrada. Por favor, <b>abre la aplicación en una pestaña nueva (botón ↗️ arriba)</b> o verifica si tu navegador bloqueó las ventanas emergentes (ícono en la barra de URL).';
                    errorMsg.classList.remove('hidden');
                }
            } else if (error.code !== 'auth/cancelled-popup-request' && error.code !== 'auth/popup-closed-by-user') {
                if (errorMsg) {
                    errorMsg.textContent = 'Error al iniciar sesión: ' + error.message;
                    errorMsg.classList.remove('hidden');
                }
            }
        } finally {
            isSigningIn = false;
        }
    });
}
