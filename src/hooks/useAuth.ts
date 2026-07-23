import { useState } from "react";

import {
  getLoggedUser,
  saveLoggedUser,
  type User,
} from "../storage";

export function useAuth() {
  const [user, setUser] = useState<User | null>(getLoggedUser());

  const login = (newUser: User) => {
    setUser(newUser);
    saveLoggedUser(newUser);
  };

  const logout = () => {
    setUser(null);
    saveLoggedUser(null);
  };

  return {
    user,
    login,
    logout,
  };
}