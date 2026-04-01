import { GoogleLogin } from '@react-oauth/google';

export default function GoogleLoginButton({ onSuccess, onError, disabled }) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) return null;

  return (
    <div className={disabled ? 'opacity-50 pointer-events-none' : ''}>
      <GoogleLogin
        onSuccess={(credentialResponse) => {
          if (credentialResponse?.credential) {
            onSuccess?.(credentialResponse.credential);
          }
        }}
        onError={(err) => onError?.(err)}
        useOneTap={false}
        theme="outlined"
        size="large"
        type="icon"
        shape="rectangular"
        text="continue_with"
        locale="fr"
      />
    </div>
  );
}
