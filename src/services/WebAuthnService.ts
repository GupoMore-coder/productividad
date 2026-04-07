import { 
  startRegistration, 
  startAuthentication 
} from '@simplewebauthn/browser';
import { supabase } from '../lib/supabase';

/**
 * v13: Vanguard Biometrics Service (Elite Passkey Flow)
 * Now supports "Discoverable Credentials" (Login without entering username).
 * Optimized for maximum mobile frictionless access under Antigravity standards.
 */
export class WebAuthnService {
  /**
   * Registers a new biometric credential for the current user.
   * Sets up "Resident Keys" for Zero-Click login.
   */
  static async registerDevice(user: any): Promise<void> {
    if (!user) throw new Error('Usuario no autenticado');

    // 1. Prepare options for a Resident Key (Passkey)
    const options: any = {
      challenge: btoa(Math.random().toString(36) + Date.now()),
      rp: { name: 'Antigravity | Grupo More', id: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname },
      user: {
        id: btoa(user.id), // Vital: The userHandle
        name: user.username || user.email,
        displayName: user.full_name || user.username,
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },  // ES256
        { alg: -257, type: 'public-key' } // RS256
      ],
      authenticatorSelection: { 
        userVerification: 'required', 
        residentKey: 'required',
        requireResidentKey: true
      },
      attestation: 'none',
      timeout: 60000,
    };

    try {
      const regResp = await startRegistration(options);
      
      // 2. Store the public credential in Supabase
      const { error } = await supabase.from('user_credentials').insert({
        user_id: user.id,
        credential_id: regResp.id,
        public_key: btoa(JSON.stringify(regResp.response)),
        device_type: navigator.userAgent,
        counter: 0
      });

      if (error) throw error;
      
      // 3. Mark locally to identify this device
      localStorage.setItem(`antigravity_passkey_linked_${user.id}`, 'true');
      localStorage.setItem('antigravity_last_user_id', user.id);
    } catch (err) {
      console.error('⚠️ [Vanguard] Error en registro biométrico:', err);
      throw err;
    }
  }

  /**
   * Authenticates using a previously registered biometric credential.
   * Supports "Discoverable" flow if identifier is not provided.
   */
  static async authenticate(identifier?: string): Promise<any> {
    let allowCredentials: any[] | undefined = undefined;

    // 1. If identifier is provided, fetch specific credentials first as an optimization
    if (identifier) {
      // Find userId first
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .or(`username.ilike.${identifier},email.ilike.${identifier}`)
        .single();
      
      if (profile) {
        const { data: credentials } = await supabase
          .from('user_credentials')
          .select('credential_id')
          .eq('user_id', profile.id);
        
        if (credentials && credentials.length > 0) {
          allowCredentials = credentials.map(c => ({
            id: c.credential_id,
            type: 'public-key',
            transports: ['internal']
          }));
        }
      }
    }

    // 2. Authenticate
    const options: any = {
      challenge: btoa(Math.random().toString(36) + Date.now()),
      rpId: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
      allowCredentials, // If undefined, it triggers "Discoverable Credential" (Passkey) flow
      userVerification: 'required',
      timeout: 60000,
    };

    try {
      const authResp = await startAuthentication(options);
      if (!authResp) return null;

      // 3. Determine which user this belongs to
      let userId: string | null = null;
      
      // The browser returns the userHandle in authResp.response.userHandle
      if (authResp.response.userHandle) {
        userId = atob(authResp.response.userHandle);
      } else {
        // Fallback: search DB for this credential ID
        const { data: cred } = await supabase
          .from('user_credentials')
          .select('user_id')
          .eq('credential_id', authResp.id)
          .single();
        if (cred) userId = cred.user_id;
      }

      if (!userId) throw new Error('No se pudo identificar al usuario vinculado con esta credencial.');

      // 4. Fetch the full profile for the final login
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
      
      return { 
        success: true, 
        userId, 
        profile,
        credentialId: authResp.id 
      };
    } catch (err: any) {
      if (err.name === 'NotAllowedError') return null; // User cancelled
      console.error('⚠️ [Vanguard] Error en autenticación biométrica:', err);
      throw err;
    }
  }

  static isDeviceLinked(userId?: string): boolean {
    if (!userId) {
       const keys = Object.keys(localStorage);
       return keys.some(k => k.startsWith('antigravity_passkey_linked_'));
    }
    return localStorage.getItem(`antigravity_passkey_linked_${userId}`) === 'true';
  }
}
