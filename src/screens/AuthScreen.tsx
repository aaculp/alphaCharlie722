import React, { useState } from 'react';
import LoginScreen from './LoginScreen';
import SignUpScreen from './SignUpScreen';

const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  const switchToSignUp = () => setIsLogin(false);
  const switchToLogin = () => setIsLogin(true);

  return isLogin ? (
    <LoginScreen onSwitchToSignUp={switchToSignUp} />
  ) : (
    <SignUpScreen onSwitchToLogin={switchToLogin} />
  );
};

export default AuthScreen;