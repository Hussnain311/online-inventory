import React, { useEffect, useState } from 'react';
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
  CircularProgress
} from '@mui/material';
import { Edit as EditIcon, Lock as LockIcon } from '@mui/icons-material';
import { db } from '../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export default function EditItemModal({ open, onClose, item, onItemUpdated }) {
  const [formData, setFormData] = useState({
    price: '',
    quantity: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (item && open) {
      setFormData({
        price: item.price?.toString() || '',
        quantity: item.quantity?.toString() || ''
      });
    }
  }, [item, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!item) {
      setError('No item selected');
      setLoading(false);
      return;
    }

    // Validation - only price and quantity can be updated
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('Price must be greater than 0');
      setLoading(false);
      return;
    }
    if (formData.quantity === '' || parseInt(formData.quantity) < 0) {
      setError('Quantity must be 0 or greater');
      setLoading(false);
      return;
    }

    try {
      const itemRef = doc(db, 'inventory', item.id);
      await updateDoc(itemRef, {
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
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

  if (!item) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EditIcon color="primary" />
          <Typography variant="h6">Update Item</Typography>
        </Box>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Fixed Fields - Display Only (Cannot be changed) */}
          <Box sx={{ mb: 4, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              <LockIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
              These fields cannot be changed:
            </Typography>
            
            <TextField
              fullWidth
              label="Item Name"
              value={item.name}
              disabled
              sx={{ mb: 2 }}
              InputProps={{ readOnly: true }}
            />
            
            <TextField
              fullWidth
              label="Item Code"
              value={item.itemCode}
              disabled
              InputProps={{ readOnly: true }}
            />
          </Box>

          <Typography variant="subtitle2" color="primary" sx={{ mb: 2 }}>
            You can only update these fields:
          </Typography>

          <TextField
            fullWidth
            label="Price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={handleChange}
            required
            disabled={loading}
            sx={{ mb: 3 }}
          />
          
          <TextField
            fullWidth
            label="Quantity"
            name="quantity"
            type="number"
            min="0"
            value={formData.quantity}
            onChange={handleChange}
            required
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