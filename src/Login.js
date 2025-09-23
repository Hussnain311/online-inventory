import React, { useState } from 'react';
import { 
  Avatar, 
  Button, 
  TextField, 
  Link, 
  Grid, 
  Box, 
  Typography, 
  Container, 
  Paper, 
  Alert,
  CircularProgress,
  Fade,
  InputAdornment,
  IconButton,
  Divider,
  useTheme
} from '@mui/material';
import {
  LockOutlined as LockOutlinedIcon,
  Email as EmailIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
  Google as GoogleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { auth } from './firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

export default function Login() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/inventory');
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      // Try popup first
      try {
        const result = await signInWithPopup(auth, provider);
        console.log('Google sign-in successful:', result.user);
        navigate('/inventory');
        return;
      } catch (popupError) {
        console.log('Popup failed, trying redirect:', popupError);
        
        // Fallback to redirect if popup fails
        if (popupError.code === 'auth/popup-blocked' || popupError.code === 'auth/internal-error') {
          setError('Google sign-in is not configured yet. Please use email/password sign-in for now.');
          return;
        }
        throw popupError;
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled. Please try again.');
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        setError('An account already exists with this email. Please use email/password sign-in.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked by your browser. Please allow popups and try again.');
      } else if (err.code === 'auth/internal-error') {
        setError('Google sign-in is not configured yet. Please use email/password sign-in for now.');
      } else {
        setError(`Failed to sign in with Google: ${err.message}`);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)'
          : 'linear-gradient(135deg, #ffffff 0%, #e3f2fd 50%, #bbdefb 100%)',
        position: 'relative',
        overflow: 'auto',
        py: { xs: 2, md: 4 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* Animated Background Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          animation: 'float 6s ease-in-out infinite',
          '@keyframes float': {
            '0%, 100%': { transform: 'translateY(0px)' },
            '50%': { transform: 'translateY(-20px)' }
          }
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '60%',
          right: '15%',
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.08)',
          animation: 'float 8s ease-in-out infinite reverse',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '20%',
          left: '20%',
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.06)',
          animation: 'float 7s ease-in-out infinite',
        }}
      />

      <Container maxWidth="lg" sx={{ py: { xs: 1, md: 4 } }}>
        <Grid container spacing={{ xs: 2, md: 4 }} alignItems="center" sx={{ minHeight: { xs: 'auto', md: '100vh' } }}>
          {/* Left Side - Welcome Text (Desktop only) */}
          <Grid size={{ xs: 12, md: 3 }} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Fade in timeout={1000}>
              <Box sx={{ color: 'text.primary', textAlign: 'left', mb: { xs: 4, md: 0 } }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', mb: 1.5 }}>
                  Welcome Back! 👋
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                  Sign in to your account and take control of your inventory management
                </Typography>
                
                {/* Feature Highlights */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <SecurityIcon sx={{ mr: 1.5, fontSize: 18, color: 'primary.main' }} />
                    <Typography variant="body2" color="text.secondary">Secure & Reliable</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <TrendingUpIcon sx={{ mr: 1.5, fontSize: 18, color: 'primary.main' }} />
                    <Typography variant="body2" color="text.secondary">Real-time Analytics</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <InventoryIcon sx={{ mr: 1.5, fontSize: 18, color: 'primary.main' }} />
                    <Typography variant="body2" color="text.secondary">Smart Inventory Tracking</Typography>
                  </Box>
                </Box>
              </Box>
            </Fade>
          </Grid>

          {/* Center - Login Form */}
          <Grid size={{ xs: 12, md: 6 }}>
            {/* Mobile Welcome Text */}
            <Box sx={{ display: { xs: 'block', md: 'none' }, textAlign: 'center', mb: 3, px: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <InventoryIcon sx={{ fontSize: 28, mr: 1, color: 'primary.main' }} />
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
                  InventoryPro
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
                Welcome Back! 👋
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, px: 2 }}>
                Sign in to your account and manage your inventory
              </Typography>
            </Box>
            <Fade in timeout={1200}>
              <Paper 
                elevation={8} 
                sx={{ 
                  p: { xs: 2, md: 3 }, 
                  borderRadius: 3,
                  background: theme.palette.mode === 'dark' 
                    ? 'rgba(17, 17, 17, 0.95)'
                    : 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: theme.palette.mode === 'dark' 
                    ? '1px solid rgba(39, 39, 42, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  position: 'relative',
                  overflow: 'hidden',
                  maxWidth: { xs: '100%', md: 600 },
                  mx: 'auto',
                  width: '100%',
                  // Mobile optimizations
                  '& .MuiTextField-root': {
                    mb: { xs: 1.5, md: 2 }
                  },
                  '& .MuiButton-root': {
                    py: { xs: 1.2, md: 1.5 },
                    fontSize: { xs: '0.9rem', md: '1rem' }
                  }
                }}
              >
                {/* Decorative Elements */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: -50,
                    right: -50,
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                    opacity: 0.1
                  }}
                />
                
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  <Avatar 
                    sx={{ 
                      m: 1.5, 
                      bgcolor: 'primary.main',
                      width: { xs: 50, md: 60 },
                      height: { xs: 50, md: 60 },
                      boxShadow: '0 8px 32px rgba(37, 99, 235, 0.3)',
                      border: '3px solid white'
                    }}
                  >
                    <LockOutlinedIcon sx={{ fontSize: { xs: 25, md: 30 } }} />
                  </Avatar>
                  
                  <Typography component="h1" variant="h4" sx={{ mb: 0.5, fontWeight: 700, color: 'text.primary', fontSize: { xs: '1.5rem', md: '1.8rem' } }}>
                    Sign In
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2.5, textAlign: 'center' }}>
                    Access your inventory dashboard
                  </Typography>
                  
                  {error && (
                    <Alert 
                      severity="error" 
                      sx={{ 
                        width: '100%', 
                        mb: 3, 
                        borderRadius: 2,
                        boxShadow: '0 4px 12px rgba(244, 67, 54, 0.15)'
                      }}
                    >
                      {error}
                    </Alert>
                  )}
                  
                  {/* Google Sign In Button */}
                  <Box sx={{ mb: 2, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      Google sign-in coming soon! Use email/password for now.
                    </Typography>
                  </Box>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={googleLoading ? <CircularProgress size={20} /> : <GoogleIcon />}
                    onClick={() => {
                      console.log('Google sign-in button clicked');
                      handleGoogleSignIn();
                    }}
                    disabled={loading || googleLoading}
                    sx={{ 
                      py: 1.2,
                      mb: 2,
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      borderRadius: 2,
                      borderColor: '#4285f4',
                      color: '#4285f4',
                      opacity: 0.7,
                      '&:hover': {
                        borderColor: '#3367d6',
                        backgroundColor: 'rgba(66, 133, 244, 0.04)',
                        transform: 'translateY(-1px)',
                        opacity: 0.8
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {googleLoading ? 'Signing in...' : 'Continue with Google'}
                  </Button>
                  
                  <Divider sx={{ width: '100%', mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      OR
                    </Typography>
                  </Divider>
                  
                  <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      id="email"
                      label="Email Address"
                      name="email"
                      autoComplete="email"
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading || googleLoading}
                      sx={{ mb: 2 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                    
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      name="password"
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading || googleLoading}
                      sx={{ mb: 1.5 }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    
                    <Grid container justifyContent="flex-end" sx={{ mb: 2 }}>
                      <Grid item>
                        <Link 
                          href="#" 
                          variant="body2" 
                          onClick={() => navigate('/forgot-password')}
                          sx={{ 
                            textDecoration: 'none',
                            fontWeight: 500,
                            color: 'primary.main',
                            '&:hover': { 
                              textDecoration: 'underline',
                              color: 'primary.dark'
                            }
                          }}
                        >
                          Forgot password?
                        </Link>
                      </Grid>
                    </Grid>
                    
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      disabled={loading || googleLoading}
                      sx={{ 
                        py: 1.5,
                        mb: 2,
                        fontSize: '1rem',
                        fontWeight: 600,
                        borderRadius: 2,
                        background: 'linear-gradient(45deg, #667eea, #764ba2)',
                        boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #5a6fd8, #6a4190)',
                          boxShadow: '0 12px 35px rgba(102, 126, 234, 0.4)',
                          transform: 'translateY(-2px)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {loading ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                    
                    <Grid container justifyContent="center">
                      <Grid item>
                        <Typography variant="body2" color="text.secondary">
                          Don't have an account?{' '}
                          <Link 
                            href="#" 
                            variant="body2" 
                            onClick={() => navigate('/signup')}
                            sx={{ 
                              textDecoration: 'none',
                              fontWeight: 600,
                              color: 'primary.main',
                              '&:hover': { 
                                textDecoration: 'underline',
                                color: 'primary.dark'
                              }
                            }}
                          >
                            Create Account
                          </Link>
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Box>
              </Paper>
            </Fade>
            
            {/* Mobile Bottom Text */}
            <Box sx={{ display: { xs: 'block', md: 'none' }, textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Secure • Reliable • Real-time Analytics
              </Typography>
            </Box>
          </Grid>

          {/* Right Side - Additional Info (Desktop only) */}
          <Grid size={{ xs: 12, md: 3 }} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Fade in timeout={1400}>
              <Box sx={{ color: 'text.primary', textAlign: 'right' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                  Why Choose Us?
                </Typography>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    • Advanced inventory tracking
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    • Real-time stock monitoring
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    • Professional PDF receipts
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    • Multi-device access
                  </Typography>
                </Box>
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'primary.main', 
                  color: 'white', 
                  borderRadius: 2,
                  textAlign: 'center'
                }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Join 1000+ businesses already using InventoryPro
                  </Typography>
                </Box>
              </Box>
            </Fade>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
} 