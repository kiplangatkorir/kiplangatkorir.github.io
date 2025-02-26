import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

interface User {
  id: string;
  email: string;
  name?: string;
  bio?: string;
  avatarUrl?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData extends LoginData {
  name: string;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['auth'],
    queryFn: async () => {
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        throw new Error('Not authenticated');
      }
      return response.json();
    },
    retry: false,
  });

  const login = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Login failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['auth'], data);
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      navigate('/');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to login. Please check your credentials.",
        variant: "destructive",
      });
    },
  });

  const register = useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Registration failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['auth'], data);
      toast({
        title: "Success",
        description: "Registered successfully",
      });
      navigate('/');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to register. Please try again.",
        variant: "destructive",
      });
    },
  });

  const logout = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Logout failed');
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(['auth'], null);
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
      navigate('/login');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (data: Partial<User>) => {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['auth'], data);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: login.mutate,
    register: register.mutate,
    logout: logout.mutate,
    updateProfile: updateProfile.mutate,
  };
}
