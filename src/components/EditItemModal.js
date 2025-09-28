import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { db } from '../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export default function EditItemModal({ open, onClose, item, onItemUpdated }) {
  const [formData, setFormData] = useState({
    name: '',
    itemCode: '',
    buyerPrice: '',
    sellerPrice: '',
    quantity: '',
    boxNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        itemCode: item.itemCode || '',
        buyerPrice: item.buyerPrice || '',
        sellerPrice: item.sellerPrice || '',
        quantity: item.quantity || '',
        boxNumber: item.boxNumber || ''
      });
    }
  }, [item, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!formData.name.trim()) {
      setError('Item name is required');
      setLoading(false);
      return;
    }
    if (!formData.itemCode.trim()) {
      setError('Item code is required');
      setLoading(false);
      return;
    }
    if (!formData.buyerPrice || parseFloat(formData.buyerPrice) <= 0) {
      setError('Buyer price must be greater than 0');
      setLoading(false);
      return;
    }
    if (!formData.sellerPrice || parseFloat(formData.sellerPrice) <= 0) {
      setError('Seller price must be greater than 0');
      setLoading(false);
      return;
    }
    if (!formData.quantity || parseInt(formData.quantity) < 0) {
      setError('Quantity must be 0 or greater');
      setLoading(false);
      return;
    }

    try {
      const itemRef = doc(db, 'inventory', item.id);
      await updateDoc(itemRef, {
        name: formData.name.trim(),
        itemCode: formData.itemCode.trim(),
        buyerPrice: parseFloat(formData.buyerPrice),
        sellerPrice: parseFloat(formData.sellerPrice),
        quantity: parseInt(formData.quantity),
        boxNumber: formData.boxNumber.trim() || '',
        updatedAt: serverTimestamp()
      });
      onItemUpdated();
      onClose();
    } catch (err) {
      setError('Failed to update item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EditIcon color="primary" />
          <Typography variant="h6">Edit Item</Typography>
        </Box>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <TextField
            fullWidth
            label="Item Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={loading}
            sx={{ mb: 3 }}
          />
          
          <TextField
            fullWidth
            label="Item Code (Barcode/QR)"
            name="itemCode"
            value={formData.itemCode}
            onChange={handleChange}
            required
            disabled={loading}
            placeholder="Enter barcode, QR code, or unique identifier"
            sx={{ mb: 3 }}
          />
          
          <TextField
            fullWidth
            label="Buyer Price"
            name="buyerPrice"
            type="number"
            value={formData.buyerPrice}
            onChange={handleChange}
            required
            disabled={loading}
            InputProps={{
              startAdornment: <InputAdornment position="start">PKR</InputAdornment>,
            }}
            sx={{ mb: 3 }}
          />
          
          <TextField
            fullWidth
            label="Seller Price"
            name="sellerPrice"
            type="number"
            value={formData.sellerPrice}
            onChange={handleChange}
            required
            disabled={loading}
            InputProps={{
              startAdornment: <InputAdornment position="start">PKR</InputAdornment>,
            }}
            sx={{ mb: 3 }}
          />
          
          <TextField
            fullWidth
            label="Quantity"
            name="quantity"
            type="number"
            value={formData.quantity}
            onChange={handleChange}
            required
            disabled={loading}
            inputProps={{ min: 0 }}
            sx={{ mb: 3 }}
          />
          
          <TextField
            fullWidth
            label="Box/Rack Number"
            name="boxNumber"
            value={formData.boxNumber}
            onChange={handleChange}
            placeholder="e.g., A-1, B-2, Rack-3"
            disabled={loading}
          />
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <EditIcon />}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
} 