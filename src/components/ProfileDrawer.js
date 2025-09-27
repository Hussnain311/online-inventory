import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Switch,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton,
  Chip
} from '@mui/material';
import {
  Person as PersonIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Close as CloseIcon,
  PhotoCamera as PhotoCameraIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { auth, db } from '../firebase';
import { updateProfile, deleteUser } from 'firebase/auth';
import { deleteDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import ProfilePictureUpload from './ProfilePictureUpload';
import ReceiptSettings from './ReceiptSettings';

export default function ProfileDrawer({ open, onClose, user, onThemeChange, isDarkMode }) {
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [photoUploadOpen, setPhotoUploadOpen] = useState(false);
  const [receiptSettingsOpen, setReceiptSettingsOpen] = useState(false);
  const [newName, setNewName] = useState(user?.displayName || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogout = () => {
    auth.signOut();
    navigate('/login');
    onClose();
  };

  const handleUpdateProfile = async () => {
    if (!newName.trim()) {
      setError('Name cannot be empty');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await updateProfile(auth.currentUser, {
        displayName: newName.trim()
      });
      setProfileDialogOpen(false);
    } catch (err) {
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    setError('');
    try {
      // Delete user's inventory data first
      const userInventoryQuery = await db.collection('inventory').where('userId', '==', user.uid).get();
      const deletePromises = userInventoryQuery.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      // Delete the user account
      await deleteUser(auth.currentUser);
      navigate('/login');
    } catch (err) {
      setError('Failed to delete account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    {
      text: 'Profile Settings',
      icon: <PersonIcon />,
      onClick: () => setProfileDialogOpen(true)
    },
    {
      text: 'Receipt Settings',
      icon: <ReceiptIcon />,
      onClick: () => setReceiptSettingsOpen(true)
    },
    {
      text: 'Settings',
      icon: <SettingsIcon />,
      onClick: () => {} // Placeholder for future settings
    }
  ];

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: 320,
            bgcolor: 'background.paper',
            borderLeft: '1px solid',
            borderColor: 'divider'
          }
        }}
      >
        <Box sx={{ p: 3 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Profile
            </Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          {/* User Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Box sx={{ position: 'relative', mr: 2 }}>
              <Avatar
                src={user?.photoURL}
                sx={{ 
                  width: 64, 
                  height: 64, 
                  bgcolor: 'primary.main',
                  cursor: 'pointer',
                  '&:hover': { opacity: 0.8 }
                }}
                onClick={() => setPhotoUploadOpen(true)}
              >
                {user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
              </Avatar>
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  bgcolor: 'primary.main',
                  borderRadius: '50%',
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'primary.dark' }
                }}
                onClick={() => setPhotoUploadOpen(true)}
              >
                <PhotoCameraIcon sx={{ fontSize: 14, color: 'white' }} />
              </Box>
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {user?.displayName || 'User'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
              <Chip 
                label="Active" 
                color="success" 
                size="small" 
                sx={{ mt: 1 }}
              />
            </Box>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Menu Items */}
          <List>
            {menuItems.map((item, index) => (
              <ListItem
                key={index}
                button
                onClick={item.onClick}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
              >
                <ListItemIcon sx={{ color: 'primary.main' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}

            {/* Theme Toggle */}
            <ListItem sx={{ borderRadius: 2, mb: 1 }}>
              <ListItemIcon sx={{ color: 'primary.main' }}>
                {isDarkMode ? <DarkModeIcon /> : <LightModeIcon />}
              </ListItemIcon>
              <ListItemText primary="Dark Mode" />
              <Switch
                checked={isDarkMode}
                onChange={onThemeChange}
                color="primary"
              />
            </ListItem>
          </List>

          <Divider sx={{ my: 2 }} />

          {/* Logout Button */}
          <Button
            fullWidth
            variant="outlined"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{
              borderColor: 'error.main',
              color: 'error.main',
              '&:hover': {
                borderColor: 'error.dark',
                bgcolor: 'error.main',
                color: 'white'
              }
            }}
          >
            Logout
          </Button>
        </Box>
      </Drawer>

      {/* Profile Settings Dialog */}
      <Dialog open={profileDialogOpen} onClose={() => setProfileDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditIcon color="primary" />
            <Typography variant="h6">Profile Settings</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            fullWidth
            label="Display Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProfileDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateProfile}
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Profile'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteIcon color="error" />
            <Typography variant="h6" color="error">Delete Account</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Typography variant="body1" sx={{ mt: 2 }}>
            Are you sure you want to permanently delete your account? This action cannot be undone and will remove all your inventory data.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteAccount}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete Account'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Profile Picture Upload Dialog */}
      <ProfilePictureUpload
        open={photoUploadOpen}
        onClose={() => setPhotoUploadOpen(false)}
        currentPhotoURL={user?.photoURL}
        onPhotoUpdated={(newPhotoURL) => {
          // Update local state if needed
          console.log('Profile photo updated:', newPhotoURL);
        }}
      />

      {/* Receipt Settings Dialog */}
      <ReceiptSettings
        open={receiptSettingsOpen}
        onClose={() => setReceiptSettingsOpen(false)}
      />
    </>
  );
} 