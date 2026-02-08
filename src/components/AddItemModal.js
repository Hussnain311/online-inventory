import React, { useState, useRef, useEffect } from 'react';
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
  InputAdornment,
  IconButton
} from '@mui/material';
import { Add as AddIcon, CameraAlt as CameraIcon } from '@mui/icons-material';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth } from '../firebase';
import { BrowserMultiFormatReader } from '@zxing/library';

// Barcode Scanner Dialog Component
function BarcodeScannerDialog({ open, onClose, onScan }) {
  const videoRef = useRef(null);
  const [manualCode, setManualCode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [error, setError] = useState('');
  const codeReaderRef = useRef(null);
  const isScanningRef = useRef(false);

  useEffect(() => {
    if (open && !showManualInput) {
      startScanning();
    } else {
      stopScanning();
    }
    return () => stopScanning();
  }, [open, showManualInput]);

  const startScanning = async () => {
    if (isScanningRef.current) return;
    try {
      setError('');
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;
      isScanningRef.current = true;

      const videoInputDevices = await codeReader.listVideoInputDevices();
      if (videoInputDevices.length === 0) {
        setError('No camera found. Please use manual input.');
        setShowManualInput(true);
        return;
      }

      const selectedDeviceId = videoInputDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear')
      )?.deviceId || videoInputDevices[0].deviceId;

      await codeReader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result) => {
          if (result && isScanningRef.current) {
            const code = result.getText();
            isScanningRef.current = false;
            onScan(code);
            stopScanning();
            onClose();
          }
        }
      );
    } catch (err) {
      console.error('Camera error:', err);
      setError('Camera access denied. Please use manual input.');
      setShowManualInput(true);
    }
  };

  const stopScanning = () => {
    isScanningRef.current = false;
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      codeReaderRef.current = null;
    }
  };

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      setManualCode('');
      onClose();
    }
  };

  const handleClose = () => {
    stopScanning();
    setManualCode('');
    setShowManualInput(false);
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CameraIcon color="primary" />
          <Typography variant="h6">Scan Barcode / QR Code</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {!showManualInput ? (
            <>
              <Box sx={{ 
                position: 'relative', 
                bgcolor: 'black', 
                borderRadius: 2, 
                overflow: 'hidden',
                mb: 2,
                height: 250
              }}>
                <video
                  ref={videoRef}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  muted
                  playsInline
                />
                <Box sx={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none'
                }}>
                  <Box sx={{
                    width: 200,
                    height: 100,
                    border: '3px solid #3b82f6',
                    borderRadius: 1,
                    position: 'relative'
                  }}>
                    <Box sx={{ position: 'absolute', top: -6, left: -6, width: 20, height: 20, borderTop: '4px solid #3b82f6', borderLeft: '4px solid #3b82f6' }} />
                    <Box sx={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderTop: '4px solid #3b82f6', borderRight: '4px solid #3b82f6' }} />
                    <Box sx={{ position: 'absolute', bottom: -6, left: -6, width: 20, height: 20, borderBottom: '4px solid #3b82f6', borderLeft: '4px solid #3b82f6' }} />
                    <Box sx={{ position: 'absolute', bottom: -6, right: -6, width: 20, height: 20, borderBottom: '4px solid #3b82f6', borderRight: '4px solid #3b82f6' }} />
                  </Box>
                </Box>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    position: 'absolute', 
                    bottom: 8, 
                    left: '50%',
                    transform: 'translateX(-50%)',
                    color: 'white',
                    bgcolor: 'rgba(0,0,0,0.6)',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1
                  }}
                >
                  Position barcode within frame
                </Typography>
              </Box>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              <Button
                variant="outlined"
                fullWidth
                onClick={() => setShowManualInput(true)}
              >
                Type Code Manually
              </Button>
            </>
          ) : (
            <Box sx={{ py: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                Enter the item code manually
              </Typography>
              <TextField
                fullWidth
                label="Barcode / QR Code / Any Code"
                placeholder="Enter unique code"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleManualSubmit(); }}
                autoFocus
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => { setShowManualInput(false); setManualCode(''); }}
                  sx={{ flex: 1 }}
                >
                  Use Camera
                </Button>
                <Button
                  variant="contained"
                  onClick={handleManualSubmit}
                  disabled={!manualCode.trim()}
                  sx={{ flex: 1 }}
                >
                  Add Code
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function AddItemModal({ open, onClose, onItemAdded }) {
  const [formData, setFormData] = useState({
    name: '',
    itemCode: '',
    price: '',
    quantity: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleScan = (code) => {
    setFormData(prev => ({ ...prev, itemCode: code }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

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
      const itemData = {
        name: formData.name.trim(),
        itemCode: formData.itemCode.trim(),
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'inventory'), itemData);
      
      setFormData({ name: '', itemCode: '', price: '', quantity: '' });
      onItemAdded();
      onClose();
    } catch (err) {
      setError('Failed to add item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({ name: '', itemCode: '', price: '', quantity: '' });
      setError('');
      onClose();
    }
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AddIcon color="primary" />
            <Typography variant="h6">Add New Item</Typography>
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
              label="Unique Code (Barcode/QR/Digits)"
              name="itemCode"
              value={formData.itemCode}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Scan or type code"
              sx={{ mb: 1 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton 
                      onClick={() => setScannerOpen(true)}
                      disabled={loading}
                      edge="end"
                      title="Scan with camera"
                    >
                      <CameraIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mb: 3, display: 'block' }}>
              Click camera icon to scan QR/Barcode, or type manually
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
              startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
            >
              {loading ? 'Adding...' : 'Add Item'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <BarcodeScannerDialog
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScan}
      />
    </>
  );
}