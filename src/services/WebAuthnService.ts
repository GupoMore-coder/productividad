import { 
  startRegistration, 
  startAuthentication 
} from '@simplewebauthn/browser';
import { supabase } from '../lib/supabase';

export class WebAuthnService {
  private static generateChallenge(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, Array.from(array)));
  }

  static async registerDevice(user: { id: string; username?: string; email?: string; full_name?: string }): Promise<void> {
    if (!user) throw new Error('Usuario no autenticado');

    const challenge = this.generateChallenge();
    const rpId = window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname;

    const options = {
      challenge,
      rp: { name: 'Antigravity | More Paper & Design', id: rpId },
      user: {
        id: btoa(user.id),
        name: user.username || user.email || 'user',
        displayName: user.full_name || user.username || 'Usuario',
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' as const },
        { alg: -257, type: 'public-key' as const }
      ],
      authenticatorSelection: { 
        userVerification: 'required' as const, 
        residentKey: 'required' as const,
        requireResidentKey: true
      },
      attestation: 'none' as const,
      timeout: 60000,
    };

    try {
      const regResp = await startRegistration(options);
      
      const { error } = await supabase.from('user_credentials').insert({
        user_id: user.id,
        credential_id: regResp.id,
        public_key: btoa(JSON.stringify(regResp.response)),
        device_type: navigator.userAgent.substring(0, 255),
        counter: 0
      });

      if (error) throw error;
      
      localStorage.setItem(`antigravity_passkey_linked_${user.id}`, 'true');
      localStorage.setItem('antigravity_last_user_id', user.id);
    } catch (err) {
      console.error('Error en registro biométrico:', err);
      throw err;
    }
  }

  static async authenticate(identifier?: string): Promise<{ success: boolean; userId?: string; profile?: any; credentialId?: string } | null> {
    const challenge = this.generateChallenge();
    const rpId = window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname;
    let allowCredentials: any[] | undefined = undefined;

    if (identifier) {
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

    const options = {
      challenge,
      rpId,
      allowCredentials,
      userVerification: 'required' as const,
      timeout: 60000,
    };

    try {
      const authResp = await startAuthentication(options);
      if (!authResp) return null;

      let userId: string | null = null;
      
      if (authResp.response.userHandle) {
        userId = atob(authResp.response.userHandle);
      } else {
        const { data: cred } = await supabase
          .from('user_credentials')
          .select('user_id')
          .eq('credential_id', authResp.id)
          .single();
        if (cred) userId = cred.user_id;
      }

      if (!userId) throw new Error('No se pudo identificar al usuario vinculado con esta credencial.');

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
      
      return { 
        success: true, 
        userId, 
        profile,
        credentialId: authResp.id 
      };
    } catch (err: any) {
      if (err.name === 'NotAllowedError') return null;
      console.error('Error en autenticación biométrica:', err);
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