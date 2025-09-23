import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Box,
  Typography,
  IconButton
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function ReceiptSettings({ open, onClose }) {
  const [shopName, setShopName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (open && auth.currentUser) {
      loadReceiptSettings();
    }
  }, [open]);

  const loadReceiptSettings = async () => {
    try {
      const userDoc = doc(db, 'users', auth.currentUser.uid);
      const userData = await getDoc(userDoc);
      
      if (userData.exists() && userData.data().receiptSettings) {
        const settings = userData.data().receiptSettings;
        setShopName(settings.shopName || '');
        setPhoneNumber(settings.phoneNumber || '');
        setAddress(settings.address || '');
      }
    } catch (err) {
      console.error('Error loading receipt settings:', err);
    }
  };

  const handleSave = async () => {
    if (!auth.currentUser) {
      setError('You must be logged in to save settings');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const userDoc = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userDoc, {
        receiptSettings: {
          shopName: shopName.trim(),
          phoneNumber: phoneNumber.trim(),
          address: address.trim()
        }
      }, { merge: true });

      setSuccess('Receipt settings saved successfully!');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError('Failed to save receipt settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setSuccess('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon color="primary" />
            <Typography variant="h6">Receipt Settings</Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Configure your shop information to be displayed on receipts. This information will appear at the bottom of all your receipts.
        </Typography>

        <TextField
          fullWidth
          label="Shop Name"
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          placeholder="Enter your shop/store name"
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="Phone Number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Enter your phone number"
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter your shop address"
          multiline
          rows={3}
          sx={{ mb: 2 }}
        />

        <Box sx={{ 
          p: 2, 
          bgcolor: 'grey.50', 
          borderRadius: 1, 
          border: '1px solid',
          borderColor: 'grey.200'
        }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Receipt Preview:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {shopName ? `Thanks for shopping from ${shopName}` : 'Thanks for shopping from [Shop Name]'}
          </Typography>
          {phoneNumber && (
            <Typography variant="body2" color="text.secondary">
              Phone: {phoneNumber}
            </Typography>
          )}
          {address && (
            <Typography variant="body2" color="text.secondary">
              Address: {address}
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 