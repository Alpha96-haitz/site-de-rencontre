import { GoogleLogin } from '@react-oauth/google';

export default function GoogleLoginButton({ onSuccess, onError, disabled }) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) return null;

  return (
    <div className={`flex justify-center w-full ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <GoogleLogin
        onSuccess={(credentialResponse) => {
          if (credentialResponse?.credential) {
            onSuccess?.(credentialResponse.credential);
          }
        }}
        onError={(err) => {
          console.error("Google Login Error:", err);
          onError?.(err);
        }}
        useOneTap={false}
        theme="filled_black"
        size="large"
        shape="pill"
        width="100%"
        text="continue_with"
        locale="fr"
      />
    </div>
  );
}
