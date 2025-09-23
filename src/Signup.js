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
  Stepper,
  Step,
  StepLabel,
  useTheme
} from '@mui/material';
import {
  PersonAddAlt as PersonAddAltIcon,
  Email as EmailIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Person as PersonIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Google as GoogleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { auth } from './firebase';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

export default function Signup() {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }
    if (!name) {
      setError('Please enter your full name.');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, {
        displayName: name
      });
      alert('Account created successfully! Please sign in.');
      navigate('/login');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please choose a stronger password.');
      } else {
        setError('Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setGoogleLoading(true);
    
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      // Try popup first
      try {
        const result = await signInWithPopup(auth, provider);
        console.log('Google sign-up successful:', result.user);
        navigate('/inventory');
        return;
      } catch (popupError) {
        console.log('Popup failed, trying redirect:', popupError);
        
        // Fallback to redirect if popup fails
        if (popupError.code === 'auth/popup-blocked' || popupError.code === 'auth/internal-error') {
          setError('Google sign-in is not configured yet. Please use email/password sign-up for now.');
          return;
        }
        throw popupError;
      }
    } catch (err) {
      console.error('Google sign-up error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-up was cancelled. Please try again.');
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        setError('An account already exists with this email. Please use email/password sign-in.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked by your browser. Please allow popups and try again.');
      } else if (err.code === 'auth/internal-error') {
        setError('Google sign-in is not configured yet. Please use email/password sign-up for now.');
      } else {
        setError(`Failed to sign up with Google: ${err.message}`);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const steps = ['Account Details', 'Security Setup', 'Ready to Go!'];

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
          top: '15%',
          right: '10%',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          animation: 'float 6s ease-in-out infinite reverse',
          '@keyframes float': {
            '0%, 100%': { transform: 'translateY(0px)' },
            '50%': { transform: 'translateY(-20px)' }
          }
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '15%',
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.08)',
          animation: 'float 8s ease-in-out infinite',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '15%',
          right: '20%',
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.06)',
          animation: 'float 7s ease-in-out infinite reverse',
        }}
      />

      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        <Grid container spacing={{ xs: 2, md: 6 }} alignItems="center" sx={{ minHeight: { xs: 'auto', md: '80vh' } }}>
          {/* Left Side - Welcome Text (Desktop only) */}
          <Grid size={{ xs: 12, md: 5 }} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Fade in timeout={1000}>
              <Box sx={{ color: 'text.primary', textAlign: 'left', mb: { xs: 4, md: 0 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <InventoryIcon sx={{ fontSize: 36, mr: 2, color: 'primary.main' }} />
                  <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
                    InventoryPro
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main', mb: 2 }}>
                  Join Our Community! 🚀
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
                  Create your account and start managing your inventory like a pro
                </Typography>
                
                {/* Feature Highlights */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CheckCircleIcon sx={{ mr: 2, fontSize: 20, color: 'primary.main' }} />
                    <Typography variant="body2" color="text.secondary">Free Forever Plan</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <SecurityIcon sx={{ mr: 2, fontSize: 20, color: 'primary.main' }} />
                    <Typography variant="body2" color="text.secondary">Enterprise Security</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingUpIcon sx={{ mr: 2, fontSize: 20, color: 'primary.main' }} />
                    <Typography variant="body2" color="text.secondary">Advanced Analytics</Typography>
                  </Box>
                </Box>

                {/* Progress Steps */}
                <Box sx={{ mt: 4, display: { xs: 'none', md: 'block' } }}>
                  <Stepper activeStep={0} orientation="vertical" sx={{ '& .MuiStepLabel-root': { color: 'text.primary' } }}>
                    {steps.map((label) => (
                      <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                </Box>
              </Box>
            </Fade>
          </Grid>

          {/* Center - Signup Form */}
          <Grid size={{ xs: 12, md: 2 }}>
            {/* Mobile Welcome Text */}
            <Box sx={{ display: { xs: 'block', md: 'none' }, textAlign: 'center', mb: 3, px: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <InventoryIcon sx={{ fontSize: 28, mr: 1, color: 'primary.main' }} />
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
                  InventoryPro
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
                Join Our Community! 🚀
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, px: 2 }}>
                Create your account and start managing your inventory today
              </Typography>
            </Box>
            <Fade in timeout={1200}>
              <Paper 
                elevation={8} 
                sx={{ 
                  p: { xs: 2, md: 4 }, 
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
                  maxWidth: { xs: '100%', md: 400 },
                  mx: 'auto',
                  width: '100%',
                  // Mobile optimizations
                  '& .MuiTextField-root': {
                    mb: { xs: 2, md: 3 }
                  },
                  '& .MuiButton-root': {
                    py: { xs: 1.5, md: 1.8 },
                    fontSize: { xs: '0.9rem', md: '1rem' }
                  }
                }}
              >
                {/* Decorative Elements */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: -50,
                    left: -50,
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
                      m: 2, 
                      bgcolor: 'secondary.main',
                      width: { xs: 60, md: 80 },
                      height: { xs: 60, md: 80 },
                      boxShadow: '0 8px 32px rgba(124, 58, 237, 0.3)',
                      border: '4px solid white'
                    }}
                  >
                    <PersonAddAltIcon sx={{ fontSize: { xs: 30, md: 40 } }} />
                  </Avatar>
                  
                  <Typography component="h1" variant="h4" sx={{ mb: 1, fontWeight: 700, color: 'text.primary', fontSize: { xs: '1.5rem', md: '2rem' } }}>
                    Create Account
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
                    Start your inventory management journey
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
                  
                  {/* Google Sign Up Button */}
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={googleLoading ? <CircularProgress size={20} /> : <GoogleIcon />}
                    onClick={() => {
                      console.log('Google sign-up button clicked');
                      handleGoogleSignUp();
                    }}
                    disabled={loading || googleLoading}
                    sx={{ 
                      py: 1.5,
                      mb: 3,
                      fontSize: '1rem',
                      fontWeight: 600,
                      borderRadius: 2,
                      borderColor: '#4285f4',
                      color: '#4285f4',
                      '&:hover': {
                        borderColor: '#3367d6',
                        backgroundColor: 'rgba(66, 133, 244, 0.04)',
                        transform: 'translateY(-1px)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {googleLoading ? 'Signing up...' : 'Continue with Google'}
                  </Button>
                  
                  <Divider sx={{ width: '100%', mb: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      OR
                    </Typography>
                  </Divider>
                  
                  <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      id="name"
                      label="Full Name"
                      name="name"
                      autoComplete="name"
                      autoFocus
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={loading || googleLoading}
                      sx={{ mb: 3 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                    
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      id="email"
                      label="Email Address"
                      name="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading || googleLoading}
                      sx={{ mb: 3 }}
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
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading || googleLoading}
                      sx={{ mb: 3 }}
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
                    
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      name="confirmPassword"
                      label="Confirm Password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading || googleLoading}
                      sx={{ mb: 3 }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              edge="end"
                            >
                              {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      disabled={loading || googleLoading}
                      sx={{ 
                        py: 1.8,
                        mb: 3,
                        fontSize: '1.1rem',
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
                        'Create Account'
                      )}
                    </Button>
                    
                    <Grid container justifyContent="center">
                      <Grid item>
                        <Typography variant="body2" color="text.secondary">
                          Already have an account?{' '}
                          <Link 
                            href="#" 
                            variant="body2" 
                            onClick={() => navigate('/login')}
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
                            Sign In
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
                Free Forever • Enterprise Security • Advanced Analytics
              </Typography>
            </Box>
          </Grid>

          {/* Right Side - Additional Info (Desktop only) */}
          <Grid size={{ xs: 12, md: 5 }} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Fade in timeout={1400}>
              <Box sx={{ color: 'text.primary', textAlign: 'right' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                  Get Started Today
                </Typography>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    ✓ No credit card required
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    ✓ Setup in under 5 minutes
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    ✓ 24/7 customer support
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    ✓ Free forever plan
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