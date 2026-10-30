import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { io } from 'socket.io-client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  });
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then(res => { setUser(res.data.user); localStorage.setItem('user', JSON.stringify(res.data.user)); })
        .catch(() => { localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      const s = io('http://localhost:5000');
      if (user.role === 'ngo') s.emit('join-ngo-room', user._id);
      if (user.role === 'customer') s.emit('join-customer-room', user._id);
      setSocket(s);
      return () => s.disconnect();
    }
  }, [user]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    if (socket) socket.disconnect();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, socket }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
